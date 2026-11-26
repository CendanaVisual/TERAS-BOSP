"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ShieldAlert } from "lucide-react";

export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("TERAS-BOSP Route Error:", error);
  }, [error]);

  const handleRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-[#0F2A56]">
            Halaman Belum Dapat Dimuat
          </h1>
          <p className="text-sm text-slate-600">
            Terjadi gangguan sementara pada server saat memproses data transparansi BOSP. Silakan coba muat ulang halaman atau periksa konfigurasi koneksi database.
          </p>
        </div>

        {error?.digest && (
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-mono text-slate-600">
            Kode Referensi Error: {error.digest}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2A56] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173B75] cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Home className="h-4 w-4" />
            Beranda
          </Link>

          <Link
            href="/api/health"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ShieldAlert className="h-4 w-4" />
            Cek Status Server
          </Link>
        </div>
      </div>
    </div>
  );
}
