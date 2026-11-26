export const BOSP_COMPONENTS = [
  "Penerimaan Peserta Didik Baru (PPDB)",
  "Pengembangan Perpustakaan",
  "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler",
  "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran",
  "Pelaksanaan Administrasi Kegiatan Sekolah",
  "Pengembangan Profesi Guru dan Tenaga Kependidikan",
  "Pembiayaan Langganan Daya dan Jasa",
  "Pemeliharaan Sarana dan Prasarana Sekolah",
  "Penyediaan Alat Multimedia Pembelajaran",
  "Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian",
  "Penyelenggaraan Kegiatan dalam Mendukung Keterserapan Lulusan",
  "Pembayaran Honor",
] as const;

export type BospComponent = (typeof BOSP_COMPONENTS)[number];

export const BOSP_COMPONENT_SHORT_LABELS: Record<BospComponent, string> = {
  "Penerimaan Peserta Didik Baru (PPDB)": "PPDB",
  "Pengembangan Perpustakaan": "Perpustakaan",
  "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler": "Pembelajaran & Ekskul",
  "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran": "Asesmen & Evaluasi",
  "Pelaksanaan Administrasi Kegiatan Sekolah": "Administrasi Sekolah",
  "Pengembangan Profesi Guru dan Tenaga Kependidikan": "Pengembangan PTK",
  "Pembiayaan Langganan Daya dan Jasa": "Daya & Jasa",
  "Pemeliharaan Sarana dan Prasarana Sekolah": "Pemeliharaan Sarpras",
  "Penyediaan Alat Multimedia Pembelajaran": "Alat Multimedia",
  "Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian": "Kompetensi Keahlian",
  "Penyelenggaraan Kegiatan dalam Mendukung Keterserapan Lulusan": "Keterserapan Lulusan",
  "Pembayaran Honor": "Pembayaran Honor",
};

export const BOSP_COMPONENT_COLORS: Record<BospComponent, string> = {
  "Penerimaan Peserta Didik Baru (PPDB)": "#1e3a8a",
  "Pengembangan Perpustakaan": "#1d4ed8",
  "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler": "#0f766e",
  "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran": "#0369a1",
  "Pelaksanaan Administrasi Kegiatan Sekolah": "#4338ca",
  "Pengembangan Profesi Guru dan Tenaga Kependidikan": "#0d9488",
  "Pembiayaan Langganan Daya dan Jasa": "#0284c7",
  "Pemeliharaan Sarana dan Prasarana Sekolah": "#15803d",
  "Penyediaan Alat Multimedia Pembelajaran": "#2563eb",
  "Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian": "#64748b",
  "Penyelenggaraan Kegiatan dalam Mendukung Keterserapan Lulusan": "#475569",
  "Pembayaran Honor": "#059669",
};

export const BUDGET_STAGE_LABELS = {
  TAHAP_1: "Tahap 1 (Januari – Juni)",
  TAHAP_2: "Tahap 2 (Juli – Desember)",
  TAHUNAN: "Tahunan (Rekap 1 Tahun)",
} as const;

export const BUDGET_STAGE_SHORT_LABELS = {
  TAHAP_1: "Tahap 1",
  TAHAP_2: "Tahap 2",
  TAHUNAN: "Tahunan",
} as const;

export const FUND_SOURCE_LABELS = {
  BOSP_REGULER: "BOSP Reguler",
  BOSP_KINERJA: "BOSP Kinerja",
} as const;

export const FEEDBACK_ROLES = [
  "Orang Tua / Wali Murid",
  "Komite Sekolah",
  "Masyarakat Umum",
  "Guru / Tenaga Kependidikan",
] as const;

export function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRupiahCompact(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return "Rp 0";
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
  }
  return formatRupiah(num);
}

export function formatPercentage(realized: number, planned: number): number {
  if (!Number.isFinite(planned) || planned <= 0) {
    return realized > 0 ? 100 : 0;
  }
  return Math.round((realized / planned) * 1000) / 10;
}

/**
 * Normalizes arbitrary category text into one of the 12 official BOSP components.
 */
export function normalizeBospComponent(input: string): BospComponent {
  const text = input.toLowerCase().trim();
  const exact = BOSP_COMPONENTS.find((c) => c.toLowerCase() === text);
  if (exact) return exact;

  if (text.includes("ppdb") || text.includes("penerimaan peserta didik")) {
    return "Penerimaan Peserta Didik Baru (PPDB)";
  }
  if (text.includes("perpustakaan") || text.includes("buku") || text.includes("pojok baca")) {
    return "Pengembangan Perpustakaan";
  }
  if (text.includes("pembelajaran") || text.includes("ekstrakurikuler") || text.includes("ekskul") || text.includes("lomba")) {
    return "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler";
  }
  if (text.includes("asesmen") || text.includes("evaluasi") || text.includes("ujian") || text.includes("ulangan")) {
    return "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran";
  }
  if (text.includes("administrasi") || text.includes("atk") || text.includes("kegiatan sekolah") || text.includes("surat")) {
    return "Pelaksanaan Administrasi Kegiatan Sekolah";
  }
  if (text.includes("profesi") || text.includes("pelatihan") || text.includes("kkg") || text.includes("mgmp") || text.includes("guru")) {
    if (!text.includes("honor")) {
      return "Pengembangan Profesi Guru dan Tenaga Kependidikan";
    }
  }
  if (text.includes("daya") || text.includes("jasa") || text.includes("listrik") || text.includes("internet") || text.includes("air") || text.includes("telepon")) {
    return "Pembiayaan Langganan Daya dan Jasa";
  }
  if (text.includes("sarana") || text.includes("prasarana") || text.includes("sarpras") || text.includes("pemeliharaan") || text.includes("rehab") || text.includes("perbaikan")) {
    return "Pemeliharaan Sarana dan Prasarana Sekolah";
  }
  if (text.includes("multimedia") || text.includes("komputer") || text.includes("laptop") || text.includes("proyektor") || text.includes("tik")) {
    return "Penyediaan Alat Multimedia Pembelajaran";
  }
  if (text.includes("kompetensi keahlian") || text.includes("kejuruan") || text.includes("pkl")) {
    return "Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian";
  }
  if (text.includes("keterserapan") || text.includes("lulusan") || text.includes("bursa kerja") || text.includes("tracer")) {
    return "Penyelenggaraan Kegiatan dalam Mendukung Keterserapan Lulusan";
  }
  if (text.includes("honor") || text.includes("upah") || text.includes("gaji")) {
    return "Pembayaran Honor";
  }

  return "Pelaksanaan Administrasi Kegiatan Sekolah";
}
