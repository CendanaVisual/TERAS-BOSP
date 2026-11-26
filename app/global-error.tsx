"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("TERAS-BOSP Global Error:", error);
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
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F2A56", margin: "0 0 12px" }}>
            TERAS-BOSP — Gangguan Server
          </h1>
          <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
            Terjadi kesalahan pada server saat memuat halaman. Pastikan environment variable{" "}
            <code>DATABASE_URL</code> & <code>AUTH_SECRET</code> sudah dikonfigurasi dengan benar.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                backgroundColor: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px",
                color: "#475569",
                margin: "0 0 20px",
              }}
            >
              ERROR {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                backgroundColor: "#0F2A56",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Muat Ulang Halaman
            </button>
            <a
              href="/api/health"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                textDecoration: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Cek /api/health
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
