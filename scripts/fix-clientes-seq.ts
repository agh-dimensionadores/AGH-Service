import { PrismaClient } from "../node_modules/@prisma/client-pg";

const prisma = new PrismaClient();

async function main() {
  const maxRows = await prisma.$queryRawUnsafe<{ max: number | null }[]>(
    `SELECT MAX(id) AS max FROM clientes`
  );
  console.log("MAX(id) actual:", maxRows[0]?.max);

  const result = await prisma.$queryRawUnsafe<{ next: number }[]>(
    `SELECT setval(
      pg_get_serial_sequence('clientes', 'id'),
      COALESCE((SELECT MAX(id) FROM clientes), 1)
    ) AS next`
  );
  console.log("Secuencia sincronizada. Próximo valor base:", result[0]?.next);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
