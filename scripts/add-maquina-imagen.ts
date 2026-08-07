import { PrismaClient } from "../node_modules/@prisma/client-pg";

const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`
    ALTER TABLE maquinas
      ADD COLUMN IF NOT EXISTS imagen BYTEA,
      ADD COLUMN IF NOT EXISTS imagen_mime VARCHAR(50)
  `);

  const cols = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'maquinas'
    ORDER BY ordinal_position
  `);
  console.table(cols);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
