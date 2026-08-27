import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { Badge, PageHeader, estadoTone } from "@/components/ui";
import {
  formatDateTime,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const actividad = await prismaPg.clienteMantenimiento.findMany({
    orderBy: { solicitado: "desc" },
    take: 40,
    include: { instalacion: { include: { maquina: true } } },
  });
  const clientesMap = await getClientesMap(
    actividad.map((item) => item.instalacion.idCliente)
  );

  return (
    <div>
      <PageHeader
        title="Historial"
        description="Expediente cronológico desde clientes_mantenimientos."
      />
      <div className="card p-5">
        <ol className="relative space-y-0 border-l border-[var(--line)] pl-6">
          {actividad.map((item) => (
            <li key={item.id} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/mantenimientos/${item.id}`}
                  className="font-medium text-white hover:text-[var(--accent)]"
                >
                  {mantenimientoTitulo(item)}
                </Link>
                <Badge tone={estadoTone(item.estado)}>
                  {labelEstado(item.estado)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {machineName(item.instalacion)} ·{" "}
                {clienteLabel(clientesMap.get(item.instalacion.idCliente))} ·{" "}
                {formatDateTime(item.solicitado)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
