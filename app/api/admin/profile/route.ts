import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(3, "Nama sekolah wajib diisi").max(150),
  npsn: z.string().trim().min(4, "NPSN wajib diisi").max(20),
  address: z.string().trim().min(5, "Alamat sekolah wajib diisi").max(300),
  headmaster: z.string().trim().min(3, "Nama Kepala Sekolah wajib diisi").max(150),
  treasurer: z.string().trim().min(3, "Nama Bendahara wajib diisi").max(150),
  phone: z.string().trim().max(50).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  district: z.string().trim().max(120).optional().default(""),
  province: z.string().trim().max(120).optional().default(""),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.schoolProfile.findFirst();
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data profil sekolah tidak valid." },
        { status: 400 }
      );
    }

    const existing = await prisma.schoolProfile.findFirst();
    const profile = existing
      ? await prisma.schoolProfile.update({
          where: { id: existing.id },
          data: parsed.data,
        })
      : await prisma.schoolProfile.create({ data: parsed.data });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating school profile:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan profil sekolah." },
      { status: 500 }
    );
  }
}
