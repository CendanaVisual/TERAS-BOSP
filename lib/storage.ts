import { put } from "@vercel/blob";
import { prisma } from "./prisma";

export interface StoredDocumentResult {
  url: string;
  fileName: string;
  mimeType: string;
  storageProvider: "vercel-blob" | "neon-db" | "none";
  warning?: string;
}

const MAX_DB_DOCUMENT_BYTES = 4 * 1024 * 1024; // 4 MB safe limit for Neon BYTEA & Vercel request limit

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

/**
 * Stores an official BOSP document (PDF / Excel).
 * 1. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured.
 * 2. Otherwise stores directly in Neon PostgreSQL (`StoredDocument` table),
 *    so uploads work seamlessly on Vercel without requiring BLOB_READ_WRITE_TOKEN.
 */
export async function storeOfficialDocument(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredDocumentResult> {
  const safeName = sanitizeFileName(originalName || "dokumen-bosp.pdf");
  const resolvedMime = mimeType || "application/octet-stream";

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const uniqueName = `${Date.now()}-${safeName}`;
    const blob = await put(`bosp-documents/${uniqueName}`, buffer, {
      access: "public",
      contentType: resolvedMime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      fileName: originalName || safeName,
      mimeType: resolvedMime,
      storageProvider: "vercel-blob",
    };
  }

  if (buffer.length <= MAX_DB_DOCUMENT_BYTES) {
    try {
      const saved = await prisma.storedDocument.create({
        data: {
          fileName: originalName || safeName,
          mimeType: resolvedMime,
          sizeBytes: buffer.length,
          data: new Uint8Array(buffer),
        },
        select: { id: true },
      });

      return {
        url: `db://${saved.id}`,
        fileName: originalName || safeName,
        mimeType: resolvedMime,
        storageProvider: "neon-db",
      };
    } catch (err) {
      console.error("Failed to save document in Neon DB:", err);
    }
  }

  return {
    url: "",
    fileName: originalName || safeName,
    mimeType: resolvedMime,
    storageProvider: "none",
    warning:
      buffer.length > MAX_DB_DOCUMENT_BYTES
        ? "Ukuran file melebihi 4 MB untuk penyimpanan database langsung. Aktifkan Vercel Blob untuk file besar, atau gunakan rekap PDF otomatis yang tetap tersedia untuk publik."
        : "Lampiran asli belum dapat disimpan; laporan angka tetap tersimpan dan rekap PDF resmi otomatis tetap tersedia untuk publik.",
  };
}

export async function deleteStoredDbDocumentIfAny(
  documentUrl: string | null | undefined
): Promise<void> {
  if (!documentUrl || !documentUrl.startsWith("db://")) return;
  const docId = documentUrl.slice("db://".length).trim();
  if (!docId) return;
  try {
    await prisma.storedDocument.delete({ where: { id: docId } });
  } catch {
    // Ignore if already deleted
  }
}
