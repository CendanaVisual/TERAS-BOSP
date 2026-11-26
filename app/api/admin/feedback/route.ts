import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchFeedbackSchema = z.object({
  id: z.string().min(1),
  isRead: z.boolean().optional(),
  adminNote: z.string().max(1000).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedbacks = await prisma.publicFeedback.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ feedbacks });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = patchFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const updated = await prisma.publicFeedback.update({
      where: { id: parsed.data.id },
      data: {
        isRead: parsed.data.isRead,
        adminNote:
          parsed.data.adminNote !== undefined ? parsed.data.adminNote : undefined,
      },
    });

    return NextResponse.json({ feedback: updated });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pengaduan." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    }
    await prisma.publicFeedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pengaduan." },
      { status: 500 }
    );
  }
}
