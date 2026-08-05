import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  estadoTone,
} from "@/components/ui";
import {
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MantenimientosPage() {
  const items = await prismaPg.clienteMantenimiento.findMany({
    orderBy: { solicitado: "desc" },
    include: {
      instalacion: { include: { maquina: true } },
    },
  });
  const clientesMap = await getClientesMap(
    items.map((i) => i.instalacion.idCliente)
  );

  return (
    <div>
      <PageHeader
        title="Mantenimientos"
        description="Trabajos en PostgreSQL · tabla clientes_mantenimientos."
        action={
          <PrimaryLink href="/mantenimientos/nuevo">Nuevo mantenimiento</PrimaryLink>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Sin trabajos"
          description="Registrá calibraciones, preventivos o correctivos."
          action={
            <PrimaryLink href="/mantenimientos/nuevo">Registrar trabajo</PrimaryLink>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trabajo</th>
                <th className="hidden md:table-cell">Máquina / Cliente</th>
                <th>Solicitado</th>
                <th className="hidden sm:table-cell">Arreglado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/mantenimientos/${item.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {mantenimientoTitulo(item)}
                    </Link>
                    <p className="text-[var(--ink-muted)]">{item.tipo}</p>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link
                      href={`/maquinas/${item.idClienteMaquina}`}
                      className="hover:text-[var(--accent)]"
                    >
                      {machineName(item.instalacion)}
                    </Link>
                    <p className="text-[var(--ink-muted)]">
                      {clienteLabel(clientesMap.get(item.instalacion.idCliente))}
                    </p>
                  </td>
                  <td>{formatDate(item.solicitado)}</td>
                  <td className="hidden sm:table-cell">
                    {formatDate(item.arreglado)}
                  </td>
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
