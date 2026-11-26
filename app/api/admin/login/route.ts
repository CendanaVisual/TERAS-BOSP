import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  setSessionCookie,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";
import {
  getDatabaseErrorMessage,
  getSanitizedDatabaseUrl,
  prisma,
} from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: NextRequest) {
  if (!getSanitizedDatabaseUrl()) {
    return NextResponse.json(
      {
        error:
          "Koneksi database belum terpasang di server. Tambahkan Environment Variable DATABASE_URL (Neon PostgreSQL) pada dashboard Vercel lalu lakukan Redeploy.",
        code: "MISSING_DATABASE_URL",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan login tidak valid." },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Input login tidak valid." },
      { status: 400 }
    );
  }

  try {
    const emailNormalized = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        return NextResponse.json(
          {
            error:
              "Akun admin belum tersedia di database. Jalankan 'npm run db:seed' untuk menginisialisasi akun admin.",
            code: "NO_ADMIN_USER",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Email atau password salah. Periksa kembali kredensial Anda." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email atau password salah. Periksa kembali kredensial Anda." },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const isHttps =
      request.nextUrl.protocol === "https:" || forwardedProto === "https";

    await setSessionCookie(token, isHttps);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const dbErr = getDatabaseErrorMessage(error, "memproses login admin");
    return NextResponse.json(
      { error: dbErr.message, code: dbErr.code },
      { status: dbErr.status }
    );
  }
}
