import { catalogImageUrl } from "@/lib/uploads";

/** Archivos en /public/maquinas y assets/maquinas, por número de modelo CubiScan. */
export const CUBISCAN_IMAGE_FILES: Record<string, string> = {
  "100": "cubiscan100.png",
  "110": "cubiscan110.png",
  "150": "cubiscan150.png",
  "200": "200sq.png",
  "325": "cubiscan325.png",
};

const KNOWN_NUMEROS = Object.keys(CUBISCAN_IMAGE_FILES).sort(
  (a, b) => b.length - a.length || Number(b) - Number(a)
);

export type MaquinaImageInput = {
  idmachine?: number;
  marca?: string | null;
  modelo?: string | null;
  imagenMime?: string | null;
  imagenUpdatedAt?: Date | string | null;
};

function looksLikeCubiscan(marca?: string | null, modelo?: string | null) {
  const blob = `${marca || ""} ${modelo || ""}`.toLowerCase();
  return /cubi\s*scan/.test(blob);
}

function extractKnownNumero(text?: string | null) {
  const compact = (text || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (!compact) return null;
  for (const n of KNOWN_NUMEROS) {
    if (compact.includes(n)) return n;
  }
  return null;
}

/** Número de modelo CubiScan (100, 110, 150, 200, 325) o null. */
export function cubiscanModeloNumero(
  marca?: string | null,
  modelo?: string | null
): string | null {
  const n = extractKnownNumero(modelo) ?? extractKnownNumero(marca);
  if (!n) return null;
  if (looksLikeCubiscan(marca, modelo)) return n;
  const modeloTrim = (modelo || "").trim();
  if (KNOWN_NUMEROS.includes(modeloTrim)) return n;
  return null;
}

function aghStaticFile(marca?: string | null, modelo?: string | null) {
  const blob = `${marca || ""} ${modelo || ""}`.toUpperCase().replace(/[\s_-]+/g, "");
  if (blob.includes("ODC")) return "maquinaodc.png";
  if (blob.includes("PDL") || blob.includes("PDC")) return "maquinapdl.png";
  return null;
}

export function staticMaquinaImageUrl(
  marca?: string | null,
  modelo?: string | null
): string | null {
  const agh = aghStaticFile(marca, modelo);
  if (agh) return `/maquinas/${agh}`;
  const n = cubiscanModeloNumero(marca, modelo);
  if (!n) return null;
  const file = CUBISCAN_IMAGE_FILES[n];
  return file ? `/maquinas/${file}` : null;
}

/** Foto de catálogo: CubiScan por número de modelo; si no, imagen subida a PostgreSQL. */
export function maquinaImageSrc(m: MaquinaImageInput): string | null {
  const staticUrl = staticMaquinaImageUrl(m.marca, m.modelo);
  if (staticUrl) return staticUrl;
  if (m.imagenMime && m.idmachine != null) {
    return catalogImageUrl(m.idmachine, m.imagenUpdatedAt);
  }
  return null;
}
