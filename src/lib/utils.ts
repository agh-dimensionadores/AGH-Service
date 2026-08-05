export function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (sameDay) return `Hoy, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Ayer, ${time}`;

  return `${formatDate(date)}, ${time}`;
}

export function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function daysUntil(value?: Date | string | null) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function labelCountdown(days: number | null) {
  if (days == null) return "Sin fecha";
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
  if (days === 0) return "Hoy";
  if (days === 1) return "En 1 día";
  return `En ${days} días`;
}

export function countdownTone(days: number | null): "ok" | "warn" | "danger" {
  if (days == null) return "warn";
  if (days < 0 || days <= 3) return "danger";
  if (days <= 10) return "warn";
  return "ok";
}

export const TIPOS_MANTENIMIENTO = [
  "Preventivo",
  "Correctivo",
  "Calibración",
  "Inspección",
  "Instalación",
  "Actualización",
  "Otro",
] as const;

export const ESTADOS_MANTENIMIENTO = [
  "abierto",
  "en_curso",
  "cerrado",
  "cancelado",
] as const;

export function labelEstado(estado: string) {
  const map: Record<string, string> = {
    abierto: "Abierto",
    en_curso: "En curso",
    cerrado: "Cerrado",
    cancelado: "Cancelado",
    programado: "Programado",
    completado: "Completado",
  };
  return map[estado] ?? estado;
}

export function machineName(m: {
  marca?: string | null;
  modelo?: string | null;
  maquina?: { marca?: string | null; modelo?: string | null } | null;
}) {
  const marca = m.maquina?.marca ?? m.marca;
  const modelo = m.maquina?.modelo ?? m.modelo;
  return [marca, modelo].filter(Boolean).join(" ") || "Equipo";
}

export function mantenimientoTitulo(item: {
  tipo: string;
  descripcion?: string | null;
}) {
  if (!item.descripcion) return item.tipo;
  const short = item.descripcion.trim().slice(0, 60);
  return short.length < item.descripcion.trim().length
    ? `${item.tipo}: ${short}…`
    : `${item.tipo}: ${short}`;
}

/** Estado derivado de tickets abiertos (ya no hay estadoEquipo en PG) */
export function equipoEstado(
  mantenimientos: { estado: string }[]
): "operativa" | "proximo" | "fuera" {
  if (mantenimientos.some((m) => m.estado === "en_curso")) return "fuera";
  if (mantenimientos.some((m) => m.estado === "abierto")) return "proximo";
  return "operativa";
}

export function machineThumbStyle(modelo: string) {
  const key = (modelo || "").toUpperCase();
  if (key.includes("PDC") || key.includes("PDL")) {
    return {
      background:
        "linear-gradient(145deg,#1a241c,#101610), radial-gradient(circle at 70% 20%, rgba(182,255,59,.22), transparent 45%)",
    };
  }
  if (key.includes("ODC") || key.includes("CLD")) {
    return {
      background:
        "linear-gradient(145deg,#182018,#0d120e), radial-gradient(circle at 30% 70%, rgba(0,180,255,.18), transparent 45%)",
    };
  }
  return {
    background:
      "linear-gradient(145deg,#1a241c,#0f1511), radial-gradient(circle at 70% 30%, rgba(182,255,59,.18), transparent 50%)",
  };
}
