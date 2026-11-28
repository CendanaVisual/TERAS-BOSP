import { del, get, put } from "@vercel/blob";
import { prisma } from "./prisma";

export interface StoredDocumentResult {
  url: string;
  fileName: string;
  mimeType: string;
  storageProvider:
    | "vercel-blob-public"
    | "vercel-blob-private"
    | "neon-db"
    | "none";
  warning?: string;
}

const MAX_DB_DOCUMENT_BYTES = 4 * 1024 * 1024; // 4 MB safe limit for Neon BYTEA

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

/**
 * Stores an official BOSP document (PDF / Excel).
 * 1. If BLOB_READ_WRITE_TOKEN is configured:
 *    - Tries public access first; if store is configured as private, automatically retries with private access.
 *    - Public portal previews/downloads work seamlessly via `/api/documents/[id]` proxy for BOTH public & private stores.
 * 2. If Vercel Blob is not configured or fails, falls back gracefully to Neon PostgreSQL (`StoredDocument` table).
 */
export async function storeOfficialDocument(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredDocumentResult> {
  const safeName = sanitizeFileName(originalName || "dokumen-bosp.pdf");
  const resolvedMime = mimeType || "application/octet-stream";
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const uniqueName = `${Date.now()}-${safeName}`;
    const pathname = `bosp-documents/${uniqueName}`;

    try {
      const blob = await put(pathname, buffer, {
        access: "public",
        contentType: resolvedMime,
        token,
      });
      return {
        url: blob.url,
        fileName: originalName || safeName,
        mimeType: resolvedMime,
        storageProvider: "vercel-blob-public",
      };
    } catch (publicErr) {
      const msg = publicErr instanceof Error ? publicErr.message : String(publicErr);
      const isPrivateStoreError =
        msg.toLowerCase().includes("private") ||
        msg.toLowerCase().includes("cannot use public access");

      if (isPrivateStoreError) {
        try {
          const privateBlob = await put(pathname, buffer, {
            access: "private",
            contentType: resolvedMime,
            token,
          });
          return {
            url: privateBlob.url,
            fileName: originalName || safeName,
            mimeType: resolvedMime,
            storageProvider: "vercel-blob-private",
          };
        } catch (privateErr) {
          console.error("Vercel Blob private upload failed:", privateErr);
        }
      } else {
        console.error("Vercel Blob public upload failed:", publicErr);
      }
    }
  }

  // Fallback: store directly in Neon PostgreSQL
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
        ? "Ukuran file melebihi 4 MB untuk penyimpanan database cadangan. Laporan angka tetap tersimpan dan rekap PDF otomatis tetap tersedia untuk publik."
        : "Lampiran asli belum dapat disimpan; laporan angka tetap tersimpan dan rekap PDF resmi otomatis tetap tersedia untuk publik.",
  };
}

/**
 * Reads a remote Vercel Blob (supports BOTH public and private stores) or HTTPS document.
 */
export async function fetchStoredRemoteDocument(url: string): Promise<{
  body: ReadableStream<Uint8Array> | ArrayBuffer;
  contentType: string | null;
} | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const isVercelBlobUrl = /\.blob\.vercel-storage\.com/i.test(url);
  const isPrivateBlobUrl = /\.private\.blob\.vercel-storage\.com/i.test(url);

  if (isVercelBlobUrl && token) {
    // Try matching store access mode first, then alternate mode
    const accessModes: Array<"private" | "public"> = isPrivateBlobUrl
      ? ["private", "public"]
      : ["public", "private"];

    for (const access of accessModes) {
      try {
        const result = await get(url, { access, token });
        if (result && result.statusCode === 200 && result.stream) {
          return {
            body: result.stream,
            contentType: result.blob.contentType || null,
          };
        }
      } catch {
        // Try alternate mode
      }
    }
  }

  // Plain fetch fallback for public URLs
  try {
    const upstream = await fetch(url);
    if (upstream.ok) {
      return {
        body: await upstream.arrayBuffer(),
        contentType: upstream.headers.get("content-type"),
      };
    }
  } catch (err) {
    console.error("Failed to fetch remote document:", err);
  }

  return null;
}

export async function deleteStoredDbDocumentIfAny(
  documentUrl: string | null | undefined
): Promise<void> {
  if (!documentUrl) return;

  if (documentUrl.startsWith("db://")) {
    const docId = documentUrl.slice("db://".length).trim();
    if (!docId) return;
    try {
      await prisma.storedDocument.delete({ where: { id: docId } });
    } catch {
      // Ignore if already deleted
    }
    return;
  }

  if (
    /\.blob\.vercel-storage\.com/i.test(documentUrl) &&
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    try {
      await del(documentUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Ignore if blob already removed
    }
  }
}
