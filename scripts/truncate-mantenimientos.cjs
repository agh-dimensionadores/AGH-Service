const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const { PrismaClient } = require("../node_modules/@prisma/client-pg");
const db = new PrismaClient();

async function main() {
  const before = await db.clienteMantenimiento.count();
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      cubiscan_orden_fotos,
      cubiscan_ordenes_servicio,
      clientes_mantenimientos_fotos,
      clientes_mantenimientos
    RESTART IDENTITY CASCADE
  `);
  const after = await db.clienteMantenimiento.count();
  console.log(`OK: mantenimientos vaciada (${before} → ${after})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
