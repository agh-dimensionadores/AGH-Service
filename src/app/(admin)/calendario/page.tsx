import { CalendarioMensual, type CalendarioItem } from "@/components/calendario-mensual";
import { PageHeader, Panel } from "@/components/ui";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { prismaPg } from "@/lib/prisma";
import { machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function currentMes() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function parseMes(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return currentMes();
}

function parseDia(value: string | undefined, mes: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value.startsWith(mes)) {
    return value;
  }
  return null;
}

function monthBounds(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

function toItem(
  item: {
    id: number;
    tipo: string;
    estado: string;
    descripcion: string | null;
    programado: Date | null;
    asignadoA: string | null;
    empresaTemp: string | null;
    instalacion: {
      id: number;
      sitio: string | null;
      idCliente: number;
      maquina: { marca: string; modelo: string | null };
    } | null;
  },
  clientesMap: Awaited<ReturnType<typeof getClientesMap>>
): CalendarioItem {
  if (!item.instalacion) {
    return {
      id: item.id,
      tipo: item.tipo,
      estado: item.estado,
      descripcion: item.descripcion,
      programado: item.programado ? item.programado.toISOString() : null,
      asignadoA: item.asignadoA,
      machineLabel: "Sin equipo",
      clienteLabel: item.empresaTemp?.trim() || "Empresa provisional",
      sitio: null,
      href: `/mantenimientos/${item.id}`,
      sinCliente: true,
    };
  }

  return {
    id: item.id,
    tipo: item.tipo,
    estado: item.estado,
    descripcion: item.descripcion,
    programado: item.programado ? item.programado.toISOString() : null,
    asignadoA: item.asignadoA,
    machineLabel: machineName(item.instalacion),
    clienteLabel: clienteLabel(clientesMap.get(item.instalacion.idCliente)),
    sitio: item.instalacion.sitio,
    href: `/mantenimientos/${item.id}`,
    sinCliente: false,
  };
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  const sp = await searchParams;
  const mes = parseMes(sp.mes);
  const dia = parseDia(sp.dia, mes);
  const { start, end } = monthBounds(mes);

  const include = {
    instalacion: { include: { maquina: true } },
  } as const;

  const [programadosRaw, pendientesRaw] = await Promise.all([
    prismaPg.clienteMantenimiento.findMany({
      where: {
        programado: { gte: start, lt: end },
      },
      orderBy: { programado: "asc" },
      include,
    }),
    prismaPg.clienteMantenimiento.findMany({
      where: {
        estado: { in: ["abierto", "en_curso"] },
        programado: null,
      },
      orderBy: { solicitado: "asc" },
      include,
    }),
  ]);

  const clientesMap = await getClientesMap([
    ...programadosRaw
      .map((i) => i.instalacion?.idCliente)
      .filter((id): id is number => id != null),
    ...pendientesRaw
      .map((i) => i.instalacion?.idCliente)
      .filter((id): id is number => id != null),
  ]);

  const programados = programadosRaw.map((i) => toItem(i, clientesMap));
  const pendientes = pendientesRaw.map((i) => toItem(i, clientesMap));

  return (
    <div>
      <PageHeader
        title="Calendario"
        description="Organizá visitas, instalaciones y reuniones. Podés agendar con un nombre de empresa provisional si el cliente aún no está cargado."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Panel className="!p-4">
          <p className="text-xs text-[var(--ink-muted)]">Este mes</p>
          <p className="brand-font text-2xl font-semibold text-white">
            {programados.length}
          </p>
        </Panel>
        <Panel className="!p-4">
          <p className="text-xs text-[var(--ink-muted)]">Sin programar</p>
          <p className="brand-font text-2xl font-semibold text-white">
            {pendientes.length}
          </p>
        </Panel>
        <Panel className="!p-4">
          <p className="text-xs text-[var(--ink-muted)]">Cómo usarlo</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Clic en un día → agendá una reunión/instalación o asigná un pendiente.
          </p>
        </Panel>
      </div>

      <CalendarioMensual
        mes={mes}
        diaInicial={dia}
        programados={programados}
        pendientes={pendientes}
      />
    </div>
  );
}
