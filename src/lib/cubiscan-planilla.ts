export type CubiscanCheckItem = {
  id: string;
  label: string;
  /** Si true, es Sí/No en lugar de checkbox de “revisado” */
  yesNo?: boolean;
};

export type CubiscanCheckSection = {
  id: string;
  title: string;
  items: CubiscanCheckItem[];
};

export const CUBISCAN_CHECK_SECTIONS: CubiscanCheckSection[] = [
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
      { id: "voltaje_adaptador", label: "Revisión de voltaje en adaptador (fuente)" },
      { id: "cable_alimentacion", label: "Revisión de cable de alimentación" },
      { id: "voltaje_bateria", label: "Revisión de voltaje en batería" },
      { id: "electrolito", label: "Revisión del nivel de electrolito en batería" },
      { id: "bornes", label: "Revisión de bornes de batería" },
    ],
  },
  {
    id: "cargador",
    title: "Cargador/Inversor",
    items: [
      { id: "estado_general", label: "Revisión general del estado del equipo" },
      { id: "carga_inversion", label: "Revisión de carga e inversión CD/CA" },
      { id: "cableado", label: "Revisión de cableado" },
    ],
  },
  {
    id: "limpieza",
    title: "Limpieza",
    items: [
      { id: "sensores", label: "Limpieza de sensores" },
      { id: "celda_carga", label: "Limpieza de celda de carga" },
      { id: "panel_interno", label: "Limpieza interna de panel" },
      { id: "puertos_panel", label: "Limpieza de puertos de Panel" },
      {
        id: "limpieza_liquidos",
        label: "¿Requirió limpieza con líquidos?",
        yesNo: true,
      },
    ],
  },
  {
    id: "calibracion",
    title: "Calibración / Comunicación",
    items: [
      { id: "parametros_sensores", label: "Parámetros de sensores" },
      { id: "calib_ultrasonicos", label: "Calibración sensores ultrasónicos" },
      { id: "calib_bascula", label: "Calibración de la báscula" },
      { id: "etiqueta_calib", label: "Etiqueta de calibración" },
      { id: "com_pc", label: "Comunicación PC y CubiScan" },
      { id: "cables_sensores", label: "Revisión cables de sensores" },
      { id: "lectora", label: "Estado y funcionamiento de lectora" },
    ],
  },
];

export type CubiscanRefaccion = {
  cantidad: string;
  numeroParte: string;
  descripcion: string;
  /** reemplazada | nueva */
  estado: "reemplazada" | "nueva";
};

export type CubiscanOrdenPayload = {
  modelo: string;
  ingenieros: string;
  horaLlegada: string;
  ubicacion: string;
  contacto: string;
  nroOrden: string;
  fecha: string;
  cliente: string;
  numeroSerie: string;
  /** Tipos de servicio de la planilla impresa */
  embalaje: boolean;
  instalacion: "" | "venta" | "renta";
  mantenimientoTipo: "" | "preventivo" | "correctivo";
  checks: Record<string, string | boolean>;
  comentarios: string;
  refacciones: CubiscanRefaccion[];
  falloResuelto: "" | "si" | "no" | "en_proceso";
  velocidadServicio: "" | "rapido" | "normal" | "lento";
  tratoIngeniero: "" | "amable" | "descortes";
  tiempoReparacion: string;
  fechaCalificacion: string;
  horarioCalificacion: string;
  sugerencias: string;
  representanteCliente: string;
  representanteCubiscan: string;
};

export const CUBISCAN_EMPRESA = {
  nombre: "Logintec SRL",
  direccion: "Rodríguez Peña 3375 - 1650 - Villa Lynch",
  telefono: "Tel: (54)(11) 2093-8009",
  web: "www.logintec.com",
  horario: "Lunes a Viernes de 9:00 a 18:00 hrs.",
};

export function checkKey(sectionId: string, itemId: string) {
  return `${sectionId}.${itemId}`;
}

export function checkNoteKey(sectionId: string, itemId: string) {
  return `${checkKey(sectionId, itemId)}_nota`;
}

export function isCheckMarked(val: string | boolean | undefined) {
  return val === true || val === "true" || val === "on";
}

export function checkNoteText(
  checks: Record<string, string | boolean>,
  sectionId: string,
  itemId: string
) {
  const note = checks[checkNoteKey(sectionId, itemId)];
  return typeof note === "string" ? note.trim() : "";
}

const PLANILLA_BOILERPLATE = new Set([
  "Cerrado con planilla CubiScan",
  "Cerrado con planilla AGH Dimensionadores",
]);

/** Texto interno al cerrar; no debe aparecer en Comentarios/Notas del PDF. */
export function stripPlanillaBoilerplate(value?: string | null) {
  const text = (value ?? "").trim();
  if (!text || PLANILLA_BOILERPLATE.has(text)) return "";
  return text;
}

