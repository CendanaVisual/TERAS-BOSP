"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  FileCheck2,
  Lock,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  BUDGET_STAGE_LABELS,
  BUDGET_STAGE_SHORT_LABELS,
} from "@/lib/bosp-constants";
import type { SerializedSchoolProfile } from "@/lib/bosp-queries";
import { formatDateId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PublicHeaderProps {
  school: SerializedSchoolProfile;
  availableYears: number[];
  availableStages: Array<"TAHAP_1" | "TAHAP_2" | "TAHUNAN">;
  selectedYear: number;
  selectedStage: "TAHAP_1" | "TAHAP_2" | "TAHUNAN" | null;
  publishedAt: string | null;
}

export function PublicHeader({
  school,
  availableYears,
  availableStages,
  selectedYear,
  selectedStage,
  publishedAt,
}: PublicHeaderProps) {
  const router = useRouter();

  const updateFilter = (year: number, stage?: string | null) => {
    const params = new URLSearchParams();
    params.set("year", String(year));
    if (stage) params.set("stage", stage);
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="bg-white border-b border-slate-200">
      {/* Top Bar */}
      <div className="border-b border-slate-100 bg-slate-50/80 no-print">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2A56] text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-[#0F2A56]">
                TERAS-BOSP
              </span>
              <span className="hidden sm:inline text-xs text-slate-500 ml-2">
                Transparansi Elektronik Realisasi Anggaran Sekolah
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="hidden sm:inline-flex"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak Laporan
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              <Lock className="h-3.5 w-3.5" />
              Portal Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Hero School Identity & Period Filters */}
      <div className="bg-gradient-to-br from-[#0F2A56] via-[#133368] to-[#1A4384] text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* School Identity */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                  <FileCheck2 className="h-3 w-3" />
                  Publikasi Resmi BOSP
                </Badge>
                <Badge className="bg-white/10 text-blue-100 border-white/20 font-mono">
                  NPSN: {school.npsn}
                </Badge>
                {publishedAt && (
                  <span className="text-xs text-blue-200">
                    Dipublikasikan: {formatDateId(publishedAt)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Building2 className="h-7 w-7 text-blue-200 shrink-0 hidden sm:block" />
                {school.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-blue-100/90">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-300 mt-0.5" />
                  {school.address}
                </span>
                {school.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-300" />
                    {school.phone}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs border border-white/15">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-blue-200">Kepala Sekolah:</span>
                  <span className="font-semibold text-white">
                    {school.headmaster}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs border border-white/15">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-blue-200">Bendahara BOSP:</span>
                  <span className="font-semibold text-white">
                    {school.treasurer}
                  </span>
                </div>
              </div>
            </div>

            {/* Period Filters */}
            <div className="rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 p-4 space-y-3 min-w-[280px] lg:min-w-[330px] no-print">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Periode Laporan
                </span>
                {availableYears.length > 0 && (
                  <select
                    aria-label="Pilih Tahun Anggaran"
                    value={selectedYear}
                    onChange={(e) => updateFilter(Number(e.target.value), null)}
                    className="rounded-lg border border-white/25 bg-[#0B2044] px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {availableStages.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {(["TAHAP_1", "TAHAP_2", "TAHUNAN"] as const).map((st) => {
                    const enabled = availableStages.includes(st);
                    const active = selectedStage === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={!enabled}
                        onClick={() => updateFilter(selectedYear, st)}
                        className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-emerald-500 text-white shadow-sm"
                            : enabled
                            ? "bg-white/10 text-blue-100 hover:bg-white/20"
                            : "bg-white/5 text-blue-200/40 cursor-not-allowed"
                        }`}
                      >
                        {BUDGET_STAGE_SHORT_LABELS[st]}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-blue-100/80">
                  Belum ada laporan dipublikasikan.
                </p>
              )}

              {selectedStage && (
                <p className="text-[11px] text-blue-100/80">
                  Menampilkan: <strong>{BUDGET_STAGE_LABELS[selectedStage]}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
