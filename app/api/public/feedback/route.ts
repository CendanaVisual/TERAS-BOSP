import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const feedbackSchema = z.object({
  senderName: z.string().trim().min(2, "Nama pengirim minimal 2 karakter").max(100),
  senderRole: z.string().trim().min(2, "Peran pengirim wajib dipilih").max(60),
  contact: z.string().trim().min(4, "Kontak (HP/Email) minimal 4 karakter").max(100),
  message: z.string().trim().min(10, "Pesan/aspirasi minimal 10 karakter").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Data formulir tidak valid.",
        },
        { status: 400 }
      );
    }

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
        message: "Terima kasih! Aspirasi/pengaduan Anda telah diterima dan diteruskan ke pengelola sekolah.",
        id: created.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving public feedback:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan pengaduan." },
      { status: 500 }
    );
  }
}
