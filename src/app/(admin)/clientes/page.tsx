import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { listClientes, clienteLabel } from "@/lib/clientes";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listClientes();
  const counts = await prismaPg.clienteMaquina.groupBy({
    by: ["idCliente"],
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.idCliente, c._count._all]));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Datos en tu PostgreSQL · tabla clientes."
        action={<PrimaryLink href="/clientes/nuevo">Nuevo cliente</PrimaryLink>}
      />

      {clientes.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description="Registrá el primer cliente; se guardará en PostgreSQL."
          action={<PrimaryLink href="/clientes/nuevo">Agregar cliente</PrimaryLink>}
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th className="hidden sm:table-cell">Contacto</th>
                <th>Activo</th>
                <th>Máquinas</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="text-[var(--ink-muted)]">{cliente.id}</td>
                  <td>
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {clienteLabel(cliente)}
                    </Link>
                    {cliente.empresa ? (
                      <p className="text-[var(--ink-muted)]">{cliente.nombre}</p>
                    ) : null}
                  </td>
                  <td className="hidden text-[var(--ink-muted)] sm:table-cell">
                    <p>{cliente.email || "—"}</p>
                  </td>
                  <td>
                    <Badge tone={cliente.activo === 1 ? "ok" : "danger"}>
                      {cliente.activo === 1 ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td>{countMap.get(cliente.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
