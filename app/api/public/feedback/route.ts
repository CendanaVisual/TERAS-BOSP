import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getDatabaseErrorMessage,
  getSanitizedDatabaseUrl,
  prisma,
} from "@/lib/prisma";

const feedbackSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(2, "Nama pengirim minimal 2 karakter")
    .max(100),
  senderRole: z
    .string()
    .trim()
    .min(2, "Peran pengirim wajib dipilih")
    .max(60),
  contact: z
    .string()
    .trim()
    .min(3, "Kontak (No. HP/WhatsApp/Email) minimal 3 karakter")
    .max(100),
  message: z
    .string()
    .trim()
    .min(5, "Pesan/aspirasi minimal 5 karakter")
    .max(2000),
});

export async function POST(request: NextRequest) {
  if (!getSanitizedDatabaseUrl()) {
    return NextResponse.json(
      {
        error:
          "Layanan penyimpanan aspirasi belum terhubung ke database server. Pastikan Environment Variable DATABASE_URL sudah dikonfigurasi di Vercel.",
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
      { error: "Format data formulir tidak valid." },
      { status: 400 }
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message || "Data formulir tidak valid.",
      },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.publicFeedback.create({
      data: {
        senderName: parsed.data.senderName,
        senderRole: parsed.data.senderRole,
        contact: parsed.data.contact,
        message: parsed.data.message,
      },
    });

    return NextResponse.json(
      {
        message:
          "Terima kasih! Aspirasi/pengaduan Anda telah diterima dan diteruskan ke pengelola sekolah.",
        id: created.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving public feedback:", error);
    const dbErr = getDatabaseErrorMessage(error, "menyimpan pengaduan");
    return NextResponse.json(
      { error: dbErr.message, code: dbErr.code },
      { status: dbErr.status }
    );
  }
}
