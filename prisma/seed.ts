import { PrismaClient } from "../node_modules/@prisma/client-pg";
import bcrypt from "bcryptjs";
import { ensureAghTables } from "../scripts/ensure-agh-tables";

const prismaPg = new PrismaClient();

async function main() {
  await ensureAghTables(prismaPg);

  const cliente = await prismaPg.cliente.findFirst({ orderBy: { id: "asc" } });
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prismaPg.usuario.upsert({
    where: { email: "micaela@agh.com" },
    update: {},
    create: {
      email: "micaela@agh.com",
      nombre: "Micaela",
      rol: "admin",
      passwordHash,
    },
  });

  let clienteDemo: string | null = null;
  if (cliente) {
    const email = "cliente@mercadolibre.com";
    const existente = await prismaPg.usuario.findUnique({ where: { email } });
    if (!existente) {
      await prismaPg.usuario.create({
        data: {
          email,
          nombre: "Portal Cliente",
          rol: "cliente",
          clienteId: cliente.id,
          passwordHash: await bcrypt.hash("cliente123", 10),
        },
      });
    }
    clienteDemo = `${email} / cliente123`;
  }

  console.log("Seed listo (clientes / Voxel no se modifican):", {
    clientePortal: cliente
      ? { id: cliente.id, nombre: cliente.nombre }
      : "ninguno — creá un cliente en la app",
    admin: "micaela@agh.com / admin123",
    clienteDemo,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaPg.$disconnect();
  });
