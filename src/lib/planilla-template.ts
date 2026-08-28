import type { CubiscanCheckSection } from "@/lib/cubiscan-planilla";
import { CUBISCAN_CHECK_SECTIONS } from "@/lib/cubiscan-planilla";

export type PlanillaKind = "cubiscan" | "agh";

/** ODC / PDC / PDL según el texto de modelo o marca. */
export function aghModeloCode(
  marca?: string | null,
  modelo?: string | null
): "ODC" | "PDC" | "PDL" | null {
  const blob = `${marca || ""} ${modelo || ""}`.toUpperCase().replace(/[\s_-]+/g, "");
  if (blob.includes("ODC")) return "ODC";
  if (blob.includes("PDL")) return "PDL";
  if (blob.includes("PDC")) return "PDC";
  return null;
}

export function planillaKind(
  marca?: string | null,
  modelo?: string | null
): PlanillaKind | null {
  if ((marca || "").trim().toLowerCase() === "cubiscan") return "cubiscan";
  if (aghModeloCode(marca, modelo)) return "agh";
  return null;
}

export const AGH_CHECK_SECTIONS: CubiscanCheckSection[] = [
  {
    id: "estructura",
    title: "Estructura y Ensamble",
    items: [
      { id: "inspeccion_visual", label: "Inspección visual para detectar golpes" },
      { id: "ensamble_tornillos", label: "Revisión de ensamble y tornillos" },
      { id: "tierra_fisica", label: "Revisión de tierra física" },
      { id: "nivel_equipo", label: "Revisión del nivel del equipo" },
    ],
  },
  {
    id: "energia",
    title: "Suministro de energía",
    items: [
      { id: "cable_alimentacion", label: "Revisión de cable de alimentación" },
      { id: "voltaje_bateria", label: "Revisión de voltaje en batería" },
    ],
  },
  {
    id: "cargador",
    title: "Cargador/Inversor",
    items: [
      { id: "estado_general", label: "Revisión general del estado del equipo" },
      { id: "cableado", label: "Revisión de cableado" },
    ],
  },
  {
    id: "limpieza",
    title: "Limpieza",
    items: [
      { id: "camara", label: "Limpieza cámara" },
      { id: "general", label: "Limpieza general" },
    ],
  },
  {
    id: "calibracion",
    title: "Calibración / Comunicación",
    items: [
      { id: "parametros_camara", label: "Parámetros de cámara" },
      { id: "calib_bascula", label: "Calibración de la báscula" },
      { id: "com_pc", label: "Comunicación PC y Cámara" },
      { id: "lectora", label: "Estado y funcionamiento de lectora" },
    ],
  },
];

export function checkSectionsFor(kind: PlanillaKind): CubiscanCheckSection[] {
  return kind === "agh" ? AGH_CHECK_SECTIONS : CUBISCAN_CHECK_SECTIONS;
}

export function planillaTitulo(kind: PlanillaKind) {
  return kind === "agh"
    ? "Orden de Servicio para Equipo AGH Dimensionadores"
    : "Orden de Servicio para Equipo CubiScan";
}

export function planillaFirmaLabel(kind: PlanillaKind) {
  return kind === "agh" ? "Representante de AGH" : "Representante de CubiScan";
}

export function planillaPageTitle(kind: PlanillaKind) {
  return kind === "agh" ? "Planilla AGH Dimensionadores" : "Planilla CubiScan";
}
