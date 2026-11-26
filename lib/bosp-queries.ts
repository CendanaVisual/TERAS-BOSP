import { BudgetStage, FundSource, PublishStatus } from "@prisma/client";
import { prisma } from "./prisma";
import {
  BOSP_COMPONENTS,
  BOSP_COMPONENT_COLORS,
  BOSP_COMPONENT_SHORT_LABELS,
  formatPercentage,
  normalizeBospComponent,
} from "./bosp-constants";
import { toNumber } from "./utils";

export interface SerializedExpenseItem {
  id: string;
  budgetPeriodId: string;
  componentCategory: string;
  accountCode: string;
  description: string;
  fundSource: FundSource;
  plannedAmount: number;
  realizedAmount: number;
  absorptionPct: number;
}

export interface ComponentBreakdownItem {
  component: string;
  shortLabel: string;
  color: string;
  plannedAmount: number;
  realizedAmount: number;
  absorptionPct: number;
  shareOfSpentPct: number;
  itemCount: number;
}

export interface SerializedBudgetPeriod {
  id: string;
  fiscalYear: number;
  stage: BudgetStage;
  openingBalance: number;
  totalReceived: number;
  regularReceived: number;
  performanceReceived: number;
  totalSpent: number;
  endingBalance: number;
  documentUrl: string | null;
  documentName: string | null;
  documentMimeType: string | null;
  status: PublishStatus;
  publishedAt: string | null;
  notes: string | null;
  updatedAt: string;
  expenses: SerializedExpenseItem[];
  componentBreakdown: ComponentBreakdownItem[];
}

export interface SerializedSchoolProfile {
  id: string;
  name: string;
  npsn: string;
  address: string;
  headmaster: string;
  treasurer: string;
  phone: string;
  email: string;
  district: string;
  province: string;
  updatedAt: string;
}

export function serializeBudgetPeriod(
  period: {
    id: string;
    fiscalYear: number;
    stage: BudgetStage;
    openingBalance: unknown;
    totalReceived: unknown;
    regularReceived: unknown;
    performanceReceived: unknown;
    totalSpent: unknown;
    endingBalance: unknown;
    documentUrl: string | null;
    documentName: string | null;
    documentMimeType: string | null;
    status: PublishStatus;
    publishedAt: Date | null;
    notes: string | null;
    updatedAt: Date;
    expenses: Array<{
      id: string;
      budgetPeriodId: string;
      componentCategory: string;
      accountCode: string;
      description: string;
      fundSource: FundSource;
      plannedAmount: unknown;
      realizedAmount: unknown;
    }>;
  }
): SerializedBudgetPeriod {
  const expenses: SerializedExpenseItem[] = period.expenses.map((item) => {
    const plannedAmount = toNumber(item.plannedAmount);
    const realizedAmount = toNumber(item.realizedAmount);
    return {
      id: item.id,
      budgetPeriodId: item.budgetPeriodId,
      componentCategory: normalizeBospComponent(item.componentCategory),
      accountCode: item.accountCode,
      description: item.description,
      fundSource: item.fundSource,
      plannedAmount,
      realizedAmount,
      absorptionPct: formatPercentage(realizedAmount, plannedAmount),
    };
  });

  const totalSpent = toNumber(period.totalSpent);

  const grouped = new Map<
    string,
    { planned: number; realized: number; count: number }
  >();
  for (const comp of BOSP_COMPONENTS) {
    grouped.set(comp, { planned: 0, realized: 0, count: 0 });
  }
  for (const exp of expenses) {
    const prev = grouped.get(exp.componentCategory) ?? {
      planned: 0,
      realized: 0,
      count: 0,
    };
    prev.planned += exp.plannedAmount;
    prev.realized += exp.realizedAmount;
    prev.count += 1;
    grouped.set(exp.componentCategory, prev);
  }

  const componentBreakdown: ComponentBreakdownItem[] = BOSP_COMPONENTS.map(
    (comp) => {
      const agg = grouped.get(comp)!;
      return {
        component: comp,
        shortLabel: BOSP_COMPONENT_SHORT_LABELS[comp],
        color: BOSP_COMPONENT_COLORS[comp],
        plannedAmount: agg.planned,
        realizedAmount: agg.realized,
        absorptionPct: formatPercentage(agg.realized, agg.planned),
        shareOfSpentPct:
          totalSpent > 0
            ? Math.round((agg.realized / totalSpent) * 1000) / 10
            : 0,
        itemCount: agg.count,
      };
    }
  );

  return {
    id: period.id,
    fiscalYear: period.fiscalYear,
    stage: period.stage,
    openingBalance: toNumber(period.openingBalance),
    totalReceived: toNumber(period.totalReceived),
    regularReceived: toNumber(period.regularReceived),
    performanceReceived: toNumber(period.performanceReceived),
    totalSpent,
    endingBalance: toNumber(period.endingBalance),
    documentUrl: period.documentUrl,
    documentName: period.documentName,
    documentMimeType: period.documentMimeType,
    status: period.status,
    publishedAt: period.publishedAt ? period.publishedAt.toISOString() : null,
    notes: period.notes,
    updatedAt: period.updatedAt.toISOString(),
    expenses,
    componentBreakdown,
  };
}

