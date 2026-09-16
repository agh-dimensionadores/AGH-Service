import { prismaPg } from "@/lib/prisma";

/** Normaliza el nro. de serie para comparar (único global). */
export function normalizeNumeroSerie(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

/**
 * Busca si el nro. de serie ya existe en stock o en una asignación activa.
 * Las unidades liberadas (historial de alquiler) no bloquean la serie.
 * Al asignar desde stock, pasar excludeStockId de esa unidad de stock.
 */
export async function numeroSerieYaExiste(
  numeroSerie: string,
  opts?: { excludeStockId?: number; excludeUnidadId?: number }
) {
  const serie = normalizeNumeroSerie(numeroSerie);
  if (!serie) return false;

  const [enStock, asignadaActiva] = await Promise.all([
    prismaPg.maquinaStock.findFirst({
      where: {
        numeroSerie: { equals: serie, mode: "insensitive" },
        ...(opts?.excludeStockId != null
          ? { NOT: { id: opts.excludeStockId } }
          : {}),
      },
      select: { id: true },
    }),
    prismaPg.clienteMaquina.findFirst({
      where: {
        numeroSerie: { equals: serie, mode: "insensitive" },
        liberadaEn: null,
        ...(opts?.excludeUnidadId != null
          ? { NOT: { id: opts.excludeUnidadId } }
          : {}),
      },
      select: { id: true },
    }),
  ]);

  return Boolean(enStock || asignadaActiva);
}

export const MSG_SERIE_DUPLICADA =
  "Ese nro. de serie ya existe. Debe ser único: no se puede repetir en stock ni en otra máquina activa.";
