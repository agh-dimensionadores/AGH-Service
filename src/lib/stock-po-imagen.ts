import { Prisma } from "@prisma/client-pg";
import { prismaPg } from "@/lib/prisma";
import { MAX_FOTO_UNIDAD_BYTES, readUploadedImage } from "@/lib/uploads";

export async function ensureStockPoImagenColumns() {
  await prismaPg.$executeRawUnsafe(`
    ALTER TABLE maquinas_stock
      ADD COLUMN IF NOT EXISTS po_imagen BYTEA,
      ADD COLUMN IF NOT EXISTS po_imagen_mime VARCHAR(50)
  `);
}

export async function stockHasPoImagen(stockId: number): Promise<boolean> {
  await ensureStockPoImagenColumns();
  const rows = await prismaPg.$queryRaw<{ ok: boolean }[]>`
    SELECT (po_imagen IS NOT NULL) AS ok
    FROM maquinas_stock
    WHERE id = ${stockId}
    LIMIT 1
  `;
  return Boolean(rows[0]?.ok);
}

export async function listStockPoImagenFlags(
  stockIds: number[]
): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();
  const unique = [...new Set(stockIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (!unique.length) return map;
  await ensureStockPoImagenColumns();
  const rows = await prismaPg.$queryRaw<{ id: number; ok: boolean }[]>`
    SELECT id, (po_imagen IS NOT NULL) AS ok
    FROM maquinas_stock
    WHERE id IN (${Prisma.join(unique)})
  `;
  for (const row of rows) map.set(row.id, Boolean(row.ok));
  return map;
}

export async function getStockPoImagen(
  stockId: number
): Promise<{ imagen: Buffer; imagenMime: string } | null> {
  await ensureStockPoImagenColumns();
  const rows = await prismaPg.$queryRaw<
    { po_imagen: Buffer; po_imagen_mime: string | null }[]
  >`
    SELECT po_imagen, po_imagen_mime
    FROM maquinas_stock
    WHERE id = ${stockId} AND po_imagen IS NOT NULL
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.po_imagen) return null;
  return {
    imagen: Buffer.from(row.po_imagen),
    imagenMime: row.po_imagen_mime || "image/jpeg",
  };
}

export async function saveStockPoImagen(stockId: number, formData: FormData) {
  await ensureStockPoImagenColumns();

  const quitar = formData.get("quitarPoImagen");
  if (quitar === "1" || quitar === "on") {
    await prismaPg.$executeRaw`
      UPDATE maquinas_stock
      SET po_imagen = NULL, po_imagen_mime = NULL
      WHERE id = ${stockId}
    `;
  }

  const file = formData.get("poImagen");
  if (!(file instanceof File) || file.size === 0) return;

  const image = await readUploadedImage(file, MAX_FOTO_UNIDAD_BYTES);
  if (!image) return;

  await prismaPg.$executeRaw`
    UPDATE maquinas_stock
    SET
      po_imagen = ${Buffer.from(image.bytes)},
      po_imagen_mime = ${image.mime}
    WHERE id = ${stockId}
  `;
}
