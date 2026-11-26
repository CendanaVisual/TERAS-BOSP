import { Suspense } from "react";
import { BudgetStage } from "@prisma/client";
import { AlertTriangle, Info } from "lucide-react";
import { getPublicPortalData } from "@/lib/bosp-queries";

export const dynamic = "force-dynamic";
import { DocumentPreview } from "@/components/public/DocumentPreview";
import { FeedbackForm } from "@/components/public/FeedbackForm";
import { KpiCards } from "@/components/public/KpiCards";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicPortalAnalytics } from "@/components/public/PublicPortalAnalytics";
import { PublicPortalSkeleton } from "@/components/public/PublicPortalSkeleton";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader
        school={data.schoolProfile}
        availableYears={data.availableYears}
        availableStages={data.availableStages}
        selectedYear={data.selectedYear}
        selectedStage={data.selectedStage}
        publishedAt={data.period?.publishedAt ?? null}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 lg:px-8 space-y-6">
        {data.dbError ? (
          <Card className="border-amber-200 bg-amber-50/70">
            <CardContent className="py-10 text-center space-y-3">
              <AlertTriangle className="mx-auto h-9 w-9 text-amber-600" />
              <p className="text-lg font-bold text-[#0F2A56]">
                {data.dbError === "MISSING_DATABASE_URL"
                  ? "Konfigurasi Database Belum Terpasang"
                  : "Koneksi ke Database Neon Belum Tersedia"}
              </p>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Pastikan environment variable{" "}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono">
                  DATABASE_URL
                </code>{" "}
                sudah ditambahkan pada dashboard Vercel dan migrasi tabel (
                <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono">
                  npx prisma db push
                </code>
                ) sudah dijalankan.
              </p>
            </CardContent>
          </Card>
        ) : data.period ? (
          <>
            {data.period.notes && (
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-[#0F2A56]">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-700" />
                <p>{data.period.notes}</p>
              </div>
            )}

            <KpiCards period={data.period} />

            <PublicPortalAnalytics period={data.period} />

            <DocumentPreview period={data.period} />
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="text-lg font-bold text-[#0F2A56]">
                Belum Ada Laporan BOSP yang Dipublikasikan
              </p>
              <p className="text-sm text-slate-500">
                Bendahara sekolah dapat mengunggah dan mempublikasikan laporan melalui Portal Admin.
              </p>
            </CardContent>
          </Card>
        )}

        <FeedbackForm />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <strong>{data.schoolProfile.name}</strong> — Portal Transparansi Elektronik Realisasi Anggaran Sekolah (TERAS-BOSP)
          </p>
          <p>
            {data.schoolProfile.email ? `Email: ${data.schoolProfile.email}` : "Akuntabel • Transparan • Partisipatif"}
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
