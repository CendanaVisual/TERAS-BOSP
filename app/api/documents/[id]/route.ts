import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { generateBospOfficialPdf } from "@/lib/pdf-generator";
import { prisma } from "@/lib/prisma";
import { fetchStoredRemoteDocument } from "@/lib/storage";
import { toNumber } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const download = request.nextUrl.searchParams.get("download") === "1";
    const forcePdf = request.nextUrl.searchParams.get("pdf") === "1";

    const period = await prisma.budgetPeriod.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
        },
      },
    });

    if (!period) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    if (period.status !== "PUBLISHED") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Dokumen belum dipublikasikan." }, { status: 403 });
      }
    }

    const fallbackFilename = `Laporan_BOSP_${period.fiscalYear}_${period.stage}.pdf`;
    const fileName = period.documentName || fallbackFilename;
    const disposition = download
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`;

    // 1. If documentUrl is stored directly in Neon PostgreSQL (db://<id>)
    if (!forcePdf && period.documentUrl && period.documentUrl.startsWith("db://")) {
      const docId = period.documentUrl.slice("db://".length).trim();
      const storedDoc = await prisma.storedDocument.findUnique({
        where: { id: docId },
      });
      if (storedDoc) {
        return new NextResponse(Buffer.from(storedDoc.data), {
          status: 200,
          headers: {
            "Content-Type":
              period.documentMimeType || storedDoc.mimeType || "application/pdf",
            "Content-Disposition": disposition,
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    }

    // 2. If documentUrl points to remote Vercel Blob (public OR private) / HTTPS URL, stream it
    if (!forcePdf && period.documentUrl && /^https?:\/\//i.test(period.documentUrl)) {
      const remoteDoc = await fetchStoredRemoteDocument(period.documentUrl);
      if (remoteDoc) {
        const contentType =
          period.documentMimeType ||
          remoteDoc.contentType ||
          "application/pdf";
        return new NextResponse(remoteDoc.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": disposition,
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    }

    // 2. If documentUrl points to local public file (/samples/... or /uploads/...)
    if (!forcePdf && period.documentUrl && period.documentUrl.startsWith("/")) {
      const relative = period.documentUrl.replace(/^\/+/, "");
      const localPath = path.join(process.cwd(), "public", relative);
      try {
        const fileBuffer = await fs.readFile(localPath);
        const isExcel =
          localPath.endsWith(".xlsx") || localPath.endsWith(".xls");
        const contentType =
          period.documentMimeType ||
          (isExcel
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf");
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": disposition,
            "Cache-Control": "public, max-age=300",
          },
        });
      } catch {
        // Fall through to generated PDF if local static/upload file is absent
      }
    }

    // 3. Fallback: generate authentic official BOSP PDF on the fly
    const school = await prisma.schoolProfile.findFirst();
    const pdfBytes = await generateBospOfficialPdf(
      {
        name: school?.name || "Sekolah Dasar Negeri",
        npsn: school?.npsn || "-",
        address: school?.address || "-",
        headmaster: school?.headmaster || "-",
        treasurer: school?.treasurer || "-",
        district: school?.district || "",
        province: school?.province || "",
      },
      {
        id: period.id,
        fiscalYear: period.fiscalYear,
        stage: period.stage,
        openingBalance: toNumber(period.openingBalance),
        totalReceived: toNumber(period.totalReceived),
        regularReceived: toNumber(period.regularReceived),
        performanceReceived: toNumber(period.performanceReceived),
        totalSpent: toNumber(period.totalSpent),
        endingBalance: toNumber(period.endingBalance),
        status: period.status,
        publishedAt: period.publishedAt,
        expenses: period.expenses.map((e) => ({
          componentCategory: e.componentCategory,
          accountCode: e.accountCode,
          description: e.description,
          fundSource: e.fundSource,
          plannedAmount: toNumber(e.plannedAmount),
          realizedAmount: toNumber(e.realizedAmount),
        })),
      }
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition.replace(/\.(xlsx|xls)"$/i, '.pdf"'),
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (error) {
    console.error("Error serving document:", error);
    return NextResponse.json(
      { error: "Gagal mengambil dokumen laporan." },
      { status: 500 }
    );
  }
}
