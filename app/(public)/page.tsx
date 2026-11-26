import { Suspense } from "react";
import Link from "next/link";
import { BudgetStage } from "@prisma/client";
import {
  CalendarClock,
  Info,
  Lock,
  Megaphone,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";
import { getPublicPortalData } from "@/lib/bosp-queries";
import { DocumentPreview } from "@/components/public/DocumentPreview";
import { FeedbackForm } from "@/components/public/FeedbackForm";
import { KpiCards } from "@/components/public/KpiCards";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicPortalAnalytics } from "@/components/public/PublicPortalAnalytics";
import { PublicPortalSkeleton } from "@/components/public/PublicPortalSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface PublicPageProps {
  searchParams: Promise<{ year?: string; stage?: string }>;
}

async function PublicPortalContent({ searchParams }: PublicPageProps) {
  const params = await searchParams;
  const parsedYear = params.year ? Number(params.year) : undefined;
  const validStages: BudgetStage[] = ["TAHAP_1", "TAHAP_2", "TAHUNAN"];
  const parsedStage =
    params.stage && validStages.includes(params.stage as BudgetStage)
      ? (params.stage as BudgetStage)
      : undefined;

  const data = await getPublicPortalData({
    year: parsedYear && Number.isFinite(parsedYear) ? parsedYear : undefined,
    stage: parsedStage,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader
        school={data.schoolProfile}
        availableYears={data.availableYears}
        availableStages={data.availableStages}
        selectedYear={data.selectedYear}
        selectedStage={data.selectedStage}
        publishedAt={data.period?.publishedAt ?? null}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8 space-y-5 sm:space-y-7">
        {data.period ? (
          <>
            {data.period.notes && (
              <div className="flex items-start gap-3 rounded-2xl border border-[#DFD1B4] bg-[#FFFDF8] px-5 py-3.5 text-sm text-[#3B3322] shadow-xs">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#B8862D]" />
                <p>{data.period.notes}</p>
              </div>
            )}

            <KpiCards period={data.period} />

            <PublicPortalAnalytics period={data.period} />

            <DocumentPreview period={data.period} />
          </>
        ) : (
          <Card className="overflow-hidden border-[#DECFA8] bg-gradient-to-br from-[#FFFDF9] via-[#FAF4E8] to-[#F6EDE0]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#9E7828] via-[#DFBC6F] to-[#9E7828]" />
            <CardContent className="py-10 px-6 sm:px-10">
              <div className="mx-auto max-w-2xl text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A24D]/40 bg-[#141923] text-[#E6C67A] shadow-sm">
                  <Megaphone className="h-6 w-6" />
                </div>

                <div className="flex justify-center">
                  <Badge variant="navy" className="px-3 py-1">
                    <Sparkles className="h-3 w-3 text-[#B8862D]" />
                    Pengumuman Resmi Sekolah
                  </Badge>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#141923]">
                  Publikasi Laporan Dana BOSP Sedang Dipersiapkan
                </h2>

                <p className="text-sm sm:text-base leading-relaxed text-[#524C41]">
                  Saat ini belum ada laporan realisasi Dana BOSP yang ditayangkan untuk periode yang dipilih. Tim Manajemen &amp; Bendahara BOSP{" "}
                  <strong className="text-[#141923]">
                    {data.schoolProfile.name}
                  </strong>{" "}
                  sedang melakukan penyusunan, rekonsiliasi data ARKAS, dan verifikasi pertanggungjawaban agar informasi yang disajikan kepada orang tua murid dan masyarakat selalu akurat serta akuntabel.
                </p>

                <div className="mx-auto flex max-w-lg items-center justify-center gap-2 rounded-xl border border-[#E5D7BC] bg-white/80 px-4 py-2.5 text-xs text-[#5E5544]">
                  <CalendarClock className="h-4 w-4 text-[#B8862D] shrink-0" />
                  <span>
                    Rincian 12 Komponen Belanja &amp; Dokumen Resmi PDF akan tampil otomatis setelah laporan disetujui dan dipublikasikan oleh Bendahara Sekolah.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <a href="#pengaduan-masyarakat" className="w-full sm:w-auto">
                    <Button type="button" variant="gold" size="default" className="w-full sm:w-auto h-11 sm:h-10">
                      <MessageSquarePlus className="h-4 w-4" />
                      Sampaikan Pertanyaan / Saran
                    </Button>
                  </a>
                  <Link href="/admin" className="w-full sm:w-auto">
                    <Button type="button" variant="outline" size="default" className="w-full sm:w-auto h-11 sm:h-10">
                      <Lock className="h-4 w-4" />
                      Masuk Portal Bendahara
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div id="pengaduan-masyarakat">
          <FeedbackForm />
        </div>
      </main>

      <footer className="border-t border-[#E3D7C1] bg-[#10141C] text-[#D7CEBE] py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            © {new Date().getFullYear()}{" "}
            <strong className="font-display text-[#E8C97B] tracking-wide">
              {data.schoolProfile.name}
            </strong>{" "}
            — Transparansi Elektronik Realisasi Anggaran Sekolah (TERAS-BOSP)
          </p>
          <p className="text-[#B6AC9A]">
            {data.schoolProfile.email
              ? `Kontak Resmi: ${data.schoolProfile.email}`
              : "Akuntabel • Transparan • Partisipatif"}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function PublicHomePage({ searchParams }: PublicPageProps) {
  return (
    <Suspense fallback={<PublicPortalSkeleton />}>
      <PublicPortalContent searchParams={searchParams} />
    </Suspense>
  );
}
