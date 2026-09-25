import { prismaPg } from "@/lib/prisma";
import { clienteLabel, getClientesMap, listClientes } from "@/lib/clientes";
import { daysBetween, daysUntil, equipoEstado, machineName } from "@/lib/utils";

export const PERIODOS = [
  { id: "30", label: "30 días" },
  { id: "90", label: "90 días" },
  { id: "365", label: "12 meses" },
  { id: "ytd", label: "Este año" },
  { id: "todo", label: "Histórico" },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"];

export type Rango = {
  id: PeriodoId;
  label: string;
  start: Date | null;
  end: Date;
  prevStart: Date | null;
  prevEnd: Date | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function parsePeriodo(value?: string | null): PeriodoId {
  return PERIODOS.some((p) => p.id === value) ? (value as PeriodoId) : "90";
}

export function rangoPeriodo(id: PeriodoId, now = new Date()): Rango {
  const end = endOfDay(now);
  if (id === "todo") {
    return {
      id,
      label: "Histórico",
      start: null,
      end,
      prevStart: null,
      prevEnd: null,
    };
  }
  if (id === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = endOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
    return {
      id,
      label: `Año ${now.getFullYear()}`,
      start,
      end,
      prevStart,
      prevEnd,
    };
  }
  const days = id === "30" ? 30 : id === "365" ? 365 : 90;
  const start = startOfDay(addDays(now, -(days - 1)));
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = startOfDay(addDays(prevEnd, -(days - 1)));
  const label =
    id === "30" ? "Últimos 30 días" : id === "365" ? "Últimos 12 meses" : "Últimos 90 días";
  return { id, label, start, end, prevStart, prevEnd };
}

function inRange(value: Date, start: Date | null, end: Date) {
  if (start && value < start) return false;
  return value <= end;
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export type TrendPoint = { label: string; abiertos: number; cerrados: number };

function trendBuckets(start: Date, end: Date): { key: string; label: string }[] {
  const span = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const monthly = span > 45;
  const buckets: { key: string; label: string }[] = [];

  if (monthly) {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) {
      buckets.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
        label: MESES[cursor.getMonth()],
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = startOfDay(start);
    while (cursor <= end) {
      buckets.push({
        key: dateKey(cursor),
        label: `${cursor.getDate()} ${MESES[cursor.getMonth()]}`,
      });
      cursor.setDate(cursor.getDate() + (span <= 14 ? 1 : 7));
    }
  }

  return buckets.slice(-12);
}

function bucketKey(d: Date, monthly: boolean, weekStarts: Date[]) {
  if (monthly) return `${d.getFullYear()}-${d.getMonth()}`;
  if (weekStarts.length && weekStarts[0] && dateKey(weekStarts[0]).length) {
    let chosen = weekStarts[0];
    for (const start of weekStarts) {
      if (start <= d) chosen = start;
    }
    return dateKey(chosen);
  }
  return dateKey(d);
}

export type RankItem = { label: string; value: number; hint?: string; href?: string };

export type Reporte = {
  rango: Rango;
  clienteId: number | null;
  clienteNombre: string | null;
  clientes: { id: number; label: string }[];
  ingresados: number;
  ingresadosPrev: number | null;
  cerrados: number;
  cerradosPrev: number | null;
  tiempoMedio: number | null;
  tiempoMedioPrev: number | null;
  tasaCierre: number | null;
  backlog: number;
  enCurso: number;
  disponibilidad: number;
  operativas: number;
  pendientes: number;
  enReparacion: number;
  flota: number;
  venta: number;
  alquiler: number;
  stockDisponible: number;
  stockAsignado: number;
  valorDeposito: number | null;
  alquileresPorVencer: number;
  alquileresVencidos: number;
  trend: TrendPoint[];
  porTipo: RankItem[];
  porTecnico: RankItem[];
  porMarca: RankItem[];
  porEstado: { estado: string; value: number }[];
  topClientes: {
    id: number;
    label: string;
    total: number;
    abiertos: number;
    cerrados: number;
    dias: number | null;
  }[];
  aging: {
    id: number;
    titulo: string;
    cliente: string;
    equipo: string;
    tipo: string;
    estado: string;
    dias: number;
    asignado: string;
  }[];
  alquileres: {
    id: number;
    cliente: string;
    equipo: string;
    serie: string;
    fin: string;
    dias: number | null;
    href: string;
  }[];
};

function avg(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function moneySum(values: { toString(): string }[]) {
  const nums = values
    .map((v) => Number(v.toString()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0);
}

export function reportesHref(periodo: string, clienteId?: number | null) {
  const params = new URLSearchParams();
  if (periodo && periodo !== "90") params.set("periodo", periodo);
  if (clienteId) params.set("cliente", String(clienteId));
  const q = params.toString();
  return q ? `/reportes?${q}` : "/reportes";
}

export function reportesCsvHref(periodo: string, clienteId?: number | null) {
  const params = new URLSearchParams();
  params.set("periodo", periodo || "90");
  if (clienteId) params.set("cliente", String(clienteId));
  return `/api/reportes/csv?${params.toString()}`;
}

export async function loadReporte(periodoRaw?: string | null, clienteRaw?: string | null): Promise<Reporte> {
  const rango = rangoPeriodo(parsePeriodo(periodoRaw));
  const clienteId = Number(clienteRaw);
  const filtroCliente = Number.isInteger(clienteId) && clienteId > 0 ? clienteId : null;
  const now = new Date();
  const hoy = startOfDay(now);
  const en30 = endOfDay(addDays(hoy, 30));

  const fetchFrom = rango.prevStart ?? rango.start;

  const ticketWhere = {
    ...(filtroCliente ? { instalacion: { idCliente: filtroCliente } } : {}),
    ...(fetchFrom
      ? {
          OR: [
            { solicitado: { gte: fetchFrom, lte: rango.end } },
            { arreglado: { gte: fetchFrom, lte: rango.end } },
          ],
        }
      : {}),
  };

  const [tickets, backlogRows, unidades, stock, alquileresRows, clientes] = await Promise.all([
    prismaPg.clienteMantenimiento.findMany({
      where: ticketWhere,
      select: {
        id: true,
        tipo: true,
        estado: true,
        descripcion: true,
        solicitado: true,
        arreglado: true,
        asignadoA: true,
        empresaTemp: true,
        instalacion: {
          select: {
            id: true,
            idCliente: true,
            numeroSerie: true,
            sitio: true,
            maquina: { select: { marca: true, modelo: true } },
          },
        },
      },
    }),
    prismaPg.clienteMantenimiento.findMany({
      where: {
        estado: { in: ["abierto", "en_curso"] },
        ...(filtroCliente ? { instalacion: { idCliente: filtroCliente } } : {}),
      },
      select: {
        id: true,
        tipo: true,
        estado: true,
        descripcion: true,
        solicitado: true,
        asignadoA: true,
        empresaTemp: true,
        instalacion: {
          select: {
            id: true,
            idCliente: true,
            numeroSerie: true,
            maquina: { select: { marca: true, modelo: true } },
          },
        },
      },
      orderBy: { solicitado: "asc" },
    }),
    prismaPg.clienteMaquina.findMany({
      where: {
        liberadaEn: null,
        ...(filtroCliente ? { idCliente: filtroCliente } : {}),
      },
      select: {
        id: true,
        modalidad: true,
        idCliente: true,
        maquina: { select: { marca: true } },
        mantenimientos: {
          where: { estado: { in: ["abierto", "en_curso"] } },
          select: { estado: true },
        },
      },
    }),
    filtroCliente
      ? Promise.resolve([])
      : prismaPg.maquinaStock.findMany({
          select: {
            estado: true,
            precio: true,
            valorFo: true,
          },
        }),
    prismaPg.maquinaAlquiler.findMany({
      where: {
        fechaFin: { lte: en30 },
        instalacion: {
          liberadaEn: null,
          modalidad: "alquiler",
          ...(filtroCliente ? { idCliente: filtroCliente } : {}),
        },
      },
      select: {
        id: true,
        fechaFin: true,
        instalacion: {
          select: {
            id: true,
            idCliente: true,
            numeroSerie: true,
            maquina: { select: { marca: true, modelo: true } },
          },
        },
      },
      orderBy: { fechaFin: "asc" },
    }),
    listClientes(),
  ]);

  const ids = [
    ...tickets.map((t) => t.instalacion?.idCliente),
    ...backlogRows.map((t) => t.instalacion?.idCliente),
    ...alquileresRows.map((a) => a.instalacion.idCliente),
    ...unidades.map((u) => u.idCliente),
  ].filter((id): id is number => id != null);
  const clientesMap = await getClientesMap(ids);

  const { start, end, prevStart, prevEnd } = rango;
  const delPeriodo = tickets.filter((t) => inRange(t.solicitado, start, end));
  const delPrev =
    prevStart && prevEnd
      ? tickets.filter((t) => inRange(t.solicitado, prevStart, prevEnd))
      : null;

  const cerradosPeriodo = tickets.filter(
    (t) => t.estado === "cerrado" && t.arreglado && inRange(t.arreglado, start, end)
  );
  const cerradosPrev =
    prevStart && prevEnd
      ? tickets.filter(
          (t) =>
            t.estado === "cerrado" &&
            t.arreglado &&
            inRange(t.arreglado, prevStart, prevEnd)
        )
      : null;

  const dias = (rows: { solicitado: Date; arreglado: Date | null }[]) =>
    rows
      .map((t) => daysBetween(t.solicitado, t.arreglado))
      .filter((n): n is number => n != null);

  const ingresados = delPeriodo.length;
  const cerrados = cerradosPeriodo.length;
  const tiempoMedio = avg(dias(cerradosPeriodo));
  const tiempoMedioPrev = cerradosPrev ? avg(dias(cerradosPrev)) : null;

  const spanDays =
    rango.start == null
      ? 400
      : Math.round((rango.end.getTime() - rango.start.getTime()) / 86400000);
  const monthly = spanDays > 45;
  const desdeTrend =
    rango.start ??
    tickets.reduce<Date | null>((min, t) => {
      if (!min || t.solicitado < min) return t.solicitado;
      return min;
    }, null) ??
    addDays(now, -90);

  const buckets = trendBuckets(startOfDay(desdeTrend), rango.end);
  const weekStarts = monthly
    ? []
    : buckets.map((b) => {
        const [y, m, d] = b.key.split("-").map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      });

  const trendMap = new Map(buckets.map((b) => [b.key, { label: b.label, abiertos: 0, cerrados: 0 }]));
  for (const t of delPeriodo) {
    const key = bucketKey(t.solicitado, monthly, weekStarts);
    const slot = trendMap.get(key);
    if (slot) slot.abiertos += 1;
  }
  for (const t of cerradosPeriodo) {
    if (!t.arreglado) continue;
    const key = bucketKey(t.arreglado, monthly, weekStarts);
    const slot = trendMap.get(key);
    if (slot) slot.cerrados += 1;
  }

  const countBy = (rows: { key: string }[]) => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.key, (map.get(row.key) || 0) + 1);
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const porTipo = countBy(delPeriodo.map((t) => ({ key: t.tipo || "Otro" }))).slice(0, 8);
  const porTecnico = countBy(
    delPeriodo.map((t) => ({ key: t.asignadoA?.trim() || "Sin asignar" }))
  ).slice(0, 6);
  const porMarca = countBy(
    delPeriodo.map((t) => ({ key: t.instalacion?.maquina.marca?.trim() || "Sin equipo" }))
  ).slice(0, 6);

  const estados = ["abierto", "en_curso", "cerrado", "cancelado"] as const;
  const porEstado = estados.map((estado) => ({
    estado,
    value: delPeriodo.filter((t) => t.estado === estado).length,
  }));

  const porCliente = new Map<
    number,
    { total: number; abiertos: number; cerrados: number; dias: number[] }
  >();
  for (const t of delPeriodo) {
    const id = t.instalacion?.idCliente;
    if (id == null) continue;
    const row = porCliente.get(id) ?? { total: 0, abiertos: 0, cerrados: 0, dias: [] };
    row.total += 1;
    if (t.estado === "abierto" || t.estado === "en_curso") row.abiertos += 1;
    if (t.estado === "cerrado") {
      row.cerrados += 1;
      const d = daysBetween(t.solicitado, t.arreglado);
      if (d != null) row.dias.push(d);
    }
    porCliente.set(id, row);
  }

  const topClientes = [...porCliente.entries()]
    .map(([id, row]) => ({
      id,
      label: clienteLabel(clientesMap.get(id)),
      total: row.total,
      abiertos: row.abiertos,
      cerrados: row.cerrados,
      dias: avg(row.dias),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const aging = backlogRows.slice(0, 8).map((t) => ({
    id: t.id,
    titulo: t.descripcion?.trim().slice(0, 72) || t.tipo,
    cliente: t.instalacion
      ? clienteLabel(clientesMap.get(t.instalacion.idCliente))
      : t.empresaTemp?.trim() || "Empresa provisional",
    equipo: t.instalacion ? machineName(t.instalacion) : "Sin equipo",
    tipo: t.tipo,
    estado: t.estado,
    dias: daysBetween(t.solicitado, now) ?? 0,
    asignado: t.asignadoA?.trim() || "Sin asignar",
  }));

  const estadosFlota = unidades.map((u) => equipoEstado(u.mantenimientos));
  const operativas = estadosFlota.filter((e) => e === "operativa").length;
  const pendientes = estadosFlota.filter((e) => e === "proximo").length;
  const enReparacion = estadosFlota.filter((e) => e === "fuera").length;
  const flota = unidades.length;
  const disponibilidad = flota ? Math.round((operativas / flota) * 100) : 0;

  const stockDisponible = stock.filter((s) => s.estado === "disponible").length;
  const stockAsignado = stock.filter((s) => s.estado === "asignado").length;
  const valorDeposito = moneySum(
    stock.filter((s) => s.estado === "disponible").map((s) => s.valorFo).filter((v): v is NonNullable<typeof v> => v != null)
  );

  const alquileres = alquileresRows.map((a) => {
    const y = a.fechaFin.getUTCFullYear();
    const m = String(a.fechaFin.getUTCMonth() + 1).padStart(2, "0");
    const d = String(a.fechaFin.getUTCDate()).padStart(2, "0");
    const fin = `${y}-${m}-${d}`;
    return {
      id: a.id,
      cliente: clienteLabel(clientesMap.get(a.instalacion.idCliente)),
      equipo: machineName(a.instalacion),
      serie: a.instalacion.numeroSerie,
      fin,
      dias: daysUntil(fin),
      href: `/maquinas/${a.instalacion.id}`,
    };
  });

  const clienteNombre = filtroCliente
    ? clienteLabel(clientes.find((c) => c.id === filtroCliente) ?? clientesMap.get(filtroCliente))
    : null;

  return {
    rango,
    clienteId: filtroCliente,
    clienteNombre: clienteNombre === "—" ? null : clienteNombre,
    clientes: clientes
      .filter((c) => c.activo === 1 || c.activo == null)
      .map((c) => ({ id: c.id, label: clienteLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")),
    ingresados,
    ingresadosPrev: delPrev ? delPrev.length : null,
    cerrados,
    cerradosPrev: cerradosPrev ? cerradosPrev.length : null,
    tiempoMedio,
    tiempoMedioPrev,
    tasaCierre: ingresados ? Math.round((cerrados / ingresados) * 100) : null,
    backlog: backlogRows.filter((t) => t.estado === "abierto").length,
    enCurso: backlogRows.filter((t) => t.estado === "en_curso").length,
    disponibilidad,
    operativas,
    pendientes,
    enReparacion,
    flota,
    venta: unidades.filter((u) => u.modalidad !== "alquiler").length,
    alquiler: unidades.filter((u) => u.modalidad === "alquiler").length,
    stockDisponible,
    stockAsignado,
    valorDeposito,
    alquileresPorVencer: alquileres.filter((a) => a.dias != null && a.dias >= 0).length,
    alquileresVencidos: alquileres.filter((a) => a.dias != null && a.dias < 0).length,
    trend: buckets.map((b) => trendMap.get(b.key)!),
    porTipo,
    porTecnico,
    porMarca,
    porEstado,
    topClientes,
    aging,
    alquileres: alquileres.slice(0, 8),
  };
}
