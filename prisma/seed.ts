import { PrismaClient, BudgetStage, FundSource, PublishStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { generateBospOfficialPdf } from "../lib/pdf-generator";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai seeding database TERAS-BOSP...");

  // 1. Admin User (idempotent upsert)
  const adminEmail = "admin@teras-bosp.sch.id";
  const adminPasswordHash = await bcrypt.hash("TerasBosp2026!", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Bendahara Sekolah (Admin)",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Bendahara Sekolah (Admin)",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  // 2. School Profile
  const existingProfile = await prisma.schoolProfile.findFirst();
  const schoolData = {
    name: "SD Negeri 7 Pedungan",
    npsn: "50103107",
    address: "Jl. Raya Sesetan No. 285, Kel. Pedungan, Kec. Denpasar Selatan, Kota Denpasar, Bali 80222",
    headmaster: "Ni Luh Putu Sariani, S.Pd., M.Pd.",
    treasurer: "I Made Adi Wirawan, S.Pd.",
    phone: "(0361) 720418",
    email: "sdn7pedungan.dps@gmail.com",
    district: "Kec. Denpasar Selatan, Kota Denpasar",
    province: "Provinsi Bali",
  };

  const schoolProfile = existingProfile
    ? await prisma.schoolProfile.update({
        where: { id: existingProfile.id },
        data: schoolData,
      })
    : await prisma.schoolProfile.create({ data: schoolData });

  // Clean existing budget periods to ensure idempotent seed
  await prisma.expenseItem.deleteMany();
  await prisma.budgetPeriod.deleteMany();

  // Ensure public/samples exists for static sample PDFs
  const samplesDir = path.join(process.cwd(), "public", "samples");
  await fs.mkdir(samplesDir, { recursive: true });

  // 3. Seed Budget Periods & Expense Items
  const periodsSeed = [
    {
      fiscalYear: 2026,
      stage: BudgetStage.TAHAP_1,
      openingBalance: 14500000,
      regularReceived: 218400000,
      performanceReceived: 22500000,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date("2026-07-08T09:00:00Z"),
      notes: "Realisasi Dana BOSP Reguler dan Kinerja Tahap 1 Tahun Anggaran 2026 telah direkonsiliasi dengan Dinas Pendidikan.",
      fileName: "bosp-2026-tahap-1.pdf",
      expenses: [
        {
          componentCategory: "Penerimaan Peserta Didik Baru (PPDB)",
          accountCode: "5.1.02.01.01.0026",
          description: "Cetak formulir, spanduk informasi, dan ATK panitia PPDB Tahun Ajaran 2026/2027",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 6500000,
          realizedAmount: 6350000,
        },
        {
          componentCategory: "Pengembangan Perpustakaan",
          accountCode: "5.2.05.01.01.0001",
          description: "Pengadaan buku teks pendamping Kurikulum Merdeka & buku bacaan literasi siswa",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 36000000,
          realizedAmount: 35420000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler",
          accountCode: "5.1.02.01.01.0012",
          description: "Pengadaan alat peraga IPA/Matematika, bahan praktik P5, dan pembinaan Pramuka/Tari",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 32500000,
          realizedAmount: 30850000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran",
          accountCode: "5.1.02.01.01.0024",
          description: "Penggandaan soal Sumatif Tengah Semester, Sumatif Akhir Semester, dan simulasi ANBK",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 18500000,
          realizedAmount: 17900000,
        },
        {
          componentCategory: "Pelaksanaan Administrasi Kegiatan Sekolah",
          accountCode: "5.1.02.01.01.0024",
          description: "Belanja ATK kantor, kertas HVS, tinta printer, materai, dan penyusunan SPJ ARKAS",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 21000000,
          realizedAmount: 20125000,
        },
        {
          componentCategory: "Pengembangan Profesi Guru dan Tenaga Kependidikan",
          accountCode: "5.1.02.04.01.0003",
          description: "Workshop Implementasi Pembelajaran Mendalam & Koding-AI Guru (BOSP Kinerja)",
          fundSource: FundSource.BOSP_KINERJA,
          plannedAmount: 22500000,
          realizedAmount: 21400000,
        },
        {
          componentCategory: "Pembiayaan Langganan Daya dan Jasa",
          accountCode: "5.1.02.02.01.0061",
          description: "Pembayaran tagihan listrik PLN, air PDAM, dan internet fiber sekolah (Jan–Jun 2026)",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 19800000,
          realizedAmount: 19240000,
        },
        {
          componentCategory: "Pemeliharaan Sarana dan Prasarana Sekolah",
          accountCode: "5.1.02.03.03.0001",
          description: "Perbaikan atap bocor ruang kelas 4, pengecatan ruang guru, dan perbaikan sanitasi siswa",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 34000000,
          realizedAmount: 32600000,
        },
        {
          componentCategory: "Penyediaan Alat Multimedia Pembelajaran",
          accountCode: "5.2.02.10.01.0002",
          description: "Pengadaan 2 unit LCD Proyektor kelas dan perangkat audio pembelajaran interaktif",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 24500000,
          realizedAmount: 23900000,
        },
        {
          componentCategory: "Pembayaran Honor",
          accountCode: "5.1.02.02.01.0013",
          description: "Honorarium bulanan 4 Guru Non-ASN dan Tenaga Perpustakaan terdaftar Dapodik (6 bulan)",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 33600000,
          realizedAmount: 33600000,
        },
      ],
    },
    {
      fiscalYear: 2026,
      stage: BudgetStage.TAHAP_2,
      openingBalance: 14015000,
      regularReceived: 218400000,
      performanceReceived: 15000000,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date("2026-11-15T10:30:00Z"),
      notes: "Realisasi berjalan Tahap 2 Tahun Anggaran 2026 (s.d. November 2026).",
      fileName: "bosp-2026-tahap-2.pdf",
      expenses: [
        {
          componentCategory: "Pengembangan Perpustakaan",
          accountCode: "5.2.05.01.01.0002",
          description: "Langganan platform buku digital sekolah dan pengadaan rak pojok baca kelas 1–6",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 29000000,
          realizedAmount: 25400000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler",
          accountCode: "5.1.02.01.01.0012",
          description: "Pelaksanaan lomba O2SN/FLS2N, ekstrakurikuler olahraga, dan bahan ajar projek P5",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 35000000,
          realizedAmount: 28900000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran",
          accountCode: "5.1.02.01.01.0024",
          description: "Pelaksanaan ANBK Utama Kelas 5 dan cetak laporan hasil belajar (Rapor)",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 22000000,
          realizedAmount: 19600000,
        },
        {
          componentCategory: "Pelaksanaan Administrasi Kegiatan Sekolah",
          accountCode: "5.1.02.01.01.0024",
          description: "Belanja kebutuhan operasional tata usaha, kebersihan sekolah, dan pelaporan BOSP",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 22400000,
          realizedAmount: 18750000,
        },
        {
          componentCategory: "Pengembangan Profesi Guru dan Tenaga Kependidikan",
          accountCode: "5.1.02.04.01.0003",
          description: "Penguatan Komunitas Belajar (Kombel) & pendampingan literasi numerasi (BOSP Kinerja)",
          fundSource: FundSource.BOSP_KINERJA,
          plannedAmount: 15000000,
          realizedAmount: 12800000,
        },
        {
          componentCategory: "Pembiayaan Langganan Daya dan Jasa",
          accountCode: "5.1.02.02.01.0061",
          description: "Tagihan listrik, PDAM, dan internet sekolah semester genap/awal tahun ajaran",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 20400000,
          realizedAmount: 16900000,
        },
        {
          componentCategory: "Pemeliharaan Sarana dan Prasarana Sekolah",
          accountCode: "5.1.02.03.03.0001",
          description: "Penggantian meja kursi siswa rusak, perbaikan pagar halaman, dan servis AC ruang komputer",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 38000000,
          realizedAmount: 31200000,
        },
        {
          componentCategory: "Penyediaan Alat Multimedia Pembelajaran",
          accountCode: "5.2.02.10.01.0002",
          description: "Pengadaan Chromebook tambahan untuk asesmen berbasis komputer",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 27000000,
          realizedAmount: 26500000,
        },
        {
          componentCategory: "Pembayaran Honor",
          accountCode: "5.1.02.02.01.0013",
          description: "Honorarium bulanan Guru Non-ASN dan Tenaga Administrasi/Kebersihan (Jul–Nov 2026)",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 33600000,
          realizedAmount: 28000000,
        },
      ],
    },
    {
      fiscalYear: 2025,
      stage: BudgetStage.TAHUNAN,
      openingBalance: 11200000,
      regularReceived: 421200000,
      performanceReceived: 20000000,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date("2026-01-20T08:00:00Z"),
      notes: "Laporan Pertanggungjawaban Tahunan BOSP Tahun Anggaran 2025 (Audit & Rekonsiliasi Final).",
      fileName: "bosp-2025-tahunan.pdf",
      expenses: [
        {
          componentCategory: "Penerimaan Peserta Didik Baru (PPDB)",
          accountCode: "5.1.02.01.01.0026",
          description: "Operasional PPDB dan Masa Pengenalan Lingkungan Sekolah (MPLS) 2025",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 8500000,
          realizedAmount: 8420000,
        },
        {
          componentCategory: "Pengembangan Perpustakaan",
          accountCode: "5.2.05.01.01.0001",
          description: "Pembelian buku teks utama, buku pengayaan, dan revitalisasi pojok baca kelas",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 68000000,
          realizedAmount: 67250000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler",
          accountCode: "5.1.02.01.01.0012",
          description: "Alat peraga pembelajaran tematik, kegiatan Pramuka, kesenian Bali, dan olahraga",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 64000000,
          realizedAmount: 62100000,
        },
        {
          componentCategory: "Pelaksanaan Kegiatan Asesmen dan Evaluasi Pembelajaran",
          accountCode: "5.1.02.01.01.0024",
          description: "Asesmen sumatif, ANBK, dan evaluasi pembelajaran selama Tahun Anggaran 2025",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 36500000,
          realizedAmount: 35800000,
        },
        {
          componentCategory: "Pelaksanaan Administrasi Kegiatan Sekolah",
          accountCode: "5.1.02.01.01.0024",
          description: "ATK, perlengkapan kebersihan, bahan habis pakai, dan administrasi RKAS/SPJ",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 42000000,
          realizedAmount: 41300000,
        },
        {
          componentCategory: "Pengembangan Profesi Guru dan Tenaga Kependidikan",
          accountCode: "5.1.02.04.01.0003",
          description: "In-House Training (IHT) Kurikulum Merdeka dan Penguatan Literasi (BOSP Kinerja)",
          fundSource: FundSource.BOSP_KINERJA,
          plannedAmount: 20000000,
          realizedAmount: 19650000,
        },
        {
          componentCategory: "Pembiayaan Langganan Daya dan Jasa",
          accountCode: "5.1.02.02.01.0061",
          description: "Listrik, air bersih PDAM, dan langganan internet sekolah 12 bulan penuh",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 38400000,
          realizedAmount: 37980000,
        },
        {
          componentCategory: "Pemeliharaan Sarana dan Prasarana Sekolah",
          accountCode: "5.1.02.03.03.0001",
          description: "Pengecatan gedung sekolah, perbaikan plafon ruang kelas, dan rehabilitasi toilet",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 69000000,
          realizedAmount: 67800000,
        },
        {
          componentCategory: "Penyediaan Alat Multimedia Pembelajaran",
          accountCode: "5.2.02.10.01.0002",
          description: "Pengadaan 4 unit laptop pembelajaran dan speaker aktif aula",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 36000000,
          realizedAmount: 35600000,
        },
        {
          componentCategory: "Pembayaran Honor",
          accountCode: "5.1.02.02.01.0013",
          description: "Honorarium 4 Guru Non-ASN dan Tenaga Perpustakaan selama 12 bulan",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 62000000,
          realizedAmount: 62000000,
        },
      ],
    },
    {
      fiscalYear: 2026,
      stage: BudgetStage.TAHUNAN,
      openingBalance: 14500000,
      regularReceived: 436800000,
      performanceReceived: 37500000,
      status: PublishStatus.DRAFT,
      publishedAt: null,
      notes: "Draft kompilasi Tahunan 2026 — menunggu tutup buku Desember 2026 sebelum dipublikasikan.",
      fileName: null,
      expenses: [
        {
          componentCategory: "Penerimaan Peserta Didik Baru (PPDB)",
          accountCode: "5.1.02.01.01.0026",
          description: "Rekapitulasi belanja PPDB Tahun 2026",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 6500000,
          realizedAmount: 6350000,
        },
        {
          componentCategory: "Pengembangan Perpustakaan",
          accountCode: "5.2.05.01.01.0001",
          description: "Rekapitulasi buku literasi dan layanan pojok baca 2026",
          fundSource: FundSource.BOSP_REGULER,
          plannedAmount: 65000000,
          realizedAmount: 60820000,
        },
      ],
    },
  ];

  for (const item of periodsSeed) {
    const totalReceived = item.regularReceived + item.performanceReceived;
    const totalSpent = item.expenses.reduce((acc, e) => acc + e.realizedAmount, 0);
    const endingBalance = item.openingBalance + totalReceived - totalSpent;

    const created = await prisma.budgetPeriod.create({
      data: {
        fiscalYear: item.fiscalYear,
        stage: item.stage,
        openingBalance: item.openingBalance,
        totalReceived,
        regularReceived: item.regularReceived,
        performanceReceived: item.performanceReceived,
        totalSpent,
        endingBalance,
        documentUrl: item.fileName ? `/samples/${item.fileName}` : null,
        documentName: item.fileName
          ? `Laporan_Realisasi_BOSP_${item.fiscalYear}_${item.stage}.pdf`
          : null,
        documentMimeType: item.fileName ? "application/pdf" : null,
        status: item.status,
        publishedAt: item.publishedAt,
        notes: item.notes,
        expenses: {
          create: item.expenses.map((exp) => ({
            componentCategory: exp.componentCategory,
            accountCode: exp.accountCode,
            description: exp.description,
            fundSource: exp.fundSource,
            plannedAmount: exp.plannedAmount,
            realizedAmount: exp.realizedAmount,
          })),
        },
      },
    });

    if (item.fileName) {
      const pdfBytes = await generateBospOfficialPdf(schoolData, {
        id: created.id,
        fiscalYear: item.fiscalYear,
        stage: item.stage,
        openingBalance: item.openingBalance,
        totalReceived,
        regularReceived: item.regularReceived,
        performanceReceived: item.performanceReceived,
        totalSpent,
        endingBalance,
        status: item.status,
        publishedAt: item.publishedAt,
        expenses: item.expenses,
      });
      await fs.writeFile(path.join(samplesDir, item.fileName), pdfBytes);
    }
  }

  // 4. Seed Public Feedback
  await prisma.publicFeedback.deleteMany();
  await prisma.publicFeedback.createMany({
    data: [
      {
        senderName: "Bapak Putu Mahendra",
        senderRole: "Komite Sekolah",
        contact: "081234567890",
        message:
          "Terima kasih atas keterbukaan laporan BOSP Tahap 1 2026. Mohon dipertimbangkan penambahan kipas angin atau ventilasi untuk ruang kelas 3B pada anggaran pemeliharaan sarpras tahap berikutnya.",
        isRead: true,
        adminNote: "Sudah ditindaklanjuti dalam rapat RKAS perubahan bersama Kepala Sekolah.",
      },
      {
        senderName: "Ibu Ni Wayan Lestari",
        senderRole: "Orang Tua / Wali Murid",
        contact: "wayan.lestari@email.com",
        message:
          "Apakah buku literasi yang dibeli melalui komponen Pengembangan Perpustakaan sudah bisa dipinjam siswa kelas 2 untuk dibawa pulang?",
        isRead: false,
      },
      {
        senderName: "Kadek Surya Pratama",
        senderRole: "Masyarakat Umum",
        contact: "085712349876",
        message:
          "Apresiasi untuk tampilan portal TERAS-BOSP yang sangat jelas dan mudah dipahami orang tua murid. Semoga transparansi ini terus terjaga.",
        isRead: false,
      },
    ],
  });

  console.log(`Seeding selesai! Profil sekolah: ${schoolProfile.name}, Admin: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error("Error saat seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
