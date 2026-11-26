import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { extractBospWithAI } from "@/lib/ai-extractor";
import { parseFinancialDocument } from "@/lib/file-parser";
import { storeOfficialDocument } from "@/lib/storage";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".pdf"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File laporan (.xlsx, .xls, atau .pdf) wajib diunggah." },
        { status: 400 }
      );
    }

    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );
    if (!hasAllowedExtension) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Unggah file Excel (.xlsx/.xls) atau PDF (.pdf).",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 15 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedDoc = await parseFinancialDocument(
      buffer,
      file.name,
      file.type
    );

    const [extracted, stored] = await Promise.all([
      extractBospWithAI(parsedDoc),
      storeOfficialDocument(buffer, file.name, file.type),
    ]);

    return NextResponse.json({
      extracted,
      document: {
        url: stored.url,
        name: stored.fileName,
        mimeType: stored.mimeType,
        storageProvider: stored.storageProvider,
        storageWarning: stored.warning,
      },
      meta: {
        fileKind: parsedDoc.fileKind,
        pageCount: parsedDoc.pageCount ?? null,
        rowCount: parsedDoc.sheetRows.length,
      },
    });
  } catch (error) {
    console.error("AI extract endpoint error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengekstrak dokumen keuangan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
