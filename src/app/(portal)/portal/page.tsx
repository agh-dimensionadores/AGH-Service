import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, PageHeader, PrimaryLink, estadoTone } from "@/components/ui";
import {labelEstado, machineThumbStyle, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await requireCliente();
  const maquinas = await prisma.maquina.findMany({
    where: { clienteId: session.clienteId! },
    orderBy: { creadoEn: "desc" },
    include: { catalogo: true },
  });

  return (
    <div>
      <PageHeader
        title={`Hola, ${session.nombre}`}
        description="Acá ves solo tus equipos, el historial de reparaciones y podés pedir soporte técnico."
        action={<PrimaryLink href="/portal/soporte/nuevo">Solicitar soporte</PrimaryLink>}
      />

      {maquinas.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          Todavía no hay máquinas asociadas a tu cuenta.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maquinas.map((maquina) => (
            <Link
              key={maquina.id}
              href={`/portal/maquinas/${maquina.id}`}
              className="card overflow-hidden transition hover:border-[rgba(182,255,59,0.35)]"
            >
              <div
                className="machine-thumb rounded-none"
                style={maquina.catalogo?.imagen ? { backgroundImage: `url(${maquina.catalogo.imagen})` } : machineThumbStyle(maquina.catalogo.nombre)}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">
                      {machineName(maquina)}
                    </p>
                    <p className="font-mono text-xs text-[var(--ink-muted)]">
                      {maquina.numeroSerie}
                    </p>
                  </div>
                  <Badge tone={estadoTone(maquina.estadoEquipo)}>
                    {labelEstado(maquina.estadoEquipo)}
                  </Badge>
                </div>
                {maquina.ubicacion ? (
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {maquina.ubicacion}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
