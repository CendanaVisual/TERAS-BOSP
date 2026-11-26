import { BudgetStage, FundSource, PublishStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { normalizeBospComponent } from "@/lib/bosp-constants";
import { serializeBudgetPeriod } from "@/lib/bosp-queries";
import { prisma } from "@/lib/prisma";

const expenseInputSchema = z.object({
  componentCategory: z.string().min(1),
  accountCode: z.string().min(1),
  description: z.string().min(1),
  fundSource: z.enum(["BOSP_REGULER", "BOSP_KINERJA"]),
  plannedAmount: z.number().nonnegative(),
  realizedAmount: z.number().nonnegative(),
});

const createPeriodSchema = z.object({
  fiscalYear: z.number().int().min(2015).max(2040),
  stage: z.enum(["TAHAP_1", "TAHAP_2", "TAHUNAN"]),
  openingBalance: z.number().nonnegative(),
  regularReceived: z.number().nonnegative(),
  performanceReceived: z.number().nonnegative(),
  totalReceived: z.number().nonnegative(),
  totalSpent: z.number().nonnegative(),
  endingBalance: z.number(),
  documentUrl: z.string().nullable().optional(),
  documentName: z.string().nullable().optional(),
  documentMimeType: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
  notes: z.string().nullable().optional(),
  expenses: z.array(expenseInputSchema).min(1, "Minimal 1 rincian belanja harus ada"),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periods = await prisma.budgetPeriod.findMany({
    orderBy: [{ fiscalYear: "desc" }, { updatedAt: "desc" }],
    include: {
      expenses: {
        orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
      },
    },
  });

  return NextResponse.json({
    periods: periods.map(serializeBudgetPeriod),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createPeriodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data periode anggaran tidak valid." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const computedSpent = d.expenses.reduce(
      (sum, item) => sum + item.realizedAmount,
      0
    );
    const totalSpent = d.totalSpent > 0 ? d.totalSpent : computedSpent;
    const totalReceived =
      d.totalReceived > 0
        ? d.totalReceived
        : d.regularReceived + d.performanceReceived;
    const endingBalance = d.openingBalance + totalReceived - totalSpent;

    const created = await prisma.budgetPeriod.create({
      data: {
        fiscalYear: d.fiscalYear,
        stage: d.stage as BudgetStage,
        openingBalance: d.openingBalance,
        regularReceived: d.regularReceived,
        performanceReceived: d.performanceReceived,
        totalReceived,
        totalSpent,
        endingBalance,
        documentUrl: d.documentUrl || null,
        documentName: d.documentName || null,
        documentMimeType: d.documentMimeType || null,
        status: d.status as PublishStatus,
        publishedAt: d.status === "PUBLISHED" ? new Date() : null,
        notes: d.notes || null,
        expenses: {
          create: d.expenses.map((item) => ({
            componentCategory: normalizeBospComponent(item.componentCategory),
            accountCode: item.accountCode.trim(),
            description: item.description.trim(),
            fundSource: item.fundSource as FundSource,
            plannedAmount: item.plannedAmount,
            realizedAmount: item.realizedAmount,
          })),
        },
      },
      include: {
        expenses: {
          orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
        },
      },
    });

    return NextResponse.json(
      { period: serializeBudgetPeriod(created) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating budget period:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan laporan anggaran." },
      { status: 500 }
    );
  }
}
