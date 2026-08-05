import { PrismaClient } from "../node_modules/@prisma/client-sqlite";
import { PrismaClient as PgClient } from "../node_modules/@prisma/client-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const prismaPg = new PgClient();

async function main() {
  await prisma.soporte.deleteMany();
  await prisma.usuario.deleteMany();

  const cliente = await prismaPg.cliente.findFirst({ orderBy: { id: "asc" } });

  await prisma.usuario.create({
    data: {
      email: "micaela@agh.com",
      nombre: "Micaela",
      rol: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
    },
  });

  if (cliente) {
    await prisma.usuario.create({
      data: {
        email: "cliente@mercadolibre.com",
        nombre: "Portal Cliente",
        rol: "cliente",
        clienteId: cliente.id,
        passwordHash: await bcrypt.hash("cliente123", 10),
      },
    });
  }

  console.log("Seed listo (PostgreSQL no se modifica):", {
    clientePortal: cliente
      ? { id: cliente.id, nombre: cliente.nombre }
      : "ninguno — creá un cliente en la app",
    admin: "micaela@agh.com / admin123",
    clienteDemo: cliente ? "cliente@mercadolibre.com / cliente123" : null,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await prismaPg.$disconnect();
  });
