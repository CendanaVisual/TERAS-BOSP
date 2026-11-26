import * as XLSX from "xlsx";
import { extractText } from "unpdf";

export interface ParsedSpreadsheetRow {
  sheetName: string;
  rowIndex: number;
  cells: string[];
}

export interface ParsedDocumentContent {
  fileKind: "excel" | "pdf";
  fileName: string;
  mimeType: string;
  extractedText: string;
  sheetRows: ParsedSpreadsheetRow[];
  pageCount?: number;
  rawBase64?: string;
}

const MAX_TEXT_LENGTH = 100_000;

export async function parseFinancialDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedDocumentContent> {
  const lower = fileName.toLowerCase();
  const isPdf =
    lower.endsWith(".pdf") || mimeType.toLowerCase().includes("pdf");

  if (isPdf) {
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const text = (result.text || "").trim().slice(0, MAX_TEXT_LENGTH);
    return {
      fileKind: "pdf",
      fileName,
      mimeType: mimeType || "application/pdf",
      extractedText: text,
      sheetRows: [],
      pageCount: result.totalPages,
      rawBase64: buffer.toString("base64"),
    };
  }

  // Excel (.xlsx, .xls, .csv)
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetRows: ParsedSpreadsheetRow[] = [];
  const textSections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    const nonEmptyRows = matrix
      .map((row, idx) => ({
        rowIndex: idx + 1,
        cells: Array.isArray(row)
          ? row.map((cell) => String(cell ?? "").trim())
          : [],
      }))
      .filter((r) => r.cells.some((c) => c.length > 0));

    if (nonEmptyRows.length === 0) continue;

    textSections.push(`=== SHEET: ${sheetName} ===`);
    for (const row of nonEmptyRows) {
      sheetRows.push({
        sheetName,
        rowIndex: row.rowIndex,
        cells: row.cells,
      });
      textSections.push(row.cells.join(" | "));
    }
  }

  const extractedText = textSections.join("\n").slice(0, MAX_TEXT_LENGTH);

  return {
    fileKind: "excel",
    fileName,
    mimeType:
      mimeType ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extractedText,
    sheetRows,
  };
}
