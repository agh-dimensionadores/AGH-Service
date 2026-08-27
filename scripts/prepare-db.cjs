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
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function ensureTables() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agh_usuarios (
      id VARCHAR(40) PRIMARY KEY,
      email VARCHAR(200) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      nombre VARCHAR(150) NOT NULL,
      rol VARCHAR(20) NOT NULL,
      cliente_id INTEGER,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS agh_usuarios_cliente_id_idx
    ON agh_usuarios (cliente_id)
  `);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS agh_soporte`);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) NOT NULL DEFAULT 'venta'
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS maquinas_alquileres (
      id SERIAL PRIMARY KEY,
      id_cliente_maquina INTEGER NOT NULL REFERENCES clientes_maquinas(id) ON DELETE CASCADE,
      id_cliente INTEGER NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      comentario TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS maquinas_alquileres_unidad_idx
      ON maquinas_alquileres (id_cliente_maquina)
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS maquinas_alquileres_cliente_idx
      ON maquinas_alquileres (id_cliente)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE maquinas
      ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cubiscan_ordenes_servicio (
      id SERIAL PRIMARY KEY,
      id_mantenimiento INTEGER NOT NULL UNIQUE
        REFERENCES clientes_mantenimientos(id) ON DELETE CASCADE,
      payload JSONB NOT NULL,
      firma_ingeniero TEXT,
      firma_cliente TEXT,
      email_destino VARCHAR(200),
      email_enviado_en TIMESTAMPTZ,
      email_error TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function seedIfNeeded() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.usuario.upsert({
    where: { email: "micaela@agh.com" },
    update: {},
    create: {
      email: "micaela@agh.com",
      nombre: "Micaela",
      rol: "admin",
      passwordHash,
    },
  });

  const cliente = await db.cliente.findFirst({ orderBy: { id: "asc" } });
  if (!cliente) return;

  const email = "cliente@mercadolibre.com";
  const existente = await db.usuario.findUnique({ where: { email } });
  if (!existente) {
    await db.usuario.create({
      data: {
        email,
        nombre: "Portal Cliente",
        rol: "cliente",
        clienteId: cliente.id,
        passwordHash: await bcrypt.hash("cliente123", 10),
      },
    });
  }
}

async function main() {
  await ensureTables();
  await seedIfNeeded();
  console.log("OK: tablas y usuario admin listos (micaela@agh.com / admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
