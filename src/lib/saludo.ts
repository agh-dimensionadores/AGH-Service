export type Genero = "m" | "f";

export function parseGenero(value: string | null | undefined): Genero | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "m" || v === "f") return v;
  return null;
}

/** Saludo según género guardado; si no hay dato, usa forma neutra. */
export function saludoBienvenida(
  nombre: string,
  genero?: string | null
): string {
  const g = parseGenero(genero);
  if (g === "f") return `Bienvenida, ${nombre}`;
  if (g === "m") return `Bienvenido, ${nombre}`;
  return `Hola, ${nombre}`;
}
