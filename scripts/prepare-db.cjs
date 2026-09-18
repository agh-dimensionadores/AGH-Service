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
  await db.$executeRawUnsafe(`
    ALTER TABLE agh_usuarios
      ADD COLUMN IF NOT EXISTS genero VARCHAR(1)
  `);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS agh_soporte`);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) NOT NULL DEFAULT 'venta'
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS anydesk VARCHAR(50)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS serie_compu VARCHAR(100),
      ADD COLUMN IF NOT EXISTS serie_camara VARCHAR(100),
      ADD COLUMN IF NOT EXISTS serie_ecoflow VARCHAR(100),
      ADD COLUMN IF NOT EXISTS serie_pistola VARCHAR(100)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS direccion VARCHAR(300)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS liberada_en TIMESTAMPTZ
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS orden_compra VARCHAR(100)
  `);
  // Serie única solo en asignaciones activas (liberadas conservan historial)
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      DROP CONSTRAINT IF EXISTS clientes_maquinas_numero_serie_key
  `);
  await db.$executeRawUnsafe(`
    DROP INDEX IF EXISTS clientes_maquinas_numero_serie_key
  `);
  await db.$executeRawUnsafe(`
    DROP INDEX IF EXISTS clientes_maquinas_numero_serie_activa_key
  `);
  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX clientes_maquinas_numero_serie_activa_key
      ON clientes_maquinas (numero_serie)
      WHERE liberada_en IS NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes
      ADD COLUMN IF NOT EXISTS cuit VARCHAR(20),
      ADD COLUMN IF NOT EXISTS direccion VARCHAR(300)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_mantenimientos
      ALTER COLUMN id_cliente_maquina DROP NOT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE clientes_mantenimientos
      ADD COLUMN IF NOT EXISTS empresa_temp VARCHAR(200)
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
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cubiscan_orden_fotos (
      id SERIAL PRIMARY KEY,
      id_orden INTEGER NOT NULL
        REFERENCES cubiscan_ordenes_servicio(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime VARCHAR(50) NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS cubiscan_orden_fotos_orden_idx
      ON cubiscan_orden_fotos (id_orden)
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS clientes_maquinas_fotos (
      id SERIAL PRIMARY KEY,
      id_cliente_maquina INTEGER NOT NULL
        REFERENCES clientes_maquinas(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime VARCHAR(50) NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS clientes_maquinas_fotos_unidad_idx
      ON clientes_maquinas_fotos (id_cliente_maquina)
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS clientes_mantenimientos_fotos (
      id SERIAL PRIMARY KEY,
      id_mantenimiento INTEGER NOT NULL
        REFERENCES clientes_mantenimientos(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime VARCHAR(50) NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS clientes_mantenimientos_fotos_mant_idx
      ON clientes_mantenimientos_fotos (id_mantenimiento)
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS maquinas_stock (
      id SERIAL PRIMARY KEY,
      id_maquina INTEGER NOT NULL REFERENCES maquinas(idmachine),
      numero_serie VARCHAR(100) NOT NULL UNIQUE,
      fecha_importacion DATE,
      despacho_importacion VARCHAR(100),
      po VARCHAR(100),
      origen VARCHAR(150),
      valor_fo NUMERIC(14, 2),
      fecha_fabricacion DATE,
      precio NUMERIC(14, 2),
      estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
      id_cliente_maquina INTEGER UNIQUE
        REFERENCES clientes_maquinas(id) ON DELETE SET NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE maquinas_stock
      ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100)
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE maquinas_stock
      ADD COLUMN IF NOT EXISTS fecha_fabricacion DATE,
      ADD COLUMN IF NOT EXISTS precio NUMERIC(14, 2)
  `);
  // Limpiar vacíos y forzar unicidad (el nro. de serie identifica la unidad)
  await db.$executeRawUnsafe(`
    UPDATE maquinas_stock
    SET numero_serie = 'STOCK-' || id::text
    WHERE numero_serie IS NULL OR TRIM(numero_serie) = ''
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE maquinas_stock
      ALTER COLUMN numero_serie SET NOT NULL
  `);
  // Import fields opcionales (AGH no los usa)
  await db.$executeRawUnsafe(`
    ALTER TABLE maquinas_stock
      ALTER COLUMN fecha_importacion DROP NOT NULL,
      ALTER COLUMN despacho_importacion DROP NOT NULL,
      ALTER COLUMN po DROP NOT NULL,
      ALTER COLUMN origen DROP NOT NULL,
      ALTER COLUMN valor_fo DROP NOT NULL
  `);
  await db.$executeRawUnsafe(`
    DROP INDEX IF EXISTS maquinas_stock_numero_serie_key
  `);
  await db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX maquinas_stock_numero_serie_key
      ON maquinas_stock (numero_serie)
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS maquinas_stock_maquina_idx
      ON maquinas_stock (id_maquina)
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS maquinas_stock_estado_idx
      ON maquinas_stock (estado)
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

  await db.$executeRawUnsafe(`
    UPDATE agh_usuarios SET genero = 'f' WHERE email = 'micaela@agh.com'
  `);
  await db.$executeRawUnsafe(`
    UPDATE agh_usuarios
    SET genero = 'm'
    WHERE genero IS NULL AND lower(nombre) LIKE '%ariel%'
  `);

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
