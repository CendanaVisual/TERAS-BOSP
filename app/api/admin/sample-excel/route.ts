import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = [
    ["REKAPITULASI REALISASI PENGGUNAAN DANA BOSP (EKSPOR ARKAS)"],
    ["Nama Sekolah", "SD Negeri 7 Pedungan"],
    ["Tahun Anggaran", "2026", "Periode", "Tahap 2"],
    ["Saldo Awal / Sisa Tahun Lalu", "", "", "", 14015000],
    ["Penerimaan BOSP Reguler", "", "", "", 218400000],
    ["Penerimaan BOSP Kinerja", "", "", "", 15000000],
    ["Total Diterima", "", "", "", 233400000],
    [],
    [
      "Kode Rekening",
      "Komponen Standar BOSP",
      "Uraian Kegiatan / Belanja",
      "Sumber Dana",
      "Anggaran (RKAS)",
      "Realisasi (Rp)",
    ],
    [
      "5.1.02.01.01.0026",
      "Penerimaan Peserta Didik Baru (PPDB)",
      "Publikasi dan pendaftaran ulang peserta didik baru semester ganjil",
      "BOSP Reguler",
      4500000,
      4350000,
    ],
    [
      "5.2.05.01.01.0001",
      "Pengembangan Perpustakaan",
      "Pengadaan buku literasi fiksi & non-fiksi pojok baca kelas 1-6",
      "BOSP Reguler",
      28000000,
      27400000,
    ],
    [
      "5.1.02.01.01.0012",
      "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler",
      "Bahan praktik pembelajaran P5, alat olahraga, dan pembinaan ekstrakurikuler",
      "BOSP Reguler",
      34000000,
      31800000,
    ],
    [
      "5.1.02.04.01.0003",
      "Pengembangan Profesi Guru dan Tenaga Kependidikan",
      "Pelatihan pemanfaatan platform digital pembelajaran dan Kombel Guru",
      "BOSP Kinerja",
      15000000,
      14200000,
    ],
    [
      "5.1.02.02.01.0061",
      "Pembiayaan Langganan Daya dan Jasa",
      "Tagihan listrik PLN, air PDAM, dan internet sekolah (6 bulan)",
      "BOSP Reguler",
      20400000,
      19850000,
    ],
    [
      "5.1.02.03.03.0001",
      "Pemeliharaan Sarana dan Prasarana Sekolah",
      "Perbaikan ringan ruang kelas, penggantian lampu LED, dan pengecatan pagar",
      "BOSP Reguler",
      36000000,
      34500000,
    ],
    [
      "5.1.02.02.01.0013",
      "Pembayaran Honor",
      "Honorarium bulanan guru dan tenaga perpustakaan non-ASN Dapodik",
      "BOSP Reguler",
      33600000,
      33600000,
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Realisasi_BOSP");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Contoh_Rekap_ARKAS_BOSP_2026.xlsx"',
    },
  });
}
