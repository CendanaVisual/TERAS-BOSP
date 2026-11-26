import { FundSource, PublishStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { normalizeBospComponent } from "@/lib/bosp-constants";
import { serializeBudgetPeriod } from "@/lib/bosp-queries";
import { prisma } from "@/lib/prisma";
import { storeOfficialDocument } from "@/lib/storage";

const patchPeriodSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  notes: z.string().nullable().optional(),
  openingBalance: z.number().nonnegative().optional(),
  regularReceived: z.number().nonnegative().optional(),
  performanceReceived: z.number().nonnegative().optional(),
  totalReceived: z.number().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional(),
  endingBalance: z.number().optional(),
  expenses: z
    .array(
      z.object({
        componentCategory: z.string().min(1),
        accountCode: z.string().min(1),
        description: z.string().min(1),
        fundSource: z.enum(["BOSP_REGULER", "BOSP_KINERJA"]),
        plannedAmount: z.number().nonnegative(),
        realizedAmount: z.number().nonnegative(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.budgetPeriod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Periode anggaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // Handle replacing PDF/Excel official attachment via multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "File lampiran PDF/Excel wajib dipilih." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await storeOfficialDocument(buffer, file.name, file.type);

      const updated = await prisma.budgetPeriod.update({
        where: { id },
        data: {
          documentUrl: stored.url || null,
          documentName: stored.fileName,
          documentMimeType: stored.mimeType,
        },
        include: {
          expenses: {
            orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
          },
        },
      });

      return NextResponse.json({
        period: serializeBudgetPeriod(updated),
        warning: stored.warning,
      });
    }

    const body = await request.json();
    const parsed = patchPeriodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data pembaruan tidak valid." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const updated = await prisma.$transaction(async (tx) => {
      if (d.expenses) {
        await tx.expenseItem.deleteMany({ where: { budgetPeriodId: id } });
        await tx.expenseItem.createMany({
          data: d.expenses.map((item) => ({
            budgetPeriodId: id,
            componentCategory: normalizeBospComponent(item.componentCategory),
            accountCode: item.accountCode.trim(),
            description: item.description.trim(),
            fundSource: item.fundSource as FundSource,
            plannedAmount: item.plannedAmount,
            realizedAmount: item.realizedAmount,
          })),
        });
      }

      return tx.budgetPeriod.update({
        where: { id },
        data: {
          status: d.status as PublishStatus | undefined,
          publishedAt:
            d.status === "PUBLISHED"
              ? existing.publishedAt ?? new Date()
              : d.status === "DRAFT"
              ? null
              : undefined,
          notes: d.notes !== undefined ? d.notes : undefined,
          openingBalance: d.openingBalance,
          regularReceived: d.regularReceived,
          performanceReceived: d.performanceReceived,
          totalReceived: d.totalReceived,
          totalSpent: d.totalSpent,
          endingBalance: d.endingBalance,
        },
        include: {
          expenses: {
            orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
          },
        },
      });
    });

    return NextResponse.json({ period: serializeBudgetPeriod(updated) });
  } catch (error) {
    console.error("Error updating budget period:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui laporan anggaran." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.budgetPeriod.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget period:", error);
    return NextResponse.json(
      { error: "Gagal menghapus laporan anggaran." },
      { status: 500 }
    );
  }
}
