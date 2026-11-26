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
    <section aria-label="Ringkasan Anggaran BOSP" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Saldo Awal */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Saldo Awal / Sisa Lalu
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0F2A56] tabular-nums">
                {formatRupiah(period.openingBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0F2A56]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Sisa kas BOSP periode sebelumnya yang terbawa
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Dana BOSP Diterima */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Dana BOSP Diterima
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0F2A56] tabular-nums">
                {formatRupiah(period.totalReceived)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
            <span>
              Reguler: <strong className="text-slate-800">{formatRupiah(period.regularReceived)}</strong>
            </span>
            {period.performanceReceived > 0 && (
              <span>
                Kinerja: <strong className="text-blue-700">{formatRupiah(period.performanceReceived)}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Realisasi Belanja */}
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Total Realisasi Belanja
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 tabular-nums">
                {formatRupiah(period.totalSpent)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">Tingkat Serapan</span>
              <span className="font-bold text-emerald-700 tabular-nums">
                {absorptionPct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/70">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${Math.min(100, absorptionPct)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Sisa Saldo Akhir */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sisa Saldo Akhir
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0F2A56] tabular-nums">
                {formatRupiah(period.endingBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-slate-400" />
            Saldo Awal + Diterima − Realisasi Belanja
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
