import { GoogleGenAI, Type, type Schema } from "@google/genai";
import OpenAI from "openai";
import { z } from "zod";
import {
  BOSP_COMPONENTS,
  normalizeBospComponent,
} from "./bosp-constants";
import type { ParsedDocumentContent } from "./file-parser";

export const extractedExpenseSchema = z.object({
  componentCategory: z.string(),
  accountCode: z.string(),
  description: z.string(),
  fundSource: z.enum(["BOSP_REGULER", "BOSP_KINERJA"]),
  plannedAmount: z.number().nonnegative(),
  realizedAmount: z.number().nonnegative(),
});

export const extractedPeriodSchema = z.object({
  fiscalYear: z.number().int().min(2015).max(2040),
  stage: z.enum(["TAHAP_1", "TAHAP_2", "TAHUNAN"]),
  openingBalance: z.number().nonnegative(),
  regularReceived: z.number().nonnegative(),
  performanceReceived: z.number().nonnegative(),
  totalReceived: z.number().nonnegative(),
  totalSpent: z.number().nonnegative(),
  endingBalance: z.number(),
  notes: z.string(),
  expenses: z.array(extractedExpenseSchema),
});

export type ExtractedBospData = z.infer<typeof extractedPeriodSchema> & {
  extractionMode: "ai-gemini" | "ai-openai" | "heuristic-fallback";
  warning?: string;
};

const SYSTEM_PROMPT = `Anda adalah Akuntan Publik & Auditor Dana BOSP (Bantuan Operasional Satuan Pendidikan) Kementerian Pendidikan Indonesia yang ahli membaca seluruh format laporan Excel/PDF ARKAS dan BOSP Salur (BKU, RKAS, K7/K7a/K7b, SPTJM, maupun Rekap Realisasi Penggunaan Dana BOSP).

Tugas Anda:
1. Baca seluruh sheet/halaman dokumen laporan keuangan sekolah (Excel/PDF) yang diberikan secara teliti.
2. Identifikasi metadata periode:
   - fiscalYear (integer, misal 2025 atau 2026)
   - stage ("TAHAP_1" untuk Jan-Jun / Tahap 1 / Semester 1, "TAHAP_2" untuk Jul-Des / Tahap 2 / Semester 2, atau "TAHUNAN" untuk laporan 1 tahun penuh)
   - openingBalance (Saldo Awal / Sisa Tahun Lalu / SiLPA dalam Rupiah penuh, angka murni tanpa titik/koma ribuan)
   - regularReceived (Penerimaan Dana BOSP Reguler)
   - performanceReceived (Penerimaan Dana BOSP Kinerja, isi 0 jika tidak ada)
   - totalReceived (Total Dana BOSP Diterima = regularReceived + performanceReceived jika tidak tertulis eksplisit)
   - totalSpent (Total Realisasi Belanja = jumlah seluruh realisasi belanja yang sah)
   - endingBalance (Sisa Saldo Akhir = openingBalance + totalReceived - totalSpent bila tidak tertulis eksplisit)
   - notes (ringkasan singkat 1 kalimat mengenai dokumen sumber, misalnya nama sheet/periode)
3. Ekstrak setiap baris rincian kegiatan/belanja yang sah ke dalam array "expenses":
   - Dukung format Rekap RKAS vs Realisasi (ambil Anggaran/Pagu sebagai plannedAmount dan Realisasi sebagai realizedAmount).
   - Dukung format BKU ARKAS (ambil baris Pengeluaran/Kredit sebagai realizedAmount; jika tidak ada kolom RKAS/Anggaran, isi plannedAmount sama dengan realizedAmount; ABAIKAN baris transaksi mutasi kas internal seperti "Tarik Tunai", "Setor Tunai", "Pergeseran Kas", "Saldo Awal", "Terima Dana BOSP", serta baris subtotal/jumlah total agar tidak terjadi perhitungan ganda).
   - Dukung format Rekap per 12 Komponen Standar BOSP maupun format tabel bendahara sekolah lainnya.
   - Jika kode rekening tidak tersedia pada baris, gunakan kode standar belanja BOSP yang relevan (misal "5.1.02.01.01.0024").
4. Petakan setiap item belanja ke SALAH SATU dari 12 Komponen Standar BOSP berikut secara persis:
${BOSP_COMPONENTS.map((c, idx) => `   ${idx + 1}. "${c}"`).join("\n")}
5. Gunakan fundSource "BOSP_KINERJA" jika uraian/sumber/sheet menyebut BOSP Kinerja / Sekolah Penggerak / Prestasi, dan "BOSP_REGULER" untuk selainnya.
6. Pastikan seluruh nilai uang berupa angka numerik murni dalam Rupiah (tanpa "Rp", tanpa pemisah ribuan, tidak negatif).`;

