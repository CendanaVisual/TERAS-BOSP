"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileUp,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import { BUDGET_STAGE_LABELS, formatRupiah } from "@/lib/bosp-constants";
import type { SerializedBudgetPeriod } from "@/lib/bosp-queries";
import { formatDateId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PublicationsManagerProps {
  periods: SerializedBudgetPeriod[];
  onRefresh: () => void;
}

export function PublicationsManager({
  periods,
  onRefresh,
}: PublicationsManagerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetPeriodIdRef = useRef<string | null>(null);

  const toggleStatus = async (period: SerializedBudgetPeriod) => {
    setBusyId(period.id);
    setError(null);
    setMessage(null);
    const nextStatus = period.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      const res = await fetch(`/api/admin/periods/${period.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengubah status publikasi.");
      } else {
        setMessage(
          `Status laporan ${period.fiscalYear} (${period.stage}) diubah menjadi ${nextStatus}.`
        );
        onRefresh();
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setBusyId(null);
    }
  };

  const triggerReplaceFile = (periodId: string) => {
    targetPeriodIdRef.current = periodId;
    fileInputRef.current?.click();
  };

  const handleReplaceFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const id = targetPeriodIdRef.current;
    e.target.value = "";
    if (!file || !id) return;

    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/periods/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengganti file lampiran.");
      } else {
        setMessage(
          `Lampiran resmi berhasil diganti menjadi "${file.name}".${
            data.warning ? ` (${data.warning})` : ""
          }`
        );
        onRefresh();
      }
    } catch {
      setError("Gagal mengunggah file lampiran baru.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (period: SerializedBudgetPeriod) => {
    if (
      !window.confirm(
        `Hapus laporan Tahun ${period.fiscalYear} (${BUDGET_STAGE_LABELS[period.stage]}) beserta seluruh ${period.expenses.length} rincian belanjanya?`
      )
    ) {
      return;
    }

    setBusyId(period.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/periods/${period.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus laporan.");
      } else {
        setMessage("Laporan berhasil dihapus.");
        onRefresh();
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle>Manajemen Publikasi & Lampiran Resmi</CardTitle>
        <CardDescription>
          Kelola status tayang laporan (Draft / Published), ganti file lampiran PDF/Excel resmi, atau hapus periode laporan.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls"
          onChange={handleReplaceFileChange}
          className="hidden"
        />

        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {periods.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Belum ada laporan anggaran tersimpan. Gunakan menu AI Smart Upload untuk menambah laporan baru.
          </p>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => {
              const isBusy = busyId === period.id;
              return (
                <div
                  key={period.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0F2A56]">
                        Tahun {period.fiscalYear} — {BUDGET_STAGE_LABELS[period.stage]}
                      </span>
                      <Badge
                        variant={
                          period.status === "PUBLISHED" ? "emerald" : "amber"
                        }
                      >
                        {period.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 tabular-nums">
                      <span>
                        Diterima: <strong>{formatRupiah(period.totalReceived)}</strong>
                      </span>
                      <span>
                        Realisasi:{" "}
                        <strong className="text-emerald-700">
                          {formatRupiah(period.totalSpent)}
                        </strong>
                      </span>
                      <span>
                        Saldo Akhir: <strong>{formatRupiah(period.endingBalance)}</strong>
                      </span>
                      <span>{period.expenses.length} pos belanja</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Lampiran: {period.documentName || "Rekap PDF Otomatis"} • Diperbarui{" "}
                      {formatDateId(period.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/api/documents/${period.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" variant="outline" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                        Lihat PDF
                      </Button>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => triggerReplaceFile(period.id)}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Ganti File
                    </Button>

                    <Button
                      type="button"
                      variant={period.status === "PUBLISHED" ? "secondary" : "emerald"}
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void toggleStatus(period)}
                    >
                      {period.status === "PUBLISHED" ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Tarik ke Draft
                        </>
                      ) : (
                        <>
                          <Globe className="h-3.5 w-3.5" />
                          Publikasikan
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleDelete(period)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
