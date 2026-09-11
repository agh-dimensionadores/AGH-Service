/**
 * Renumera un cliente al id que corresponde (ej. 11 → 5) y sincroniza la secuencia.
 * Uso: npx tsx scripts/renumber-cliente.ts 11 5
 */
import { PrismaClient } from "../node_modules/@prisma/client-pg";

const prisma = new PrismaClient();

async function tableExists(name: string) {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    name
  );
  return Boolean(rows[0]?.exists);
}

async function main() {
  const fromId = Number(process.argv[2]);
  const toId = Number(process.argv[3]);
  if (!Number.isInteger(fromId) || !Number.isInteger(toId) || fromId === toId) {
    throw new Error("Uso: npx tsx scripts/renumber-cliente.ts <id_actual> <id_nuevo>");
  }

  const source = await prisma.cliente.findUnique({ where: { id: fromId } });
  if (!source) throw new Error(`No existe cliente con id ${fromId}`);

  const taken = await prisma.cliente.findUnique({ where: { id: toId } });
  if (taken) throw new Error(`El id ${toId} ya está en uso (${taken.nombre})`);

  console.log(`Renumerando "${source.nombre}" (${fromId} → ${toId})…`);

  await prisma.$transaction(
    async (tx) => {
    const token = source.token;
    const pendingToken = `renumber_pending_${fromId}_${Date.now()}`;

    await tx.$executeRawUnsafe(
      `UPDATE clientes SET token = $1 WHERE id = $2`,
      pendingToken,
      fromId
    );

    await tx.$executeRawUnsafe(
      `INSERT INTO clientes (id, nombre, empresa, email, token, activo, fecha_creacion, cliente_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $1)`,
      toId,
      source.nombre,
      source.empresa,
      source.email,
      token,
      source.activo,
      source.fechaCreacion
    );

    await tx.$executeRawUnsafe(
      `UPDATE clientes_maquinas SET id_cliente = $1 WHERE id_cliente = $2`,
      toId,
      fromId
    );

    if (await tableExists("maquinas_alquileres")) {
      await tx.$executeRawUnsafe(
        `UPDATE maquinas_alquileres SET id_cliente = $1 WHERE id_cliente = $2`,
        toId,
        fromId
      );
    }

    if (await tableExists("agh_usuarios")) {
      await tx.$executeRawUnsafe(
        `UPDATE agh_usuarios SET cliente_id = $1 WHERE cliente_id = $2`,
        toId,
        fromId
      );
    }

    if (await tableExists("cloud_users")) {
      await tx.$executeRawUnsafe(
        `UPDATE cloud_users SET cliente_id = $1 WHERE cliente_id = $2`,
        toId,
        fromId
      );
    }

    await tx.$executeRawUnsafe(`DELETE FROM clientes WHERE id = $1`, fromId);

    await tx.$executeRawUnsafe(
      `SELECT setval(
        pg_get_serial_sequence('clientes', 'id'),
        COALESCE((SELECT MAX(id) FROM clientes), 1),
        true
      )`
    );
    },
    { timeout: 60_000 }
  );

  const rows = await prisma.cliente.findMany({
    select: { id: true, nombre: true, clienteId: true },
    orderBy: { id: "asc" },
  });
  const seq = await prisma.$queryRawUnsafe<{ last_value: bigint }[]>(
    `SELECT last_value FROM clientes_id_seq`
  );

  console.log("Listo. Clientes:", rows);
  console.log("Próximo id:", Number(seq[0]?.last_value ?? 0) + 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