const GEMINI_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    fiscalYear: { type: Type.INTEGER },
    stage: {
      type: Type.STRING,
      enum: ["TAHAP_1", "TAHAP_2", "TAHUNAN"],
    },
    openingBalance: { type: Type.NUMBER },
    regularReceived: { type: Type.NUMBER },
    performanceReceived: { type: Type.NUMBER },
    totalReceived: { type: Type.NUMBER },
    totalSpent: { type: Type.NUMBER },
    endingBalance: { type: Type.NUMBER },
    notes: { type: Type.STRING },
    expenses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          componentCategory: {
            type: Type.STRING,
            enum: [...BOSP_COMPONENTS],
          },
          accountCode: { type: Type.STRING },
          description: { type: Type.STRING },
          fundSource: {
            type: Type.STRING,
            enum: ["BOSP_REGULER", "BOSP_KINERJA"],
          },
          plannedAmount: { type: Type.NUMBER },
          realizedAmount: { type: Type.NUMBER },
        },
        required: [
          "componentCategory",
          "accountCode",
          "description",
          "fundSource",
          "plannedAmount",
          "realizedAmount",
        ],
      },
    },
  },
  required: [
    "fiscalYear",
    "stage",
    "openingBalance",
    "regularReceived",
    "performanceReceived",
    "totalReceived",
    "totalSpent",
    "endingBalance",
    "notes",
    "expenses",
  ],
};

const OPENAI_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    fiscalYear: { type: "integer" },
    stage: { type: "string", enum: ["TAHAP_1", "TAHAP_2", "TAHUNAN"] },
    openingBalance: { type: "number" },
    regularReceived: { type: "number" },
    performanceReceived: { type: "number" },
    totalReceived: { type: "number" },
    totalSpent: { type: "number" },
    endingBalance: { type: "number" },
    notes: { type: "string" },
    expenses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          componentCategory: {
            type: "string",
            enum: [...BOSP_COMPONENTS],
          },
          accountCode: { type: "string" },
          description: { type: "string" },
          fundSource: {
            type: "string",
            enum: ["BOSP_REGULER", "BOSP_KINERJA"],
          },
          plannedAmount: { type: "number" },
          realizedAmount: { type: "number" },
        },
        required: [
          "componentCategory",
          "accountCode",
          "description",
          "fundSource",
          "plannedAmount",
          "realizedAmount",
        ],
      },
    },
  },
  required: [
    "fiscalYear",
    "stage",
    "openingBalance",
    "regularReceived",
    "performanceReceived",
    "totalReceived",
    "totalSpent",
    "endingBalance",
    "notes",
    "expenses",
  ],
};

