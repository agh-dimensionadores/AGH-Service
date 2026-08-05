import { PrismaClient as SqliteClient } from "@prisma/client-sqlite";
import { PrismaClient as PgClient } from "@prisma/client-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: SqliteClient;
  prismaPg?: PgClient;
};

/** Auth / soporte (local, rápido) */
export const prisma =
  globalForPrisma.prisma ??
  new SqliteClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

/**
 * PostgreSQL remoto (Render). Reusa una sola instancia en hot-reload
 * para no abrir conexiones nuevas en cada request.
 */
export const prismaPg =
  globalForPrisma.prismaPg ??
  new PgClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPg = prismaPg;
}
