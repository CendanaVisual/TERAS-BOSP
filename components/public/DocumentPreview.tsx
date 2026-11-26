"use client";

import { Download, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import { BUDGET_STAGE_LABELS } from "@/lib/bosp-constants";
import type { SerializedBudgetPeriod } from "@/lib/bosp-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DocumentPreview({ period }: { period: SerializedBudgetPeriod }) {
  const isExcel =
    period.documentName?.toLowerCase().endsWith(".xlsx") ||
    period.documentName?.toLowerCase().endsWith(".xls") ||
    period.documentMimeType?.includes("spreadsheet");

  const previewUrl = isExcel
    ? `/api/documents/${period.id}?pdf=1`
    : `/api/documents/${period.id}`;
  const downloadOriginalUrl = `/api/documents/${period.id}?download=1`;
  const downloadPdfUrl = `/api/documents/${period.id}?pdf=1&download=1`;

  return (
    <Card className="no-print">
      <CardHeader className="border-b border-[#EFE6D5] pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Pratinjau & Unduh Dokumen Resmi (ARKAS / BOSP Salur)</CardTitle>
              <Badge variant="navy">
                {isExcel ? (
                  <>
                    <FileSpreadsheet className="h-3 w-3" /> Lampiran Excel + Rekap PDF
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3" /> Dokumen PDF Resmi
                  </>
                )}
              </Badge>
            </div>
            <CardDescription>
              Dokumen laporan resmi {BUDGET_STAGE_LABELS[period.stage]} Tahun Anggaran {period.fiscalYear}
              {period.documentName ? ` (${period.documentName})` : ""}.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto h-10 sm:h-8">
                <ExternalLink className="h-3.5 w-3.5" />
                Buka Tab Baru
              </Button>
            </a>
            <a href={downloadOriginalUrl} download className="w-full sm:w-auto">
              <Button type="button" variant="emerald" size="sm" className="w-full sm:w-auto h-10 sm:h-8">
                <Download className="h-3.5 w-3.5" />
                Unduh {isExcel ? "Excel Asli" : "Dokumen PDF"}
              </Button>
            </a>
            {isExcel && (
              <a href={downloadPdfUrl} download className="w-full sm:w-auto">
                <Button type="button" variant="default" size="sm" className="w-full sm:w-auto h-10 sm:h-8">
                  <Download className="h-3.5 w-3.5" />
                  Unduh Rekap PDF
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-5">
        <div className="overflow-hidden rounded-xl border border-[#E5DAC5] bg-[#F5EFE3]">
          <iframe
            title={`Pratinjau Dokumen BOSP ${period.fiscalYear} ${period.stage}`}
            src={previewUrl}
            className="h-[340px] sm:h-[480px] w-full bg-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
