import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getSanitizedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
  if (!raw) return undefined;

  try {
    const parsed = new URL(raw);
    // Neon includes channel_binding=require by default, which can fail on some serverless TLS runtimes
    if (parsed.searchParams.has("channel_binding")) {
      parsed.searchParams.delete("channel_binding");
    }
    if (!parsed.searchParams.has("sslmode") && parsed.hostname.includes("neon.tech")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

const sanitizedUrl = getSanitizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(sanitizedUrl
      ? {
          datasources: {
            db: { url: sanitizedUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
