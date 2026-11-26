# TERAS-BOSP
**Transparansi Elektronik Realisasi Anggaran Sekolah — BOSP**

Aplikasi web Full-Stack berbasis **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, dan **Neon (Serverless PostgreSQL)** untuk mewujudkan keterbukaan informasi pengelolaan Dana Bantuan Operasional Satuan Pendidikan (BOSP) sekolah yang akuntabel, mudah dipahami masyarakat, serta dilengkapi **AI Smart Document Extractor** untuk membaca laporan ARKAS/BOSP Salur secara otomatis.

---

## Fitur Utama

### 1. Portal Publik (Akses Umum Tanpa Login)
- **Header Identitas Sekolah & Filter Periode:** Menampilkan Nama Sekolah, NPSN, alamat, Kepala Sekolah, Bendahara BOSP, serta filter **Tahun Anggaran** dan **Tahap** (`Tahap 1`, `Tahap 2`, `Tahunan`).
- **Kartu Ringkasan Anggaran (KPI Cards):**
  1. Saldo Awal / Sisa Tahun Lalu
  2. Total Dana BOSP Diterima (rincian BOSP Reguler & BOSP Kinerja)
  3. Total Realisasi Belanja & persentase serapan
  4. Sisa Saldo Akhir
- **Visualisasi Infografis Interaktif (Recharts):** Grafik Batang (RKAS vs Realisasi) dan Grafik Donat untuk seluruh **12 Komponen Standar Penggunaan BOSP** sesuai Permendikbudristek Juknis BOSP.
- **Tabel Rincian Belanja Interaktif:** Pencarian teks (*search*), filter komponen & sumber dana (`BOSP Reguler` / `BOSP Kinerja`), pengurutan (*sorting*) setiap kolom, dan total ringkasan otomatis.
- **Pratinjau & Unduh Dokumen Resmi:** Embed PDF viewer langsung di halaman beserta tombol unduh dokumen asli (PDF/Excel) dan rekap PDF.
- **Kanal Pengaduan & Umpan Balik Masyarakat:** Formulir aspirasi/pertanyaan bagi orang tua murid, komite sekolah, dan masyarakat umum yang tersimpan langsung ke database Neon.
- **Mode Cetak Bersih (`Cetak Laporan`):** Mendukung pencetakan langsung dari browser.

### 2. Portal Admin (`/admin`)
- **Autentikasi Aman:** Login berbasis email & password dengan hashing `bcryptjs` dan cookie HTTP-only bertanda tangan JWT (`jose`), dilindungi di tingkat `proxy.ts` (Next.js 16) maupun validasi sesi server-side.
- **AI Smart Upload & Extractor (`/api/admin/extract`):**
  - Mendukung *Drag-and-Drop* file laporan **Excel (`.xlsx` / `.xls`)** melalui SheetJS (`xlsx`) dan **PDF (`.pdf`)** melalui `unpdf` + multimodal PDF.
  - Terintegrasi dengan **Google Gemini API (`@google/genai`)** dan **OpenAI API (`openai`)** menggunakan *Structured Outputs (JSON Schema)* yang memetakan pos belanja secara otomatis ke **12 Komponen Standar BOSP**, serta dilengkapi parser heuristik lokal jika `AI_API_KEY` belum diisi.
  - **Mode Review & Verifikasi (Human-in-the-Loop):** Bendahara dapat mengedit angka, menambah/menghapus baris belanja, lalu menekan **Approve & Publish ke Portal Umum** atau menyimpannya sebagai **Draft**.
- **Manajemen Publikasi & Lampiran:** Mengubah status `DRAFT` / `PUBLISHED`, mengganti file lampiran PDF/Excel resmi, melihat pratinjau PDF, atau menghapus laporan.
- **Pengaturan Profil Sekolah:** Mengubah Nama Sekolah, NPSN, Kepala Sekolah, Bendahara, alamat, dan kontak resmi sekolah.
- **Kotak Masuk Pengaduan Publik:** Membaca masukan masyarakat, memfilter pesan belum dibaca, menandai status baca, dan menyimpan catatan tindak lanjut.

---

## Arsitektur & Struktur Folder

```text
TERAS-BOSP/
├── app/
│   ├── (public)/               # Portal Transparansi Publik (/)
│   ├── admin/
│   │   ├── login/              # Halaman Login Admin (/admin/login)
│   │   └── page.tsx            # Dashboard Admin Terproteksi (/admin)
│   └── api/
│       ├── health/             # Cek koneksi database Neon
│       ├── public/             # Endpoint data BOSP publik & kirim pengaduan
│       ├── documents/[id]/     # Streaming/unduh dokumen resmi & PDF generator
│       └── admin/              # Auth, AI extract, CRUD periods, profile, feedback
├── components/
│   ├── ui/                     # Komponen UI modular (Button, Card, Badge, Input, Skeleton)
│   ├── public/                 # Komponen Portal Publik (KPI, Recharts, Tabel, PDF Viewer, Form)
│   └── admin/                  # Komponen Portal Admin (Smart Upload, Publikasi, Inbox, Profil)
├── lib/
│   ├── ai-extractor.ts         # Integrasi Structured Outputs (Gemini / OpenAI) + parser heuristik
│   ├── auth.ts & auth-token.ts # Session JWT (jose) & bcryptjs
│   ├── bosp-constants.ts       # 12 Komponen Standar BOSP & formatter Rupiah
│   ├── bosp-queries.ts         # Query & agregasi data portal publik
│   ├── file-parser.ts          # Parser Excel (xlsx) & PDF (unpdf)
│   ├── pdf-generator.ts        # Pembuat dokumen PDF laporan BOSP resmi (pdf-lib)
│   ├── prisma.ts               # Singleton PrismaClient
│   └── storage.ts              # Upload ke Vercel Blob / penyimpanan lokal dev
├── prisma/
│   ├── schema.prisma           # Skema PostgreSQL Neon (5 model utama)
│   └── seed.ts                 # Seeder data realistis BOSP & 1 akun admin default
└── proxy.ts                    # Proteksi rute /admin & /api/admin/* (Next.js 16)
```

