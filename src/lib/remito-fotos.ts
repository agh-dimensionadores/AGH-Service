import { Prisma } from "@prisma/client-pg";
import { prismaPg } from "@/lib/prisma";
import {
  MAX_FOTO_UNIDAD_BYTES,
  MAX_FOTOS_REMITO,
  readUploadedImage,
} from "@/lib/uploads";

export type RemitoFotoMeta = { id: number };

export async function ensureNumeroRemitoColumn() {
  await prismaPg.$executeRawUnsafe(`
    ALTER TABLE clientes_maquinas
      ADD COLUMN IF NOT EXISTS numero_remito VARCHAR(100)
  `);
}

export async function getNumeroRemito(
  idClienteMaquina: number
): Promise<string | null> {
  await ensureNumeroRemitoColumn();
  const rows = await prismaPg.$queryRaw<{ numero_remito: string | null }[]>`
    SELECT numero_remito
    FROM clientes_maquinas
    WHERE id = ${idClienteMaquina}
    LIMIT 1
  `;
  const value = rows[0]?.numero_remito?.trim();
  return value || null;
}

export async function setNumeroRemito(
  idClienteMaquina: number,
  value: string | null
) {
  await ensureNumeroRemitoColumn();
  await prismaPg.$executeRaw`
    UPDATE clientes_maquinas
    SET numero_remito = ${value}
    WHERE id = ${idClienteMaquina}
  `;
}

export async function ensureRemitosTable() {
  await prismaPg.$executeRawUnsafe(`
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
  await prismaPg.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS clientes_maquinas_remitos_unidad_idx
      ON clientes_maquinas_remitos (id_cliente_maquina)
  `);
}

export async function listRemitoFotos(
  idClienteMaquina: number
): Promise<RemitoFotoMeta[]> {
  await ensureRemitosTable();
  return prismaPg.$queryRaw<RemitoFotoMeta[]>`
    SELECT id
    FROM clientes_maquinas_remitos
    WHERE id_cliente_maquina = ${idClienteMaquina}
    ORDER BY orden ASC, id ASC
  `;
}

export async function getRemitoFoto(
  idClienteMaquina: number,
  fotoId: number
): Promise<{ imagen: Buffer; imagenMime: string } | null> {
  await ensureRemitosTable();
  const rows = await prismaPg.$queryRaw<
    { imagen: Buffer; imagen_mime: string }[]
  >`
    SELECT imagen, imagen_mime
    FROM clientes_maquinas_remitos
    WHERE id = ${fotoId} AND id_cliente_maquina = ${idClienteMaquina}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return { imagen: Buffer.from(row.imagen), imagenMime: row.imagen_mime };
}

export async function saveRemitoFotos(
  idClienteMaquina: number,
  formData: FormData
) {
  await ensureRemitosTable();

  const quitar = formData
    .getAll("quitarFotoRemito")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (quitar.length) {
    await prismaPg.$executeRaw`
      DELETE FROM clientes_maquinas_remitos
      WHERE id_cliente_maquina = ${idClienteMaquina}
        AND id IN (${Prisma.join(quitar)})
    `;
  }

  const countRows = await prismaPg.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n
    FROM clientes_maquinas_remitos
    WHERE id_cliente_maquina = ${idClienteMaquina}
  `;
  const remaining = Number(countRows[0]?.n ?? 0);
  const slots = Math.max(0, MAX_FOTOS_REMITO - remaining);
  const files = formData
    .getAll("fotosRemito")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, slots);

  let ordenN = remaining;
  for (const file of files) {
    const image = await readUploadedImage(file, MAX_FOTO_UNIDAD_BYTES);
    if (!image) continue;
    await prismaPg.$executeRaw`
      INSERT INTO clientes_maquinas_remitos
        (id_cliente_maquina, imagen, imagen_mime, orden)
      VALUES (
        ${idClienteMaquina},
        ${Buffer.from(image.bytes)},
        ${image.mime},
        ${ordenN}
      )
    `;
    ordenN += 1;
  }
}
