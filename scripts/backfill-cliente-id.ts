import { PrismaClient } from "../node_modules/@prisma/client-pg";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.cliente.findMany();
  for (const c of rows) {
    if (c.clienteId !== c.id) {
      await prisma.cliente.update({
        where: { id: c.id },
        data: { clienteId: c.id },
      });
      console.log(`cliente_id actualizado: id=${c.id}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
