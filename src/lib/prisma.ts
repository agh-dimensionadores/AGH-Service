import { PrismaClient as SqliteClient } from "@prisma/client-sqlite";
import { PrismaClient as PgClient } from "@prisma/client-pg";

/** Subir esto si regenerás el client PG y el hot-reload reusa una instancia vieja. */
const PG_CLIENT_VERSION = "agenda-programado-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: SqliteClient;
  prismaPg?: PgClient;
  prismaPgVersion?: string;
};

/** Auth / soporte (local, rápido) */
export const prisma =
  globalForPrisma.prisma ??
  new SqliteClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

function createPrismaPg() {
  return new PgClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * PostgreSQL remoto (Render). Reusa una sola instancia en hot-reload
 * para no abrir conexiones nuevas en cada request.
 */
export const prismaPg =
  globalForPrisma.prismaPg &&
  globalForPrisma.prismaPgVersion === PG_CLIENT_VERSION
    ? globalForPrisma.prismaPg
    : createPrismaPg();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPg = prismaPg;
  globalForPrisma.prismaPgVersion = PG_CLIENT_VERSION;
}
