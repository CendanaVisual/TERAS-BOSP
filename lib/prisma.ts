import { Prisma, PrismaClient } from "@prisma/client";

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

export function detectDatabaseEnvSource(): {
  key: string | null;
  url: string | undefined;
} {
  for (const key of DATABASE_ENV_KEYS) {
    const raw = process.env[key];
    if (!raw || !raw.trim()) continue;

    // Handle accidental `psql 'postgresql://...'`, `DATABASE_URL=...`, or surrounding quotes
    let cleaned = raw.trim();
    const urlMatch = cleaned.match(/postgres(?:ql)?:\/\/[^\s'"]+/i);
    if (urlMatch) {
      cleaned = urlMatch[0];
    } else {
      cleaned = cleaned.replace(/^["']|["']$/g, "");
    }

    try {
      const parsed = new URL(cleaned);
      if (parsed.searchParams.has("channel_binding")) {
        parsed.searchParams.delete("channel_binding");
      }
      if (
        !parsed.searchParams.has("sslmode") &&
        parsed.hostname.includes("neon.tech")
      ) {
        parsed.searchParams.set("sslmode", "require");
      }
      return { key, url: parsed.toString() };
    } catch {
      return { key, url: cleaned };
    }
  }
  return { key: null, url: undefined };
}

export function getSanitizedDatabaseUrl(): string | undefined {
  return detectDatabaseEnvSource().url;
}

export function getPrismaClient(): PrismaClient {
  const url = getSanitizedDatabaseUrl();

  if (globalForPrisma.prisma && globalForPrisma.prismaUrl === url) {
    return globalForPrisma.prisma;
  }

  const client = new PrismaClient({
    ...(url
      ? {
          datasources: {
            db: { url },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prisma = client;
  globalForPrisma.prismaUrl = url;
  return client;
}

// Lazy proxy so runtime environment variables are always read at request time
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function getDatabaseErrorMessage(
  error: unknown,
  actionLabel: string
): { status: number; message: string; code: string } {
  if (!getSanitizedDatabaseUrl()) {
    return {
      status: 503,
      code: "MISSING_DATABASE_URL",
      message:
        "Koneksi database belum terpasang di server. Tambahkan Environment Variable DATABASE_URL (Neon PostgreSQL) pada dashboard Vercel lalu Redeploy.",
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return {
        status: 503,
        code: error.code,
        message:
          "Struktur tabel database belum tersinkronisasi. Jalankan perintah 'npx prisma db push' pada database Neon.",
      };
    }
    return {
      status: 500,
      code: error.code,
      message: `Gagal ${actionLabel} (kode database: ${error.code}).`,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      code: error.errorCode || "DB_INIT_ERROR",
      message:
        "Server tidak dapat terhubung ke database Neon PostgreSQL. Periksa nilai DATABASE_URL pada Vercel Environment Variables atau cek /api/health.",
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: `Terjadi kendala saat ${actionLabel}. Silakan coba kembali atau periksa status koneksi di /api/health.`,
  };
}
