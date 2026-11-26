import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

export interface StoredDocumentResult {
  url: string;
  fileName: string;
  mimeType: string;
  storageProvider: "vercel-blob" | "local" | "none";
  warning?: string;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

/**
 * Uploads an official BOSP document (PDF / Excel).
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured; falls back to /public/uploads in local dev.
 */
export async function storeOfficialDocument(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredDocumentResult> {
  const safeName = sanitizeFileName(originalName || "dokumen-bosp.pdf");
  const uniqueName = `${Date.now()}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`bosp-documents/${uniqueName}`, buffer, {
      access: "public",
      contentType: mimeType || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      fileName: originalName,
      mimeType,
      storageProvider: "vercel-blob",
    };
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, uniqueName), buffer);
    return {
      url: `/uploads/${uniqueName}`,
      fileName: originalName,
      mimeType,
      storageProvider: "local",
    };
  } catch {
    return {
      url: "",
      fileName: originalName,
      mimeType,
      storageProvider: "none",
      warning:
        "BLOB_READ_WRITE_TOKEN belum dikonfigurasi dan penyimpanan lokal bersifat read-only. Laporan tetap disimpan dan PDF rekap otomatis tetap tersedia untuk publik.",
    };
  }
}
