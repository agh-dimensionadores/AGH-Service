import { notFound } from "next/navigation";
import { requireCliente } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import {
  Badge,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
} from "@/components/ui";
import {
  equipoEstado,
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalMaquinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCliente();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const unidad = await prismaPg.clienteMaquina.findFirst({
    where: { id, idCliente: session.clienteId! },
    include: {
      maquina: true,
      mantenimientos: { orderBy: { solicitado: "desc" } },
    },
  });

  if (!unidad) notFound();

  const estado = equipoEstado(unidad.mantenimientos);

  return (
    <div>
      <PageHeader
        title={machineName(unidad)}
        description={`Nro. serie ${unidad.numeroSerie}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/portal">Volver</SecondaryLink>
            <PrimaryLink href={`/portal/solicitar?maquinaId=${unidad.id}`}>
              Solicitar arreglo
            </PrimaryLink>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Datos de la máquina
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Estado</dt>
              <dd>
                <Badge tone={estadoTone(estado)}>{labelEstado(estado)}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Marca</dt>
              <dd className="text-white">{unidad.maquina.marca}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Modelo</dt>
              <dd className="text-white">{unidad.maquina.modelo || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">ID Voxel Cam</dt>
              <dd className="font-mono text-[var(--accent)]">{unidad.id}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Nro. de serie</dt>
              <dd className="font-mono text-white">{unidad.numeroSerie}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Sitio</dt>
              <dd className="text-white">{unidad.sitio || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Fecha de compra</dt>
              <dd className="mt-1 text-white">
                {formatDate(unidad.fechaCompra)}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Historial de reparaciones
          </h3>
          {unidad.mantenimientos.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              Todavía no hay trabajos registrados en esta máquina.
            </p>
          ) : (
            <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
              {unidad.mantenimientos.map((item) => (
                <li key={item.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">
                      {mantenimientoTitulo(item)}
                    </p>
                    <Badge tone={estadoTone(item.estado)}>
                      {labelEstado(item.estado)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {item.tipo} · {formatDate(item.solicitado)}
                    {item.arreglado
                      ? ` · Arreglado ${formatDate(item.arreglado)}`
                      : ""}
                  </p>
                  {item.descripcion ? (
                    <p className="mt-2 text-sm leading-relaxed text-[#d8e0da]">
                      {item.descripcion}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