export const PLANILLA_SURVEY_FIELDS = [
  "falloResuelto",
  "velocidadServicio",
  "tratoIngeniero",
  "tiempoReparacion",
  "fechaCalificacion",
  "horarioCalificacion",
  "sugerencias",
  "representanteCliente",
] as const satisfies readonly (keyof CubiscanOrdenPayload)[];

export function copyPlanillaSurveyFields(
  target: CubiscanOrdenPayload,
  source: CubiscanOrdenPayload
) {
  for (const key of PLANILLA_SURVEY_FIELDS) {
    target[key] = source[key];
  }
}

export function emptyCubiscanPayload(
  defaults: Partial<CubiscanOrdenPayload> = {}
): CubiscanOrdenPayload {
  return {
    modelo: defaults.modelo ?? "",
    ingenieros: defaults.ingenieros ?? "",
    horaLlegada: defaults.horaLlegada ?? "",
    ubicacion: defaults.ubicacion ?? "",
    contacto: defaults.contacto ?? "",
    nroOrden: defaults.nroOrden ?? "",
    fecha: defaults.fecha ?? new Date().toISOString().slice(0, 10),
    cliente: defaults.cliente ?? "",
    numeroSerie: defaults.numeroSerie ?? "",
    embalaje: defaults.embalaje ?? false,
    instalacion: defaults.instalacion ?? "",
    mantenimientoTipo: defaults.mantenimientoTipo ?? "correctivo",
    checks: defaults.checks ?? {},
    comentarios: defaults.comentarios ?? "",
    refacciones: defaults.refacciones ?? [
      {
        cantidad: "",
        numeroParte: "",
        descripcion: "",
        estado: "reemplazada",
      },
    ],
    falloResuelto: defaults.falloResuelto ?? "",
    velocidadServicio: defaults.velocidadServicio ?? "",
    tratoIngeniero: defaults.tratoIngeniero ?? "",
    tiempoReparacion: defaults.tiempoReparacion ?? "",
    fechaCalificacion: defaults.fechaCalificacion ?? "",
    horarioCalificacion: defaults.horarioCalificacion ?? "",
    sugerencias: defaults.sugerencias ?? "",
    representanteCliente: defaults.representanteCliente ?? "",
    representanteCubiscan: defaults.representanteCubiscan ?? "",
  };
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function labelFallo(v: string) {
  if (v === "si") return "Sí";
  if (v === "no") return "No";
  if (v === "en_proceso") return "En proceso";
  return "—";
}

export function labelVel(v: string) {
  if (v === "rapido") return "Rápido";
  if (v === "normal") return "Normal";
  if (v === "lento") return "Lento";
  return "—";
}

export function labelTrato(v: string) {
  if (v === "amable") return "Amable";
  if (v === "descortes") return "Descortés";
  return "—";
}

export function formatFechaAr(iso: string) {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function checkValueHtml(section: CubiscanCheckSection, item: CubiscanCheckItem, checks: Record<string, string | boolean>) {
  const key = checkKey(section.id, item.id);
  const val = checks[key];
  if (item.yesNo) {
    if (val === "si" || val === true) return "Sí";
    if (val === "no" || val === false) return "No";
    return "—";
  }
  const note = checkNoteText(checks, section.id, item.id);
  const marked = isCheckMarked(val);
  if (marked && note) return `✓ · ${esc(note)}`;
  if (marked) return "✓";
  if (note) return esc(note);
  return "—";
}

export function buildCubiscanOrdenHtml(opts: {
  payload: CubiscanOrdenPayload;
  firmaIngeniero?: string | null;
  firmaCliente?: string | null;
  sections?: CubiscanCheckSection[];
  titulo?: string;
  firmaLabel?: string;
}) {
  const { payload: p, firmaIngeniero, firmaCliente } = opts;
  const sections = opts.sections ?? CUBISCAN_CHECK_SECTIONS;
  const titulo =
    opts.titulo ?? "Orden de Servicio para Equipo CubiScan";
  const firmaLabel = opts.firmaLabel ?? "Representante de CubiScan";
  const sectionsHtml = sections.map((section) => {
    const items = section.items
      .map(
        (item) =>
          `<li style="margin:4px 0">${esc(item.label)}: <strong>${checkValueHtml(section, item, p.checks)}</strong></li>`
      )
      .join("");
    return `<h3 style="margin:18px 0 8px;font-size:15px">${esc(section.title)}</h3><ul style="margin:0;padding-left:18px">${items}</ul>`;
  }).join("");

  const refacciones = (p.refacciones ?? [])
    .filter((r) => r.cantidad || r.numeroParte || r.descripcion)
    .map(
      (r) =>
        `<tr>
          <td style="border:1px solid #ddd;padding:6px">${esc(
            r.estado === "nueva" ? "Nueva" : "Reemplazada"
          )}</td>
          <td style="border:1px solid #ddd;padding:6px">${esc(r.cantidad)}</td>
          <td style="border:1px solid #ddd;padding:6px">${esc(r.numeroParte)}</td>
          <td style="border:1px solid #ddd;padding:6px">${esc(r.descripcion)}</td>
        </tr>`
    )
    .join("");

  const firmaIng = firmaIngeniero
    ? `<img src="${firmaIngeniero}" alt="Firma representante" style="max-width:220px;max-height:90px;border-bottom:1px solid #999" />`
    : "<em>Sin firma</em>";
  const firmaCli = firmaCliente
    ? `<img src="${firmaCliente}" alt="Firma cliente" style="max-width:220px;max-height:90px;border-bottom:1px solid #999" />`
    : "<em>Sin firma</em>";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>${esc(titulo)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.45;max-width:720px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 8px">${esc(titulo)}</h1>
  <p style="margin:0 0 4px"><strong>Modelo</strong> ${esc(p.modelo || "—")}</p>
  <p style="margin:12px 0 4px"><strong>${esc(CUBISCAN_EMPRESA.nombre)}</strong><br/>
  ${esc(CUBISCAN_EMPRESA.direccion)}<br/>
  ${esc(CUBISCAN_EMPRESA.telefono)} · ${esc(CUBISCAN_EMPRESA.web)}<br/>
  ${esc(CUBISCAN_EMPRESA.horario)}</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
    <tr><td style="padding:4px 0"><strong>Representante(s):</strong> ${esc(p.ingenieros || "—")}</td>
        <td style="padding:4px 0"><strong>N.º de Orden:</strong> ${esc(p.nroOrden || "—")}</td></tr>
    <tr><td style="padding:4px 0"><strong>Hora de llegada:</strong> ${esc(p.horaLlegada || "—")}</td>
        <td style="padding:4px 0"><strong>Fecha:</strong> ${esc(formatFechaAr(p.fecha))}</td></tr>
    <tr><td style="padding:4px 0"><strong>Ubicación:</strong> ${esc(p.ubicacion || "—")}</td>
        <td style="padding:4px 0"><strong>Cliente:</strong> ${esc(p.cliente || "—")}</td></tr>
    <tr><td style="padding:4px 0"><strong>Contacto:</strong> ${esc(p.contacto || "—")}</td>
        <td style="padding:4px 0"><strong>N.º de Serie:</strong> ${esc(p.numeroSerie || "—")}</td></tr>
  </table>

  <h2 style="font-size:16px;margin:24px 0 8px;border-bottom:2px solid #333;padding-bottom:4px">Detalle del servicio realizado</h2>
  ${sectionsHtml}

  <h3 style="margin:18px 0 8px;font-size:15px">Comentarios / Notas</h3>
  <p style="white-space:pre-wrap;background:#f7f7f7;padding:12px;border-radius:6px">${esc(p.comentarios || "—")}</p>

  <h3 style="margin:18px 0 8px;font-size:15px">Refacciones reemplazadas / Requerimiento de reemplazo</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr>
        <th style="border:1px solid #ddd;padding:6px;text-align:left">Tipo</th>
        <th style="border:1px solid #ddd;padding:6px;text-align:left">Cantidad</th>
        <th style="border:1px solid #ddd;padding:6px;text-align:left">N.º de parte</th>
        <th style="border:1px solid #ddd;padding:6px;text-align:left">Descripción</th>
      </tr>
    </thead>
    <tbody>
      ${refacciones || `<tr><td colspan="4" style="border:1px solid #ddd;padding:6px">Sin refacciones</td></tr>`}
    </tbody>
  </table>

  <h3 style="margin:18px 0 8px;font-size:15px">Califique nuestro servicio</h3>
  <ul style="margin:0;padding-left:18px">
    <li>¿Resolvimos la falla reportada? <strong>${labelFallo(p.falloResuelto)}</strong></li>
    <li>El servicio de mantenimiento fue: <strong>${labelVel(p.velocidadServicio)}</strong></li>
    <li>El trato del Representante fue: <strong>${labelTrato(p.tratoIngeniero)}</strong></li>
    <li>Tiempo de reparación: <strong>${esc(p.tiempoReparacion || "—")}</strong></li>
    <li>Fecha: <strong>${esc(formatFechaAr(p.fechaCalificacion))}</strong></li>
    <li>Horario: <strong>${esc(p.horarioCalificacion || "—")}</strong></li>
  </ul>

  <table style="width:100%;margin-top:28px;font-size:14px">
    <tr>
      <td style="width:50%;vertical-align:bottom;padding-right:12px">
        <p style="margin:0 0 8px"><strong>Representante del Cliente</strong><br/>${esc(p.representanteCliente || "—")}</p>
        ${firmaCli}
      </td>
      <td style="width:50%;vertical-align:bottom;padding-left:12px">
        <p style="margin:0 0 8px"><strong>${esc(firmaLabel)}</strong><br/>${esc(p.representanteCubiscan || p.ingenieros || "—")}</p>
        ${firmaIng}
      </td>
    </tr>
  </table>
</body>
</html>`;
}
