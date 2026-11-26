"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { BOSP_COMPONENTS, formatRupiah } from "@/lib/bosp-constants";
import type { ExtractedBospData } from "@/lib/ai-extractor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

interface SmartUploadExtractorProps {
  onSaved: () => void;
}

interface EditableExpense {
  componentCategory: string;
  accountCode: string;
  description: string;
  fundSource: "BOSP_REGULER" | "BOSP_KINERJA";
  plannedAmount: number;
  realizedAmount: number;
}

export function SmartUploadExtractor({ onSaved }: SmartUploadExtractorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [extractionInfo, setExtractionInfo] = useState<{
    mode: ExtractedBospData["extractionMode"];
    warning?: string;
    fileName: string;
    docUrl: string;
    docName: string;
    docMimeType: string;
    storageWarning?: string;
  } | null>(null);

  // Editable review state (Human-in-the-Loop)
  const [hasDraft, setHasDraft] = useState(false);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [stage, setStage] = useState<"TAHAP_1" | "TAHAP_2" | "TAHUNAN">("TAHAP_1");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [regularReceived, setRegularReceived] = useState<number>(0);
  const [performanceReceived, setPerformanceReceived] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [expenses, setExpenses] = useState<EditableExpense[]>([]);

  const totalReceived = regularReceived + performanceReceived;
  const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.realizedAmount) || 0), 0);
  const endingBalance = openingBalance + totalReceived - totalSpent;

  const processFile = async (file: File) => {
    setError(null);
    setStatusMsg(null);
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengekstrak dokumen.");
        setExtracting(false);
        return;
      }

      const ext = data.extracted as ExtractedBospData;
      setFiscalYear(ext.fiscalYear);
      setStage(ext.stage);
      setOpeningBalance(ext.openingBalance);
      setRegularReceived(ext.regularReceived);
      setPerformanceReceived(ext.performanceReceived);
      setNotes(ext.notes || "");
      setExpenses(
        ext.expenses.length > 0
          ? ext.expenses
          : [
              {
                componentCategory: BOSP_COMPONENTS[0],
                accountCode: "5.1.02.01.01.0001",
                description: "",
                fundSource: "BOSP_REGULER",
                plannedAmount: 0,
                realizedAmount: 0,
              },
            ]
      );

      setExtractionInfo({
        mode: ext.extractionMode,
        warning: ext.warning,
        fileName: file.name,
        docUrl: data.document?.url || "",
        docName: data.document?.name || file.name,
        docMimeType: data.document?.mimeType || file.type,
        storageWarning: data.document?.storageWarning,
      });
      setHasDraft(true);
    } catch {
      setError("Terjadi kesalahan jaringan saat memproses dokumen.");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const updateExpense = (
    idx: number,
    patch: Partial<EditableExpense>
  ) => {
    setExpenses((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addExpenseRow = () => {
    setExpenses((prev) => [
      ...prev,
      {
        componentCategory: BOSP_COMPONENTS[4],
        accountCode: "5.1.02.01.01.0024",
        description: "Belanja Operasional Baru",
        fundSource: "BOSP_REGULER",
        plannedAmount: 0,
        realizedAmount: 0,
      },
    ]);
  };

  const removeExpenseRow = (idx: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  const savePeriod = async (status: "DRAFT" | "PUBLISHED") => {
    setError(null);
    setStatusMsg(null);
    const validExpenses = expenses.filter((e) => e.description.trim().length > 0);
    if (validExpenses.length === 0) {
      setError("Minimal 1 baris rincian belanja harus diisi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiscalYear,
          stage,
          openingBalance,
          regularReceived,
          performanceReceived,
          totalReceived,
          totalSpent,
          endingBalance,
          documentUrl: extractionInfo?.docUrl || null,
          documentName: extractionInfo?.docName || null,
          documentMimeType: extractionInfo?.docMimeType || null,
          status,
          notes,
          expenses: validExpenses,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan laporan anggaran.");
      } else {
        setStatusMsg(
          status === "PUBLISHED"
            ? `Berhasil dipublikasikan! Laporan Tahun ${fiscalYear} (${stage}) kini tampil di Portal Umum.`
            : `Tersimpan sebagai Draft! Anda dapat meninjau atau mempublikasikannya nanti di tab Manajemen Publikasi.`
        );
        setHasDraft(false);
        setExtractionInfo(null);
        onSaved();
      }
    } catch {
      setError("Gagal menghubungi server saat menyimpan laporan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Smart Upload & Extractor (ARKAS / BOSP Salur)
              </CardTitle>
              <CardDescription>
                Seret dan lepas file laporan Excel (.xlsx/.xls) atau PDF (.pdf) dari ARKAS. AI akan mengekstrak angka dan memetakan rincian ke 12 Komponen Standar BOSP.
              </CardDescription>
            </div>
            <a href="/api/admin/sample-excel" download>
              <Button type="button" variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" />
                Unduh Contoh Excel ARKAS
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {statusMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p>{statusMsg}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !extracting && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer ${
              dragging
                ? "border-[#0F2A56] bg-blue-50/70"
                : "border-slate-300 bg-slate-50/60 hover:border-[#0F2A56]/60 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {extracting ? (
              <div className="space-y-3">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0F2A56]" />
                <div>
                  <p className="font-bold text-[#0F2A56]">
                    Sedang Membaca & Mengekstrak Dokumen dengan AI...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mengidentifikasi tahun anggaran, saldo, serta memetakan belanja ke 12 Komponen BOSP.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-[#0F2A56]">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-[#0F2A56]">
                    Klik untuk memilih file atau seret dokumen ke area ini
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung BKU / Rekap Realisasi ARKAS dalam format{" "}
                    <span className="font-semibold text-slate-700">.xlsx, .xls</span> atau{" "}
                    <span className="font-semibold text-slate-700">.pdf</span> (maks. 15 MB)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    Excel ARKAS
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    PDF BOSP Salur
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Human-in-the-Loop Verification & Preview */}
      {hasDraft && (
        <Card className="border-blue-200 ring-1 ring-blue-100">
          <CardHeader className="border-b border-slate-100 bg-blue-50/40 pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Mode Review & Verifikasi (Human-in-the-Loop)</CardTitle>
                  {extractionInfo && (
                    <Badge
                      variant={
                        extractionInfo.mode === "heuristic-fallback"
                          ? "amber"
                          : "emerald"
                      }
                    >
                      {extractionInfo.mode === "ai-gemini"
                        ? "Diekstrak via Gemini AI"
                        : extractionInfo.mode === "ai-openai"
                        ? "Diekstrak via OpenAI"
                        : "Parser Heuristik Lokal"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Periksa atau koreksi angka dan pemetaan komponen sebelum mempublikasikan laporan ke Portal Umum.
                </CardDescription>
              </div>
            </div>

            {(extractionInfo?.warning || extractionInfo?.storageWarning) && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                {extractionInfo.warning && <p>• {extractionInfo.warning}</p>}
                {extractionInfo.storageWarning && (
                  <p>• {extractionInfo.storageWarning}</p>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-5 space-y-6">
            {/* Metadata & Summary Form */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Tahun Anggaran</Label>
                <Input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value) || 2026)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Periode Tahap</Label>
                <Select
                  value={stage}
                  onChange={(e) =>
                    setStage(e.target.value as "TAHAP_1" | "TAHAP_2" | "TAHUNAN")
                  }
                >
                  <option value="TAHAP_1">Tahap 1 (Jan–Jun)</option>
                  <option value="TAHAP_2">Tahap 2 (Jul–Des)</option>
                  <option value="TAHUNAN">Tahunan</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Saldo Awal / Sisa Lalu (Rp)</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Penerimaan BOSP Reguler (Rp)</Label>
                <Input
                  type="number"
                  value={regularReceived}
                  onChange={(e) => setRegularReceived(Number(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Penerimaan BOSP Kinerja (Rp)</Label>
                <Input
                  type="number"
                  value={performanceReceived}
                  onChange={(e) =>
                    setPerformanceReceived(Number(e.target.value) || 0)
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">
                  Total Dana Diterima
                </p>
                <p className="text-base font-extrabold text-[#0F2A56] tabular-nums mt-0.5">
                  {formatRupiah(totalReceived)}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11px] font-semibold uppercase text-emerald-700">
                  Total Realisasi Belanja
                </p>
                <p className="text-base font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  {formatRupiah(totalSpent)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">
                  Sisa Saldo Akhir (Otomatis)
                </p>
                <p className="text-base font-extrabold text-[#0F2A56] tabular-nums mt-0.5">
                  {formatRupiah(endingBalance)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Catatan Pengantar Laporan (Opsional)</Label>
              <Textarea
                className="min-h-[70px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk masyarakat terkait realisasi periode ini..."
              />
            </div>

            {/* Editable Expenses Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#0F2A56]">
                  Rincian Pos Belanja ({expenses.length} item)
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpenseRow}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Baris
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <tr>
                      <th className="px-2.5 py-2.5 min-w-[130px]">Kode Rekening</th>
                      <th className="px-2.5 py-2.5 min-w-[210px]">Komponen BOSP</th>
                      <th className="px-2.5 py-2.5 min-w-[230px]">Uraian Kegiatan</th>
                      <th className="px-2.5 py-2.5 min-w-[135px]">Sumber</th>
                      <th className="px-2.5 py-2.5 min-w-[130px]">RKAS (Rp)</th>
                      <th className="px-2.5 py-2.5 min-w-[130px]">Realisasi (Rp)</th>
                      <th className="px-2.5 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {expenses.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs font-mono"
                            value={row.accountCode}
                            onChange={(e) =>
                              updateExpense(idx, { accountCode: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            className="h-8 text-xs"
                            value={row.componentCategory}
                            onChange={(e) =>
                              updateExpense(idx, {
                                componentCategory: e.target.value,
                              })
                            }
                          >
                            {BOSP_COMPONENTS.map((comp) => (
                              <option key={comp} value={comp}>
                                {comp}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 text-xs"
                            value={row.description}
                            onChange={(e) =>
                              updateExpense(idx, { description: e.target.value })
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            className="h-8 text-xs"
                            value={row.fundSource}
                            onChange={(e) =>
                              updateExpense(idx, {
                                fundSource: e.target.value as
                                  | "BOSP_REGULER"
                                  | "BOSP_KINERJA",
                              })
                            }
                          >
                            <option value="BOSP_REGULER">BOSP Reguler</option>
                            <option value="BOSP_KINERJA">BOSP Kinerja</option>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 text-xs font-mono text-right"
                            value={row.plannedAmount}
                            onChange={(e) =>
                              updateExpense(idx, {
                                plannedAmount: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 text-xs font-mono text-right"
                            value={row.realizedAmount}
                            onChange={(e) =>
                              updateExpense(idx, {
                                realizedAmount: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeExpenseRow(idx)}
                            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void savePeriod("DRAFT")}
              >
                Simpan sebagai Draft
              </Button>
              <Button
                type="button"
                variant="emerald"
                size="lg"
                disabled={saving}
                onClick={() => void savePeriod("PUBLISHED")}
              >
                <Send className="h-4 w-4" />
                {saving
                  ? "Menyimpan..."
                  : "Approve & Publish ke Portal Umum"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
