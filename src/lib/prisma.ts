import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: addSqlitePragmas(process.env.DATABASE_URL),
  });

globalForPrisma.prisma = prisma;

/**
 * Adds WAL mode and busy_timeout to SQLite connection URLs.
 * WAL allows concurrent reads during writes and busy_timeout
 * prevents "database is locked" errors on VPS under load.
 */
function addSqlitePragmas(url: string | undefined): string | undefined {
  if (!url || !url.startsWith("file:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}journal_mode=WAL&busy_timeout=5000`;
}
