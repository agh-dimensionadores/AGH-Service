import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  PageHeader,
  PrimaryLink,
  estadoTone,
} from "@/components/ui";
import {formatDate, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHistorialPage() {
  const session = await requireCliente();
  const items = await prisma.mantenimiento.findMany({
    where: { maquina: { clienteId: session.clienteId! } },
    orderBy: { fecha: "desc" },
    include: { maquina: { include: { catalogo: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Historial de reparaciones"
        description="Todos los trabajos realizados sobre tus equipos."
        action={<PrimaryLink href="/portal/soporte/nuevo">Solicitar soporte</PrimaryLink>}
      />

      {items.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          Todavía no hay historial disponible.
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
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/portal/maquinas/${item.maquinaId}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {item.titulo}
                    </Link>
                    <p className="text-[var(--ink-muted)]">{item.tipo}</p>
                  </td>
                  <td>
                    {machineName(item.maquina)}
                  </td>
                  <td>{formatDate(item.fecha)}</td>
                  <td>
                    <Badge tone={estadoTone(item.estado)}>
                      {labelEstado(item.estado)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
