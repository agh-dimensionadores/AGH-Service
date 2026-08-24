import { PrismaClient } from "@prisma/client-pg";

/** Subir esto si regenerás el client PG y el hot-reload reusa una instancia vieja. */
const PG_CLIENT_VERSION = "agh-usuarios-v2";

const globalForPrisma = globalThis as unknown as {
  prismaPg?: PrismaClient;
  prismaPgVersion?: string;
};

function createPrismaPg() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * PostgreSQL. Reusa una sola instancia en hot-reload
 * para no abrir conexiones nuevas en cada request.
 */
export const prismaPg =
  globalForPrisma.prismaPg &&
  globalForPrisma.prismaPgVersion === PG_CLIENT_VERSION
    ? globalForPrisma.prismaPg
    : createPrismaPg();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaPg = prismaPg;
  globalForPrisma.prismaPgVersion = PG_CLIENT_VERSION;
}
