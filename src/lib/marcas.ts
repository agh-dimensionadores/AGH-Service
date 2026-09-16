/** Marcas que se asignan desde stock. */
const MARCAS_IMPORTACION = ["cubiscan", "conlida", "cubetape"] as const;

export function normalizeMarca(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function marcaEsAgh(marca: string | null | undefined) {
  const n = normalizeMarca(marca);
  return n === "agh" || n.includes("agh");
}

/** Cubiscan / Conlida / Cubetape: stock con datos de importación. */
export function marcaEsImportacion(marca: string | null | undefined) {
  const n = normalizeMarca(marca);
  return MARCAS_IMPORTACION.some((m) => n === m || n.includes(m));
}

/** AGH + marcas de importación: requieren unidad en stock para asignar. */
export function marcaUsaStock(marca: string | null | undefined) {
  return marcaEsAgh(marca) || marcaEsImportacion(marca);
}