function parseIndoNumber(raw: string): number {
  const cleaned = raw.replace(/rp\.?/gi, "").replace(/\s+/g, "").trim();
  if (!cleaned) return 0;
  // Handle Indonesian formatting like 12.500.000 or 12.500.000,00 vs 12,500,000
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(cleaned)) {
    return Number(cleaned.replace(/,/g, "")) || 0;
  }
  const numeric = Number(cleaned.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function finalizeExtractedPayload(
  raw: z.infer<typeof extractedPeriodSchema>,
  mode: ExtractedBospData["extractionMode"],
  warning?: string
): ExtractedBospData {
  const normalizedExpenses = raw.expenses
    .filter((e) => e.description.trim().length > 0 && (e.plannedAmount > 0 || e.realizedAmount > 0))
    .map((e) => {
      const realizedAmount = Math.max(0, Math.round(e.realizedAmount));
      const rawPlanned = Math.max(0, Math.round(e.plannedAmount));
      const plannedAmount = rawPlanned > 0 ? rawPlanned : realizedAmount;
      return {
        componentCategory: normalizeBospComponent(e.componentCategory || e.description),
        accountCode: e.accountCode.trim() || "5.1.02.01.01.0024",
        description: e.description.trim(),
        fundSource: e.fundSource,
        plannedAmount,
        realizedAmount,
      };
    });

  const summedSpent = normalizedExpenses.reduce(
    (sum, item) => sum + item.realizedAmount,
    0
  );
  const totalSpent = summedSpent > 0 ? summedSpent : Math.round(raw.totalSpent);
  const regularReceived = Math.round(raw.regularReceived);
  const performanceReceived = Math.round(raw.performanceReceived);
  const totalReceived =
    raw.totalReceived > 0
      ? Math.round(raw.totalReceived)
      : regularReceived + performanceReceived;
  const openingBalance = Math.round(raw.openingBalance);
  const endingBalance =
    Number.isFinite(raw.endingBalance) && raw.endingBalance !== 0
      ? Math.round(raw.endingBalance)
      : openingBalance + totalReceived - totalSpent;

  return {
    fiscalYear: raw.fiscalYear,
    stage: raw.stage,
    openingBalance,
    regularReceived:
      regularReceived > 0
        ? regularReceived
        : Math.max(0, totalReceived - performanceReceived),
    performanceReceived,
    totalReceived,
    totalSpent,
    endingBalance,
    notes: raw.notes,
    expenses: normalizedExpenses,
    extractionMode: mode,
    warning,
  };
}

function resolveProvider(): {
  provider: "gemini" | "openai" | "none";
  apiKey: string;
} {
  const configuredProvider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const primaryKey = (process.env.AI_API_KEY || "").trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();

  if (configuredProvider === "gemini" && (primaryKey || geminiKey)) {
    return { provider: "gemini", apiKey: primaryKey || geminiKey };
  }
  if (configuredProvider === "openai" && (primaryKey || openaiKey)) {
    return { provider: "openai", apiKey: primaryKey || openaiKey };
  }

  if (primaryKey) {
    if (primaryKey.startsWith("sk-")) {
      return { provider: "openai", apiKey: primaryKey };
    }
    return { provider: "gemini", apiKey: primaryKey };
  }
  if (geminiKey) return { provider: "gemini", apiKey: geminiKey };
  if (openaiKey) return { provider: "openai", apiKey: openaiKey };

  return { provider: "none", apiKey: "" };
}

function extractWithHeuristicFallback(doc: ParsedDocumentContent): ExtractedBospData {
  const text = doc.extractedText || "";
  const yearMatch = text.match(/20(2[0-9]|3[0-5])/);
  const fiscalYear = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();

  const lowerText = text.toLowerCase();
  let stage: "TAHAP_1" | "TAHAP_2" | "TAHUNAN" = "TAHAP_1";
  if (lowerText.includes("tahap 2") || lowerText.includes("tahap ii") || lowerText.includes("semester 2")) {
    stage = "TAHAP_2";
  } else if (lowerText.includes("tahunan") || lowerText.includes("januari - desember")) {
    stage = "TAHUNAN";
  }

  let openingBalance = 0;
  let regularReceived = 0;
  let performanceReceived = 0;
  let totalReceived = 0;

  const expenses: Array<z.infer<typeof extractedExpenseSchema>> = [];

  if (doc.fileKind === "excel" && doc.sheetRows.length > 0) {
    let headerIdx = -1;
    const colMap = {
      code: -1,
      comp: -1,
      desc: -1,
      source: -1,
      planned: -1,
      realized: -1,
    };

    for (let i = 0; i < doc.sheetRows.length; i++) {
      const cells = doc.sheetRows[i].cells;
      const joined = cells.join(" ").toLowerCase();

      if (headerIdx === -1) {
        if (joined.includes("saldo awal") || joined.includes("sisa tahun lalu")) {
          const nums = cells.map(parseIndoNumber).filter((n) => n > 0);
          if (nums.length > 0) openingBalance = nums[nums.length - 1];
        }
        if (
          joined.includes("bosp reguler") &&
          !joined.includes("peserta didik") &&
          (joined.includes("terima") || joined.includes("penerimaan"))
        ) {
          const nums = cells.map(parseIndoNumber).filter((n) => n > 0);
          if (nums.length > 0) regularReceived = nums[nums.length - 1];
        }
        if (
          joined.includes("bosp kinerja") &&
          (joined.includes("terima") || joined.includes("penerimaan"))
        ) {
          const nums = cells.map(parseIndoNumber).filter((n) => n > 0);
          if (nums.length > 0) performanceReceived = nums[nums.length - 1];
        }
        if (joined.includes("total diterima") || joined.includes("total penerimaan")) {
          const nums = cells.map(parseIndoNumber).filter((n) => n > 0);
          if (nums.length > 0) totalReceived = nums[nums.length - 1];
        }
      }

      if (
        headerIdx === -1 &&
        (joined.includes("uraian") || joined.includes("kegiatan")) &&
        (joined.includes("realisasi") || joined.includes("anggaran") || joined.includes("rkas"))
      ) {
        headerIdx = i;
        cells.forEach((c, ci) => {
          const h = c.toLowerCase();
          if (h.includes("kode") || h.includes("rekening")) colMap.code = ci;
          else if (h.includes("komponen")) colMap.comp = ci;
          else if (h.includes("uraian") || h.includes("kegiatan") || h.includes("belanja"))
            colMap.desc = ci;
          else if (h.includes("sumber")) colMap.source = ci;
          else if (h.includes("anggaran") || h.includes("rkas") || h.includes("pagu"))
            colMap.planned = ci;
          else if (h.includes("realisasi") || h.includes("keluar") || h.includes("jumlah"))
            colMap.realized = ci;
        });
      } else if (headerIdx !== -1 && i > headerIdx) {
        const desc = colMap.desc >= 0 ? cells[colMap.desc] || "" : "";
        const code = colMap.code >= 0 ? cells[colMap.code] || "" : "";
        const compRaw = colMap.comp >= 0 ? cells[colMap.comp] || "" : "";
        const sourceRaw = colMap.source >= 0 ? cells[colMap.source] || "" : "";
        const planned = colMap.planned >= 0 ? parseIndoNumber(cells[colMap.planned] || "") : 0;
        const realized = colMap.realized >= 0 ? parseIndoNumber(cells[colMap.realized] || "") : 0;

        const descLower = desc.toLowerCase();
        if (
          desc.length >= 3 &&
          !descLower.startsWith("total") &&
          !descLower.startsWith("jumlah") &&
          (planned > 0 || realized > 0)
        ) {
          expenses.push({
            componentCategory: normalizeBospComponent(compRaw || desc),
            accountCode: code || "5.1.02.01.01.0001",
            description: desc,
            fundSource: sourceRaw.toLowerCase().includes("kinerja")
              ? "BOSP_KINERJA"
              : "BOSP_REGULER",
            plannedAmount: planned || realized,
            realizedAmount: realized,
          });
        }
      }
    }
  } else if (text) {
    // Line-based heuristic for structured PDFs
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const codeMatch = line.match(/(5\.\d+\.\d+\.\d+\.\d+\.\d+)/);
      if (codeMatch) {
        const numbers = Array.from(line.matchAll(/(\d{1,3}(?:[.,]\d{3})+)/g)).map(
          (m) => parseIndoNumber(m[1])
        );
        if (numbers.length >= 1) {
          const realized = numbers[numbers.length - 1];
          const planned = numbers.length >= 2 ? numbers[numbers.length - 2] : realized;
          const desc = line
            .replace(codeMatch[1], "")
            .replace(/(\d{1,3}(?:[.,]\d{3})+)/g, "")
            .replace(/\s+/g, " ")
            .trim();
          if (desc.length >= 4) {
            expenses.push({
              componentCategory: normalizeBospComponent(desc),
              accountCode: codeMatch[1],
              description: desc.slice(0, 180),
              fundSource: line.toLowerCase().includes("kinerja")
                ? "BOSP_KINERJA"
                : "BOSP_REGULER",
              plannedAmount: planned,
              realizedAmount: realized,
            });
          }
        }
      }
    }
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.realizedAmount, 0);
  if (totalReceived === 0) {
    totalReceived = regularReceived + performanceReceived;
  }

  return finalizeExtractedPayload(
    {
      fiscalYear,
      stage,
      openingBalance,
      regularReceived,
      performanceReceived,
      totalReceived,
      totalSpent,
      endingBalance: openingBalance + totalReceived - totalSpent,
      notes: `Hasil pembacaan otomatis dari file ${doc.fileName}. Harap periksa kembali angka sebelum mempublikasikan.`,
      expenses,
    },
    "heuristic-fallback",
    "AI_API_KEY belum diisi di environment (.env / Vercel). Sistem menggunakan parser tabel heuristik lokal; tambahkan Gemini/OpenAI API key untuk ekstraksi AI penuh."
  );
}

