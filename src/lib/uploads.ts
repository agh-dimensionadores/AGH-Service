const MAX_BYTES = 5 * 1024 * 1024;

export type UploadedImage = {
  bytes: Uint8Array;
  mime: string;
};

function detectMime(bytes: Uint8Array, fallback: string): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    fallback === "image/jpeg" ||
    fallback === "image/png" ||
    fallback === "image/webp" ||
    fallback === "image/gif"
  ) {
    return fallback;
  }
  return null;
}

/** Lee una imagen del form para guardarla en PostgreSQL (BYTEA). */
export async function readUploadedImage(
  file: File | null
): Promise<UploadedImage | null> {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectMime(bytes, file.type || "");
  if (!mime) {
    throw new Error("Formato no soportado. Usá JPG, PNG, WEBP o GIF.");
  }

  return { bytes, mime };
}

/** URL con versionado para evitar caché del navegador al cambiar la foto. */
export function catalogImageUrl(
  idmachine: number,
  updatedAt?: Date | string | null
) {
  const base = `/api/maquinas/${idmachine}/imagen`;
  if (!updatedAt) return `${base}?v=0`;
  const ts =
    typeof updatedAt === "string"
      ? new Date(updatedAt).getTime()
      : updatedAt.getTime();
  return `${base}?v=${Number.isFinite(ts) ? ts : 0}`;
}
