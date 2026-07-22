import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, PageHeader, estadoTone } from "@/components/ui";
import {formatDateTime, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const actividad = await prisma.mantenimiento.findMany({
    orderBy: { creadoEn: "desc" },
    take: 40,
    include: { maquina: { include: { cliente: true, catalogo: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Historial"
        description="Expediente cronológico de actividad sobre la flota."
      />
      <div className="card p-5">
        <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
          {actividad.map((item) => (
            <li key={item.id} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[0.33rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/mantenimientos/${item.id}`}
                  className="font-medium text-white hover:text-[var(--accent)]"
                >
                  {item.titulo}
                </Link>
                <Badge tone={estadoTone(item.estado)}>
                  {labelEstado(item.estado)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {machineName(item.maquina)} ·{" "}
                {item.maquina.cliente.empresa || item.maquina.cliente.nombre} ·{" "}
                {formatDateTime(item.creadoEn)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
