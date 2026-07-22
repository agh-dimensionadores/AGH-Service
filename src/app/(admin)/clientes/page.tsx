import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  EmptyState,
  PageHeader,
  PrimaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { maquinas: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Operadores logísticos con equipos AGH instalados."
        action={<PrimaryLink href="/clientes/nuevo">Nuevo cliente</PrimaryLink>}
      />

      {clientes.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description="Registrá el primer cliente para asociar máquinas."
          action={<PrimaryLink href="/clientes/nuevo">Agregar cliente</PrimaryLink>}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="hidden sm:table-cell">Contacto</th>
                <th>Máquinas</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {cliente.empresa || cliente.nombre}
                    </Link>
                    {cliente.empresa ? (
                      <p className="text-[var(--ink-muted)]">{cliente.nombre}</p>
                    ) : null}
                  </td>
                  <td className="hidden text-[var(--ink-muted)] sm:table-cell">
                    <p>{cliente.telefono || "—"}</p>
                    <p>{cliente.email || "—"}</p>
                  </td>
                  <td>{cliente._count.maquinas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
