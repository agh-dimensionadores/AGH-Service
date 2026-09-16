/** Marcas que se asignan desde stock (importación). AGH sigue sin stock. */
const MARCAS_CON_STOCK = ["cubiscan", "conlida", "cubetape"] as const;

export function normalizeMarca(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function marcaUsaStock(marca: string | null | undefined) {
  const n = normalizeMarca(marca);
  return MARCAS_CON_STOCK.some((m) => n === m || n.includes(m));
}
