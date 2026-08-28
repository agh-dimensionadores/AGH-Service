import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import {
  Badge,
  PageHeader,
  PrimaryLink,
  estadoTone,
} from "@/components/ui";
import { planillaKind } from "@/lib/planilla-template";
import {
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const session = await requireCliente();
  const { ok } = await searchParams;
  const items = await prismaPg.clienteMantenimiento.findMany({
    where: { instalacion: { idCliente: session.clienteId! } },
    orderBy: { solicitado: "desc" },
    include: {
      instalacion: { include: { maquina: true } },
      ordenCubiscan: { select: { emailEnviadoEn: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Historial de arreglos"
        description="Solicitudes y trabajos sobre tus equipos."
        action={<PrimaryLink href="/portal/solicitar">Solicitar arreglo</PrimaryLink>}
      />

      {ok ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Solicitud enviada. El equipo de AGH la va a revisar.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          Todavía no hay historial.{" "}
          <Link href="/portal/solicitar" className="text-[var(--accent)] underline">
            Pedí el primer arreglo
          </Link>
          .
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trabajo</th>
                <th>Máquina</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const kind = planillaKind(
                  item.instalacion.maquina.marca,
                  item.instalacion.maquina.modelo
                );
                const puedeEncuesta =
                  item.estado === "cerrado" &&
                  Boolean(kind) &&
                  Boolean(item.ordenCubiscan) &&
                  !item.ordenCubiscan?.emailEnviadoEn;

                return (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/portal/maquinas/${item.idClienteMaquina}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {mantenimientoTitulo(item)}
                    </Link>
                    <p className="text-[var(--ink-muted)]">{item.tipo}</p>
                    {puedeEncuesta ? (
                      <Link
                        href={`/portal/mantenimientos/${item.id}/encuesta`}
                        className="mt-1 inline-block text-xs text-[var(--accent)] underline"
                      >
                        Calificar servicio
                      </Link>
                    ) : null}
                  </td>
                  <td>{machineName(item.instalacion)}</td>
                  <td>{formatDate(item.solicitado)}</td>
                  <td>
                    <Badge tone={estadoTone(item.estado)}>
                      {labelEstado(item.estado)}
                    </Badge>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
