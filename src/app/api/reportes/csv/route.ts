import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import { clienteLabel, getClientesMap } from "@/lib/clientes";
import { parsePeriodo, rangoPeriodo } from "@/lib/reportes";
import { daysBetween, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function formatIso(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "admin") {
    return new Response("No autorizado", { status: 401 });
  }

  const periodo = parsePeriodo(req.nextUrl.searchParams.get("periodo"));
  const rango = rangoPeriodo(periodo);
  const clienteRaw = Number(req.nextUrl.searchParams.get("cliente"));
  const clienteId = Number.isInteger(clienteRaw) && clienteRaw > 0 ? clienteRaw : null;

  const tickets = await prismaPg.clienteMantenimiento.findMany({
    where: {
      ...(clienteId ? { instalacion: { idCliente: clienteId } } : {}),
      ...(rango.start
        ? {
            OR: [
              { solicitado: { gte: rango.start, lte: rango.end } },
              { arreglado: { gte: rango.start, lte: rango.end } },
            ],
          }
        : {}),
    },
    orderBy: { solicitado: "desc" },
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
          idCliente: true,
          numeroSerie: true,
          sitio: true,
          maquina: { select: { marca: true, modelo: true } },
        },
      },
    },
  });

  const clientesMap = await getClientesMap(
    tickets.map((t) => t.instalacion?.idCliente).filter((id): id is number => id != null)
  );

  const header = [
    "id",
    "solicitado",
    "cerrado",
    "dias",
    "tipo",
    "estado",
    "cliente",
    "equipo",
    "serie",
    "sitio",
    "asignado",
    "descripcion",
  ];

  const lines = tickets.map((t) =>
    [
      t.id,
      formatIso(t.solicitado),
      formatIso(t.arreglado),
      daysBetween(t.solicitado, t.arreglado) ?? "",
      t.tipo,
      labelEstado(t.estado),
      t.instalacion
        ? clienteLabel(clientesMap.get(t.instalacion.idCliente))
        : t.empresaTemp || "",
      t.instalacion ? machineName(t.instalacion) : "",
      t.instalacion?.numeroSerie || "",
      t.instalacion?.sitio || "",
      t.asignadoA || "",
      t.descripcion || "",
    ]
      .map(csvCell)
      .join(",")
  );

  const body = `\uFEFF${[header.join(","), ...lines].join("\n")}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agh-reportes-${periodo}.csv"`,
    },
  });
}
