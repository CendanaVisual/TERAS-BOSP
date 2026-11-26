"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  FileCheck2,
  Lock,
  MapPin,
  Phone,
  Printer,
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
    <header className="relative">
      {/* Top Balinese Luxury Architectural Nav */}
      <div className="border-b border-[#C9A24D]/25 bg-[#0D1017]/95 backdrop-blur-md text-white no-print">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 rounded-full ring-1 ring-[#C9A24D]/50 shadow-[0_0_14px_rgba(201,162,77,0.3)] overflow-hidden bg-[#12161F]">
              <Image
                src="/logo.gif"
                alt="Logo TERAS-BOSP"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-display text-sm sm:text-base font-bold tracking-wider text-[#E8C97B]">
                TERAS-BOSP
              </span>
              <span className="hidden md:inline text-xs text-[#C7BFA9] ml-2.5 border-l border-[#C9A24D]/30 pl-2.5">
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
              className="hidden sm:inline-flex border-[#C9A24D]/35 bg-[#171C26] text-[#F2E9D5] hover:bg-[#222938] hover:text-white"
            >
              <Printer className="h-3.5 w-3.5 text-[#D4AF37]" />
              Cetak Laporan
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              <Lock className="h-3.5 w-3.5" />
              Portal Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Hero School Identity & Period Filters — Modern Balinese Obsidian & Gold */}
      <div className="relative overflow-hidden bali-obsidian-hero text-white">
        <div className="pointer-events-none absolute inset-0 bali-patra-overlay opacity-80" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bali-gold-divider" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            {/* School Identity with Balinese Medallion Logo */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-5 max-w-3xl">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full p-1 bg-gradient-to-b from-[#DFBC6F]/60 to-[#8A6820]/30 shadow-[0_0_32px_rgba(212,175,55,0.28)]">
                <div className="relative h-full w-full rounded-full overflow-hidden bg-[#10141C]">
                  <Image
                    src="/logo.gif"
                    alt={`Logo Resmi ${school.name}`}
                    fill
                    unoptimized
                    priority
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#0D6E52]/30 text-emerald-200 border-emerald-400/40">
                    <FileCheck2 className="h-3 w-3" />
                    Publikasi Resmi BOSP
                  </Badge>
                  <Badge className="bg-[#C9A24D]/15 text-[#F0D792] border-[#C9A24D]/40 font-mono">
                    NPSN: {school.npsn}
                  </Badge>
                  {publishedAt && (
                    <span className="text-xs text-[#C7BFA9]">
                      Dipublikasikan: {formatDateId(publishedAt)}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-[#FAF5EA] flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-[#D4AF37] shrink-0 hidden md:block" />
                  {school.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-[#DDD4C1]">
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37] mt-0.5" />
                    {school.address}
                  </span>
                  {school.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
                      {school.phone}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-1.5 text-xs border border-[#C9A24D]/25 backdrop-blur-xs">
                    <UserCheck className="h-3.5 w-3.5 text-[#DFBC6F]" />
                    <span className="text-[#C7BFA9]">Kepala Sekolah:</span>
                    <span className="font-semibold text-[#FAF5EA]">
                      {school.headmaster}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-1.5 text-xs border border-[#C9A24D]/25 backdrop-blur-xs">
                    <UserCheck className="h-3.5 w-3.5 text-[#DFBC6F]" />
                    <span className="text-[#C7BFA9]">Bendahara BOSP:</span>
                    <span className="font-semibold text-[#FAF5EA]">
                      {school.treasurer}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Filters */}
            <div className="rounded-2xl bg-[#161B26]/90 backdrop-blur-md border border-[#C9A24D]/35 p-4 sm:p-5 space-y-3 min-w-[280px] lg:min-w-[335px] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] no-print">
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-xs font-bold uppercase tracking-widest text-[#E8C97B] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Periode Laporan
                </span>
                {availableYears.length > 0 && (
                  <select
                    aria-label="Pilih Tahun Anggaran"
                    value={selectedYear}
                    onChange={(e) => updateFilter(Number(e.target.value), null)}
                    className="rounded-xl border border-[#C9A24D]/45 bg-[#0C0F16] px-3 py-1.5 text-sm font-semibold text-[#F5EAD0] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
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
                        className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? "bg-gradient-to-r from-[#B8892E] to-[#DFBC6F] text-[#11141B] shadow-sm font-bold"
                            : enabled
                            ? "bg-white/5 text-[#E5DEC9] border border-white/10 hover:bg-white/15 hover:border-[#C9A24D]/40"
                            : "bg-white/5 text-white/25 cursor-not-allowed"
                        }`}
                      >
                        {BUDGET_STAGE_SHORT_LABELS[st]}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#C7BFA9]">
                  Belum ada laporan periode yang ditayangkan.
                </p>
              )}

              {selectedStage && (
                <p className="text-[11px] text-[#C7BFA9]">
                  Menampilkan:{" "}
                  <strong className="text-[#F5EAD0]">
                    {BUDGET_STAGE_LABELS[selectedStage]}
                  </strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
