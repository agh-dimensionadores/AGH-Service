import { cubiscanModeloNumero } from "@/lib/maquina-images";
import { planillaKind } from "@/lib/planilla-template";

export const CALIBRACION_PESO_ROWS = 31;

/** Solo básculas CubiScan; no aplica a dimensionadores AGH (PDC/ODC/PDL). */
export function calibracionPesoAplica(
  marca?: string | null,
  modelo?: string | null
): boolean {
  return planillaKind(marca, modelo) === "cubiscan";
}

export type CalibracionPesoFila = {
  patron: string;
  punto1: string;
  punto2: string;
  punto3: string;
  punto4: string;
  hora: string;
  realizo: string;
  firma: string;
};

export type CalibracionPesoPayload = {
  activa: boolean;
  lugar: string;
  equipo: string;
  mes: string;
  anio: string;
  modeloEquipo: string;
  filas: CalibracionPesoFila[];
  comentarios: string;
  firmaIngeniero: string;
  nombreIngeniero: string;
};

export function calibracionModeloLabel(
  marca?: string | null,
  modelo?: string | null
): string {
  const n = cubiscanModeloNumero(marca, modelo);
  if (n) return `CS ${n} TS`;
  const m = (modelo || "").trim();
  if (m) return m.toUpperCase();
  return "—";
}

export function calibracionTitulo(modeloEquipo: string) {
  return `REVISIÓN DE CALIBRACIÓN DE PESO EN CUBISCAN ${modeloEquipo}`;
}

/** Solo el número para el input (ej. "5 kg" → "5"). */
export function patronNumeroFromStored(patron: string): string {
  return patron.replace(/\s*kg\s*$/i, "").trim();
}

/** Agrega " kg" al guardar (ej. "5" → "5 kg"). */
export function formatPatronKg(numero: string): string {
  const n = patronNumeroFromStored(numero);
  if (!n) return "";
  return `${n} kg`;
}

export function emptyCalibracionPesoFila(
  defaults: Partial<CalibracionPesoFila> = {}
): CalibracionPesoFila {
  return {
    patron: defaults.patron ?? "",
    punto1: defaults.punto1 ?? "",
    punto2: defaults.punto2 ?? "",
    punto3: defaults.punto3 ?? "",
    punto4: defaults.punto4 ?? "",
    hora: defaults.hora ?? "",
    realizo: defaults.realizo ?? "",
    firma: defaults.firma ?? "",
  };
}

export function emptyCalibracionPeso(
  defaults: Partial<CalibracionPesoPayload> = {}
): CalibracionPesoPayload {
  const filasSource = defaults.filas ?? [];
  const filas = Array.from({ length: CALIBRACION_PESO_ROWS }, (_, i) =>
    emptyCalibracionPesoFila(filasSource[i] ?? {})
  );
  return {
    activa: defaults.activa ?? false,
    lugar: defaults.lugar ?? "",
    equipo: defaults.equipo ?? "",
    mes: defaults.mes ?? "",
    anio: defaults.anio ?? "",
    modeloEquipo: defaults.modeloEquipo ?? "",
    filas,
    comentarios: defaults.comentarios ?? "",
    firmaIngeniero: defaults.firmaIngeniero ?? "",
    nombreIngeniero: defaults.nombreIngeniero ?? "",
  };
}

export function extractCalibracionPeso(
  raw: unknown
): CalibracionPesoPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const cp = (raw as Record<string, unknown>).calibracionPeso;
  if (!cp || typeof cp !== "object") return null;
  return emptyCalibracionPeso(cp as Partial<CalibracionPesoPayload>);
}

export function stripCalibracionFromPayload<T extends Record<string, unknown>>(
  raw: T
): Omit<T, "calibracionPeso"> {
  const { calibracionPeso: _drop, ...rest } = raw;
  return rest;
}

export function mergePayloadWithCalibracion(
  planilla: Record<string, unknown>,
  calibracion: CalibracionPesoPayload | null
): Record<string, unknown> {
  const base = stripCalibracionFromPayload(planilla);
  if (calibracion) return { ...base, calibracionPeso: calibracion };
  return base;
}

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function allStr(formData: FormData, key: string) {
  return formData.getAll(key).map((v) => String(v).trim());
}

export function parseCalibracionPesoForm(
  formData: FormData
): CalibracionPesoPayload {
  const patrones = allStr(formData, "cal_patron");
  const p1 = allStr(formData, "cal_punto1");
  const p2 = allStr(formData, "cal_punto2");
  const p3 = allStr(formData, "cal_punto3");
  const p4 = allStr(formData, "cal_punto4");
  const horas = allStr(formData, "cal_hora");
  const realizaron = allStr(formData, "cal_realizo");
  const firmas = allStr(formData, "cal_firma");

  const filas = Array.from({ length: CALIBRACION_PESO_ROWS }, (_, i) =>
    emptyCalibracionPesoFila({
      patron: formatPatronKg(patrones[i] ?? ""),
      punto1: p1[i] ?? "",
      punto2: p2[i] ?? "",
      punto3: p3[i] ?? "",
      punto4: p4[i] ?? "",
      hora: horas[i] ?? "",
      realizo: realizaron[i] ?? "",
      firma: firmas[i] ?? "",
    })
  );

  const fromFormFirma = str(formData, "firmaIngeniero");
  const firmaIngeniero = fromFormFirma.startsWith("data:image/")
    ? fromFormFirma
    : "";

  return emptyCalibracionPeso({
    activa: true,
    lugar: str(formData, "lugar"),
    equipo: str(formData, "equipo"),
    mes: str(formData, "mes"),
    anio: str(formData, "anio"),
    modeloEquipo: str(formData, "modeloEquipo"),
    filas,
    comentarios: str(formData, "comentarios"),
    firmaIngeniero,
    nombreIngeniero: str(formData, "nombreIngeniero"),
  });
}
