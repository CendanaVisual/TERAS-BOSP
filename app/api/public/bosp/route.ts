import { BudgetStage } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getPublicPortalData } from "@/lib/bosp-queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get("year");
  const stageParam = searchParams.get("stage");

  try {
    const year = yearParam ? Number(yearParam) : undefined;
    const validStages: BudgetStage[] = ["TAHAP_1", "TAHAP_2", "TAHUNAN"];
    const stage =
      stageParam && validStages.includes(stageParam as BudgetStage)
        ? (stageParam as BudgetStage)
        : undefined;

    const data = await getPublicPortalData({
      year: Number.isFinite(year) ? year : undefined,
      stage,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching public BOSP data:", error);
    return NextResponse.json(
      { error: "Gagal memuat data publikasi BOSP." },
      { status: 500 }
    );
  }
}
