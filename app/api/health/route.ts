import { NextResponse } from "next/server";
import { getSanitizedDatabaseUrl, prisma } from "@/lib/prisma";

export async function GET() {
  const envStatus = {
    hasDatabaseUrl: Boolean(getSanitizedDatabaseUrl()),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    hasAiApiKey: Boolean(
      process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    ),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };

  if (!envStatus.hasDatabaseUrl) {
    return NextResponse.json(
      {
        status: "error",
        database: "missing_env",
        message: "DATABASE_URL belum diatur pada environment server.",
        env: envStatus,
      },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
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
        detail: errorMessage.slice(0, 200),
        env: envStatus,
      },
      { status: 500 }
    );
  }
}
