import { PrismaClient } from "../node_modules/@prisma/client-pg";

const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`
    ALTER TABLE maquinas
      ADD COLUMN IF NOT EXISTS imagen_updated_at TIMESTAMPTZ
  `);
  const n = await p.$executeRawUnsafe(`
    UPDATE maquinas
    SET imagen_updated_at = NOW()
    WHERE imagen IS NOT NULL AND imagen_updated_at IS NULL
  `);
  console.log("OK: imagen_updated_at, backfill=", n);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
