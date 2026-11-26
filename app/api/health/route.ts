import { NextResponse } from "next/server";
import {
  detectDatabaseEnvSource,
  listDbRelatedEnvKeyNames,
  prisma,
} from "@/lib/prisma";

export async function GET() {
  const dbSource = detectDatabaseEnvSource();
  const detectedDbRelatedKeys = listDbRelatedEnvKeyNames();
  const envStatus = {
    hasDatabaseUrl: Boolean(dbSource.url),
    databaseEnvKey: dbSource.key,
    detectedDbRelatedKeys,
    hasAuthSecret: Boolean(
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    ),
    hasAiApiKey: Boolean(
      process.env.AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY
    ),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };

  if (!dbSource.url) {
    return NextResponse.json(
      {
        status: "error",
        database: "missing_env",
        message:
          "Variabel koneksi PostgreSQL (DATABASE_URL / POSTGRES_URL) belum terbaca pada deployment ini. Pastikan sudah dicentang untuk Production di Vercel lalu lakukan Redeploy.",
        env: envStatus,
      },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const [adminUsers, budgetPeriods, publicFeedbacks] = await Promise.all([
      prisma.user.count(),
      prisma.budgetPeriod.count(),
      prisma.publicFeedback.count(),
    ]);
    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: {
        adminUsers,
        budgetPeriods,
        publicFeedbacks,
      },
      env: envStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: "Gagal terhubung ke database PostgreSQL Neon.",
        detail: errorMessage.slice(0, 220),
        env: envStatus,
      },
      { status: 500 }
    );
  }
}
