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
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS clientes_maquinas_remitos (
      id SERIAL PRIMARY KEY,
      id_cliente_maquina INTEGER NOT NULL
        REFERENCES clientes_maquinas(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime VARCHAR(50) NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const rows = await db.$queryRaw`
    SELECT
      cm.id,
      cm.numero_serie,
      cm.sitio,
      c.empresa,
      c.nombre,
      m.marca,
      m.modelo,
      (
        SELECT COUNT(*)::int
        FROM clientes_maquinas_remitos r
        WHERE r.id_cliente_maquina = cm.id
      ) AS remitos
    FROM clientes_maquinas cm
    JOIN clientes c ON c.id = cm.id_cliente
    JOIN maquinas m ON m.idmachine = cm.id_maquina
    WHERE cm.liberada_en IS NULL
    ORDER BY c.empresa NULLS LAST, c.nombre, cm.id
  `;

  const sin = rows.filter((r) => Number(r.remitos) === 0);
  const con = rows.filter((r) => Number(r.remitos) > 0);

  console.log(`Asignadas: ${rows.length}`);
  console.log(`Con foto de remito: ${con.length}`);
  console.log(`Sin foto de remito: ${sin.length}`);
  console.log("");
  for (const r of sin) {
    const cliente = r.empresa || r.nombre || "—";
    const equipo = [r.marca, r.modelo].filter(Boolean).join(" ");
    const sitio = r.sitio ? ` · ${r.sitio}` : "";
    console.log(
      `#${r.id}  ${equipo}  ·  serie ${r.numero_serie}  ·  ${cliente}${sitio}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
