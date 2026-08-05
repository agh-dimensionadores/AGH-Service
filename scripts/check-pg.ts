import { PrismaClient } from "../node_modules/@prisma/client-pg";

const p = new PrismaClient();

async function main() {
  const [m, cm, mant, c, cloudUsers] = await Promise.all([
    p.maquina.count(),
    p.clienteMaquina.count(),
    p.clienteMantenimiento.count(),
    p.cliente.count(),
    p.cloudUser.count(),
  ]);
  console.log({
    clientes: c,
    maquinas: m,
    clientes_maquinas: cm,
    mantenimientos: mant,
    cloud_users: cloudUsers,
  });
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
