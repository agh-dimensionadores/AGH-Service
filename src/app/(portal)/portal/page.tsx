import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import { Badge, PageHeader, PrimaryLink, estadoTone } from "@/components/ui";
import {
  equipoEstado,
  labelEstado,
  machineThumbStyle,
  machineName,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await requireCliente();
  const unidades = await prismaPg.clienteMaquina.findMany({
    where: { idCliente: session.clienteId! },
    orderBy: { fechaCreacion: "desc" },
    include: {
      maquina: true,
      mantenimientos: { select: { estado: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title={`Hola, ${session.nombre}`}
        description="Acá ves solo tus equipos, el historial de reparaciones y podés pedir soporte técnico."
        action={<PrimaryLink href="/portal/soporte/nuevo">Solicitar soporte</PrimaryLink>}
      />

      {unidades.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          Todavía no hay máquinas asociadas a tu cuenta.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unidades.map((unidad) => {
            const estado = equipoEstado(unidad.mantenimientos);
            return (
              <Link
                key={unidad.id}
                href={`/portal/maquinas/${unidad.id}`}
                className="card overflow-hidden transition hover:border-[rgba(182,255,59,0.35)]"
              >
                <div
                  className="machine-thumb rounded-none"
                  style={machineThumbStyle(
                    unidad.maquina.modelo ?? unidad.maquina.marca
                  )}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">
                        {machineName(unidad)}
                      </p>
                      <p className="font-mono text-xs text-[var(--ink-muted)]">
                        {unidad.numeroSerie}
                      </p>
                    </div>
                    <Badge tone={estadoTone(estado)}>
                      {labelEstado(estado)}
                    </Badge>
                  </div>
                  {unidad.sitio ? (
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      {unidad.sitio}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