---

## Daftar Environment Variables

Salin `.env.example` menjadi `.env` untuk pengembangan lokal, dan pastikan seluruh variabel berikut diisi di dashboard **Vercel -> Project Settings -> Environment Variables**:

| Nama Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | **Ya** | Connection string pooled **Neon PostgreSQL** (`postgresql://...?sslmode=require`). |
| `AUTH_SECRET` | **Ya** | Secret acak minimal 32 karakter untuk signing JWT session admin (`openssl rand -hex 32`). |
| `AI_API_KEY` | Disarankan | API key untuk AI Document Extractor: **Google Gemini API** (`AIza...`) atau **OpenAI API** (`sk-...`). Jika kosong, sistem otomatis memakai parser heuristik lokal. |
| `AI_PROVIDER` | Opsional | `"auto"` (deteksi otomatis dari prefix key), `"gemini"`, atau `"openai"`. Default: `"auto"`. |
| `BLOB_READ_WRITE_TOKEN` | Disarankan (Prod) | Token **Vercel Blob** agar file PDF/Excel unggahan admin tersimpan persisten di cloud saat berjalan di Vercel. |

---

## Menjalankan Secara Lokal

1. **Instal dependensi:**
   ```bash
   npm install
   ```
2. **Siapkan `.env`:**
   ```bash
   cp .env.example .env
   ```
   Isi `DATABASE_URL` dan `AUTH_SECRET` (serta `AI_API_KEY` jika ingin menguji ekstraksi LLM penuh).
3. **Sinkronisasi skema & isi data awal (seed) ke Neon:**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
4. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` untuk **Portal Publik** dan `http://localhost:3000/admin` untuk **Portal Admin**.

### Akun Admin Default (Hasil Seed)
- **Email:** `admin@teras-bosp.sch.id`
- **Password:** `TerasBosp2026!`
*(Segera ubah password / buat akun baru setelah deploy produksi).*

---

## Panduan Push ke GitHub & Deploy ke Vercel

### 1. Push Kode ke Repositori GitHub
Pastikan file `.env` tidak ikut ter-commit (`.gitignore` sudah mengecualikan `.env*` kecuali `.env.example`):

```bash
git init
git add .
git commit -m "feat: initial full-stack TERAS-BOSP application"
git branch -M main
git remote add origin https://github.com/CendanaVisual/TERAS-BOSP.git
git push -u origin main
```

### 2. Migrasi Database Neon Sebelum / Saat Deploy Vercel
Jalankan perintah berikut dari terminal lokal (yang sudah mengarah ke `DATABASE_URL` Neon produksi) atau sebagai *Build Command* di Vercel:

```bash
# Sinkronkan skema tabel ke Neon PostgreSQL
npx prisma db push

# Isi data awal profil sekolah, laporan contoh, dan akun admin default
npm run db:seed
```

### 3. Deploy di Vercel
1. Login ke [Vercel](https://vercel.com), klik **Add New... -> Project**, lalu impor repositori GitHub **`CendanaVisual/TERAS-BOSP`**.
2. Pada bagian **Build & Output Settings**, *Build Command* default dari `package.json` sudah menjalankan `prisma generate && next build` (atau Anda dapat mengubahnya menjadi `npx prisma db push && prisma generate && next build` jika ingin skema selalu sinkron otomatis saat deploy).
3. Masukkan seluruh **Environment Variables** (`DATABASE_URL`, `AUTH_SECRET`, `AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`) di menu **Environment Variables** sebelum atau setelah build, lalu lakukan **Redeploy** (tanpa build cache) apabila variabel baru ditambahkan.
   > **Catatan Neon + Vercel:** Connection string Neon (`?sslmode=require&channel_binding=require`) secara otomatis disanitasi oleh `lib/prisma.ts` agar kompatibel dengan runtime serverless Linux (`rhel-openssl-3.0.x`).
4. Aktifkan **Vercel Blob Storage** pada tab **Storage** di dashboard proyek Vercel agar `BLOB_READ_WRITE_TOKEN` otomatis terpasang.
5. Klik **Deploy** dan verifikasi endpoint `/api/health` mengembalikan `{ "status": "ok", "database": "connected" }`.
