import { notFound } from "next/navigation";
import { requireCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
} from "@/components/ui";
import {formatDate, formatMoney, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalMaquinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCliente();
  const { id } = await params;

  const maquina = await prisma.maquina.findFirst({
    where: { id, clienteId: session.clienteId! },
    include: {
      catalogo: true,
      mantenimientos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!maquina) notFound();

  return (
    <div>
      <PageHeader
        title={`${machineName(maquina)}`}
        description={`Nro. serie ${maquina.numeroSerie}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/portal">Volver</SecondaryLink>
            <PrimaryLink href={`/portal/soporte/nuevo?maquinaId=${maquina.id}`}>
              Solicitar soporte
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
                <Badge tone={estadoTone(maquina.estadoEquipo)}>
                  {labelEstado(maquina.estadoEquipo)}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Marca</dt>
              <dd className="text-white">{maquina.catalogo.marca}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Modelo</dt>
              <dd className="text-white">{maquina.catalogo.nombre}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Nro. de serie</dt>
              <dd className="font-mono text-white">{maquina.numeroSerie}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
              <dt className="text-[var(--ink-muted)]">Ubicación</dt>
              <dd className="text-white">{maquina.ubicacion || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Descripción</dt>
              <dd className="mt-1 text-white">
                {maquina.descripcion || "Sin descripción"}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Historial de reparaciones
          </h3>
          {maquina.mantenimientos.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              Todavía no hay trabajos registrados en esta máquina.
            </p>
          ) : (
            <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
              {maquina.mantenimientos.map((item) => (
                <li key={item.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[0.33rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{item.titulo}</p>
                    <Badge tone={estadoTone(item.estado)}>
                      {labelEstado(item.estado)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {item.tipo} · {formatDate(item.fecha)}
                    {item.tecnico ? ` · ${item.tecnico}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#d8e0da]">
                    {item.descripcion}
                  </p>
                  {item.piezas ? (
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      Piezas: {item.piezas}
                    </p>
                  ) : null}
                  {item.costo != null ? (
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      Costo: {formatMoney(item.costo)}
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
