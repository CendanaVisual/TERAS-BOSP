import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  BUDGET_STAGE_LABELS,
  formatPercentage,
  formatRupiah,
} from "./bosp-constants";

export interface PdfReportPeriod {
  id: string;
  fiscalYear: number;
  stage: "TAHAP_1" | "TAHAP_2" | "TAHUNAN";
  openingBalance: number;
  totalReceived: number;
  regularReceived: number;
  performanceReceived: number;
  totalSpent: number;
  endingBalance: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: Date | string | null;
  expenses: Array<{
    componentCategory: string;
    accountCode: string;
    description: string;
    fundSource: "BOSP_REGULER" | "BOSP_KINERJA";
    plannedAmount: number;
    realizedAmount: number;
  }>;
}

export interface PdfSchoolProfile {
  name: string;
  npsn: string;
  address: string;
  headmaster: string;
  treasurer: string;
  district?: string;
  province?: string;
}

function sanitizePdfText(text: string): string {
  // Standard Helvetica in pdf-lib uses WinAnsi encoding
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
}

function wrapText(text: string, maxChars: number): string[] {
  const clean = sanitizePdfText(text).trim();
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Generates an official-style BOSP Realization Summary PDF using pdf-lib.
 * Used for seeded official reports and fallback printable PDF generation.
 */
export async function generateBospOfficialPdf(
  school: PdfSchoolProfile,
  period: PdfReportPeriod
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 portrait
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const navy = rgb(0.08, 0.2, 0.42);
  const slate = rgb(0.28, 0.33, 0.41);
  const lightBg = rgb(0.95, 0.97, 0.99);
  const borderGray = rgb(0.82, 0.85, 0.9);
  const emerald = rgb(0.04, 0.5, 0.35);
  const white = rgb(1, 1, 1);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 58,
      width: contentWidth,
      height: 58,
      color: navy,
    });

    page.drawText(sanitizePdfText("LAPORAN REALISASI PENGGUNAAN DANA BOSP"), {
      x: margin + 14,
      y: y - 22,
      size: 13,
      font: fontBold,
      color: white,
    });
    page.drawText(
      sanitizePdfText(
        `${school.name.toUpperCase()} (NPSN: ${school.npsn}) - Tahun Anggaran ${period.fiscalYear}`
      ),
      {
        x: margin + 14,
        y: y - 37,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.85, 0.91, 1),
      }
    );
    page.drawText(
      sanitizePdfText(
        `Periode: ${BUDGET_STAGE_LABELS[period.stage]} | Sumber: ARKAS / BOSP Salur`
      ),
      {
        x: margin + 14,
        y: y - 50,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.75, 0.85, 0.98),
      }
    );

    y -= 72;
  };

  drawHeader();

  // School address line
  page.drawText(sanitizePdfText(`Alamat: ${school.address}`), {
    x: margin,
    y,
    size: 8.5,
    font: fontRegular,
    color: slate,
  });
  y -= 18;

  // Summary KPI Box
  const kpiItems = [
    { label: "Saldo Awal", value: formatRupiah(period.openingBalance) },
    { label: "Dana BOSP Diterima", value: formatRupiah(period.totalReceived) },
    { label: "Total Realisasi Belanja", value: formatRupiah(period.totalSpent) },
    { label: "Sisa Saldo Akhir", value: formatRupiah(period.endingBalance) },
  ];

  const boxWidth = (contentWidth - 18) / 4;
  kpiItems.forEach((item, idx) => {
    const x = margin + idx * (boxWidth + 6);
    page.drawRectangle({
      x,
      y: y - 44,
      width: boxWidth,
      height: 44,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 0.8,
    });
    page.drawText(sanitizePdfText(item.label), {
      x: x + 8,
      y: y - 15,
      size: 7.5,
      font: fontRegular,
      color: slate,
    });
    page.drawText(sanitizePdfText(item.value), {
      x: x + 8,
      y: y - 32,
      size: 9.5,
      font: fontBold,
      color: idx === 2 ? emerald : navy,
    });
  });

  y -= 62;

  page.drawText("RINCIAN REALISASI BELANJA PER KEGIATAN & KOMPONEN BOSP", {
    x: margin,
    y,
    size: 9.5,
    font: fontBold,
    color: navy,
  });
  y -= 10;

  // Table header
  const colX = [margin, margin + 72, margin + 210, margin + 335, margin + 395, margin + 455, margin + 515];
  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 20,
      width: contentWidth,
      height: 20,
      color: navy,
    });
    const headers = [
      { text: "Kode Rek.", x: colX[0] + 4 },
      { text: "Uraian Belanja", x: colX[1] + 4 },
      { text: "Komponen BOSP", x: colX[2] + 4 },
      { text: "Sumber", x: colX[3] + 4 },
      { text: "RKAS (Rp)", x: colX[4] + 4 },
      { text: "Realisasi (Rp)", x: colX[5] + 4 },
    ];
    for (const h of headers) {
      page.drawText(h.text, {
        x: h.x,
        y: y - 13,
        size: 7.5,
        font: fontBold,
        color: white,
      });
    }
    y -= 20;
  };

  drawTableHeader();

  for (let i = 0; i < period.expenses.length; i++) {
    const item = period.expenses[i];
    const descLines = wrapText(item.description, 26).slice(0, 2);
    const compLines = wrapText(item.componentCategory, 22).slice(0, 2);
    const rowLines = Math.max(descLines.length, compLines.length);
    const rowHeight = rowLines * 10 + 8;

    if (y - rowHeight < margin + 85) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawTableHeader();
    }

    if (i % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: lightBg,
      });
    }

    page.drawLine({
      start: { x: margin, y: y - rowHeight },
      end: { x: margin + contentWidth, y: y - rowHeight },
      thickness: 0.4,
      color: borderGray,
    });

    page.drawText(sanitizePdfText(item.accountCode), {
      x: colX[0] + 4,
      y: y - 12,
      size: 6.8,
      font: fontRegular,
      color: slate,
    });

    descLines.forEach((line, li) => {
      page.drawText(line, {
        x: colX[1] + 4,
        y: y - 11 - li * 10,
        size: 7,
        font: fontRegular,
        color: rgb(0.1, 0.14, 0.2),
      });
    });

    compLines.forEach((line, li) => {
      page.drawText(line, {
        x: colX[2] + 4,
        y: y - 11 - li * 10,
        size: 6.8,
        font: fontRegular,
        color: slate,
      });
    });

    const sourceShort = item.fundSource === "BOSP_KINERJA" ? "Kinerja" : "Reguler";
    page.drawText(sourceShort, {
      x: colX[3] + 4,
      y: y - 12,
      size: 7,
      font: fontRegular,
      color: item.fundSource === "BOSP_KINERJA" ? navy : emerald,
    });

    page.drawText(sanitizePdfText(formatRupiah(item.plannedAmount).replace("Rp", "").trim()), {
      x: colX[4] + 4,
      y: y - 12,
      size: 7,
      font: fontRegular,
      color: slate,
    });

    const pct = formatPercentage(item.realizedAmount, item.plannedAmount);
    page.drawText(
      sanitizePdfText(`${formatRupiah(item.realizedAmount).replace("Rp", "").trim()} (${pct}%)`),
      {
        x: colX[5] + 4,
        y: y - 12,
        size: 7,
        font: fontBold,
        color: rgb(0.08, 0.14, 0.22),
      }
    );

    y -= rowHeight;
  }

  // Signature block
  if (y < margin + 100) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  y -= 22;
  page.drawText("Mengetahui,", {
    x: margin + 20,
    y,
    size: 8.5,
    font: fontRegular,
    color: slate,
  });
  page.drawText("Disusun Oleh,", {
    x: margin + 350,
    y,
    size: 8.5,
    font: fontRegular,
    color: slate,
  });

  y -= 12;
  page.drawText("Kepala Sekolah", {
    x: margin + 20,
    y,
    size: 8.5,
    font: fontBold,
    color: navy,
  });
  page.drawText("Bendahara BOSP", {
    x: margin + 350,
    y,
    size: 8.5,
    font: fontBold,
    color: navy,
  });

  y -= 42;
  page.drawText(sanitizePdfText(school.headmaster), {
    x: margin + 20,
    y,
    size: 8.5,
    font: fontBold,
    color: navy,
  });
  page.drawText(sanitizePdfText(school.treasurer), {
    x: margin + 350,
    y,
    size: 8.5,
    font: fontBold,
    color: navy,
  });

  return pdfDoc.save();
}