export async function getPublicPortalData(filters?: {
  year?: number;
  stage?: BudgetStage;
}) {
  const [schoolProfile, publishedPeriods] = await Promise.all([
    prisma.schoolProfile.findFirst(),
    prisma.budgetPeriod.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: [{ fiscalYear: "desc" }, { stage: "asc" }],
      select: {
        id: true,
        fiscalYear: true,
        stage: true,
        publishedAt: true,
      },
    }),
  ]);

  const availableYears = Array.from(
    new Set(publishedPeriods.map((p) => p.fiscalYear))
  ).sort((a, b) => b - a);

  const selectedYear =
    filters?.year && availableYears.includes(filters.year)
      ? filters.year
      : availableYears[0] ?? new Date().getFullYear();

  const stagesForYear = publishedPeriods
    .filter((p) => p.fiscalYear === selectedYear)
    .map((p) => p.stage);

  const stagePriority: BudgetStage[] = ["TAHAP_1", "TAHAP_2", "TAHUNAN"];
  const orderedStages = stagePriority.filter((s) => stagesForYear.includes(s));

  const selectedStage =
    filters?.stage && orderedStages.includes(filters.stage)
      ? filters.stage
      : orderedStages[0] ?? null;

  let activePeriod: SerializedBudgetPeriod | null = null;

  if (selectedStage) {
    const found = await prisma.budgetPeriod.findFirst({
      where: {
        fiscalYear: selectedYear,
        stage: selectedStage,
        status: PublishStatus.PUBLISHED,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        expenses: {
          orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
        },
      },
    });
    if (found) {
      activePeriod = serializeBudgetPeriod(found);
    }
  }

  const profile: SerializedSchoolProfile = schoolProfile
    ? {
        id: schoolProfile.id,
        name: schoolProfile.name,
        npsn: schoolProfile.npsn,
        address: schoolProfile.address,
        headmaster: schoolProfile.headmaster,
        treasurer: schoolProfile.treasurer,
        phone: schoolProfile.phone,
        email: schoolProfile.email,
        district: schoolProfile.district,
        province: schoolProfile.province,
        updatedAt: schoolProfile.updatedAt.toISOString(),
      }
    : {
        id: "default",
        name: "Sekolah Dasar Negeri",
        npsn: "-",
        address: "Alamat sekolah belum diatur",
        headmaster: "-",
        treasurer: "-",
        phone: "",
        email: "",
        district: "",
        province: "",
        updatedAt: new Date().toISOString(),
      };

  return {
    schoolProfile: profile,
    availableYears,
    availableStages: orderedStages,
    selectedYear,
    selectedStage,
    period: activePeriod,
  };
}
