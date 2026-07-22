import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  estadoTone,
} from "@/components/ui";
import {formatDate, formatMoney, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MantenimientosPage() {
  const items = await prisma.mantenimiento.findMany({
    orderBy: { fecha: "desc" },
    include: { maquina: { include: { cliente: true, catalogo: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Mantenimientos"
        description="Agenda y expediente de trabajos sobre la flota."
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
                <th>Fecha</th>
                <th className="hidden sm:table-cell">Costo</th>
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
                      {item.titulo}
                    </Link>
                    <p className="text-[var(--ink-muted)]">{item.tipo}</p>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link
                      href={`/maquinas/${item.maquinaId}`}
                      className="hover:text-[var(--accent)]"
                    >
                      {machineName(item.maquina)}
                    </Link>
                    <p className="text-[var(--ink-muted)]">
                      {item.maquina.cliente.empresa || item.maquina.cliente.nombre}
                    </p>
                  </td>
                  <td>{formatDate(item.fecha)}</td>
                  <td className="hidden sm:table-cell">{formatMoney(item.costo)}</td>
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