function formatFriendlyAiError(aiError: unknown): string {
  const raw = aiError instanceof Error ? aiError.message : String(aiError);
  if (raw.includes("SERVICE_DISABLED") || raw.includes("aiplatform.googleapis.com")) {
    return "API Vertex AI belum diaktifkan pada project Google Cloud kunci AQ. Anda. Gunakan kunci gratis Google AI Studio (berawalan AIza...) dari aistudio.google.com/apikey, atau aktifkan Vertex AI API di Google Cloud Console.";
  }
  if (raw.includes("API_KEY_INVALID") || raw.includes("API key not valid") || raw.includes("401")) {
    return "AI_API_KEY tidak valid atau kedaluwarsa. Periksa kembali API key Google AI Studio (AIza...) atau OpenAI (sk-...) pada Vercel Environment Variables.";
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return "Kuota AI_API_KEY sementara penuh (rate limit).";
  }
  return "Layanan AI eksternal sedang tidak dapat dijangkau.";
}

export async function extractBospWithAI(
  doc: ParsedDocumentContent
): Promise<ExtractedBospData> {
  const { provider, apiKey } = resolveProvider();

  if (provider === "none") {
    return extractWithHeuristicFallback(doc);
  }

  const userPrompt = `Ekstrak laporan BOSP berikut ke format JSON terstruktur.
Nama File: ${doc.fileName}
Format: ${doc.fileKind.toUpperCase()}

Isi Teks / Tabel Dokumen:
${doc.extractedText || "(Teks PDF kosong atau berupa pindaian gambar, baca langsung dari lampiran PDF)."}`;

  if (provider === "gemini") {
    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [{ text: userPrompt }];

    if (doc.fileKind === "pdf" && doc.rawBase64 && doc.rawBase64.length < 18_000_000) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: doc.rawBase64,
        },
      });
    }

    const configuredModel = process.env.AI_MODEL?.trim();
    const candidateModels = [
      ...(configuredModel ? [configuredModel] : []),
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3-flash-preview",
      "gemini-2.5-flash",
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    // Always try standard Gemini Developer API first (works for both AIza... and AQ.... AI Studio keys).
    // Only fall back to enterprise/Vertex Express mode if standard API rejects auth on an AQ. key.
    const clientConfigs: Array<{ apiKey: string; enterprise?: boolean }> = [
      { apiKey },
      ...(apiKey.startsWith("AQ.") ? [{ enterprise: true, apiKey }] : []),
    ];

    let lastError: unknown = null;

    for (const clientConfig of clientConfigs) {
      const ai = new GoogleGenAI(clientConfig);
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts }],
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.1,
              responseMimeType: "application/json",
              responseSchema: GEMINI_RESPONSE_SCHEMA,
            },
          });

          const jsonText = response.text;
          if (!jsonText) {
            throw new Error(`Model ${model} mengembalikan respons kosong.`);
          }
          const parsedJson = JSON.parse(jsonText);
          const validated = extractedPeriodSchema.parse(parsedJson);
          return finalizeExtractedPayload(validated, "ai-gemini");
        } catch (aiError) {
          lastError = aiError;
          const status =
            typeof aiError === "object" && aiError !== null && "status" in aiError
              ? Number((aiError as { status?: unknown }).status)
              : 0;
          console.warn(
            `Gemini attempt failed (enterprise=${Boolean(clientConfig.enterprise)}, model=${model}, status=${status})`
          );
          // Auth/permission error applies to all models under this endpoint; switch clientConfig
          if (status === 401 || status === 403) {
            break;
          }
        }
      }
    }

    console.error("All Gemini extraction attempts failed, using heuristic fallback:", lastError);
    const fallback = extractWithHeuristicFallback(doc);
    return {
      ...fallback,
      warning: `${formatFriendlyAiError(lastError)} Data tetap berhasil diekstrak memakai parser tabel lokal sehingga Anda dapat langsung memeriksa dan mempublikasikan laporan.`,
    };
  }

  // OpenAI Structured Outputs
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bosp_extraction_schema",
          strict: true,
          schema: OPENAI_JSON_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI API mengembalikan respons kosong.");
    }
    const parsedJson = JSON.parse(content);
    const validated = extractedPeriodSchema.parse(parsedJson);
    return finalizeExtractedPayload(validated, "ai-openai");
  } catch (aiError) {
    console.error("OpenAI extraction failed, using heuristic fallback:", aiError);
    const fallback = extractWithHeuristicFallback(doc);
    return {
      ...fallback,
      warning: `${formatFriendlyAiError(aiError)} Data tetap berhasil diekstrak memakai parser tabel lokal sehingga Anda dapat langsung memeriksa dan mempublikasikan laporan.`,
    };
  }
}
