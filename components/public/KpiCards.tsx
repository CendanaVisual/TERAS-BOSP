import {
  ArrowDownRight,
  Banknote,
  CheckCircle2,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { formatPercentage, formatRupiah } from "@/lib/bosp-constants";
import type { SerializedBudgetPeriod } from "@/lib/bosp-queries";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCards({ period }: { period: SerializedBudgetPeriod }) {
  const totalAvailable = period.openingBalance + period.totalReceived;
  const absorptionPct = formatPercentage(period.totalSpent, totalAvailable);

  return (
    <section
      aria-label="Ringkasan Anggaran BOSP"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* 1. Saldo Awal */}
      <Card className="border-t-2 border-t-[#C9A24D] bg-[#FFFDF9]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6A604E]">
                Saldo Awal / Sisa Lalu
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#141923] tabular-nums">
                {formatRupiah(period.openingBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5DAC5] bg-[#F6F0E4] text-[#9E7828]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6A604E]">
            Sisa kas BOSP periode sebelumnya yang terbawa
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Dana BOSP Diterima */}
      <Card className="border-t-2 border-t-[#1E3A5F] bg-[#FFFDF9]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6A604E]">
                Dana BOSP Diterima
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#141923] tabular-nums">
                {formatRupiah(period.totalReceived)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-[#1E3A5F]">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5A5347] tabular-nums">
            <span>
              Reguler:{" "}
              <strong className="text-[#141923]">
                {formatRupiah(period.regularReceived)}
              </strong>
            </span>
            {period.performanceReceived > 0 && (
              <span>
                Kinerja:{" "}
                <strong className="text-[#9E7828]">
                  {formatRupiah(period.performanceReceived)}
                </strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Realisasi Belanja */}
      <Card className="border-t-2 border-t-[#0D6E52] border-[#CBE3D8] bg-gradient-to-br from-[#F7FCF9] to-[#EFF9F4]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6E52]">
                Total Realisasi Belanja
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0A5740] tabular-nums">
                {formatRupiah(period.totalSpent)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 text-[#0D6E52]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#0D6E52] font-medium">
                Tingkat Serapan
              </span>
              <span className="font-bold text-[#0A5740] tabular-nums">
                {absorptionPct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/70">
              <div
                className="h-full rounded-full bg-[#0D6E52] transition-all"
                style={{ width: `${Math.min(100, absorptionPct)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Sisa Saldo Akhir */}
      <Card className="border-t-2 border-t-[#9E7828] bg-[#FFFDF9]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6A604E]">
                Sisa Saldo Akhir
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#141923] tabular-nums">
                {formatRupiah(period.endingBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5D5B2] bg-[#FAF1DE] text-[#9E7828]">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-[#6A604E] flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-[#B8862D]" />
            Saldo Awal + Diterima − Realisasi Belanja
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
