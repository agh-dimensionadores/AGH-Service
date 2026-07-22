import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
} from "@/components/ui";
import { labelEstado, machineName, machineThumbStyle } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaquinasPage() {
  const [catalogo, maquinas] = await Promise.all([
    prisma.catalogoMaquina.findMany({
      orderBy: [{ marca: "asc" }, { nombre: "asc" }],
      include: { _count: { select: { maquinas: true } } },
    }),
    prisma.maquina.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: true,
        catalogo: true,
        _count: { select: { mantenimientos: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Máquinas"
        description="Creá modelos en el catálogo y después asignalos a un cliente con nro. de serie."
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>
            <SecondaryLink href="/maquinas/asignar">Asignar</SecondaryLink>
          </div>
        }
      />

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="brand-font text-lg font-semibold text-white">
            Catálogo
          </h3>
          <span className="text-sm text-[var(--ink-muted)]">
            {catalogo.length} modelo{catalogo.length === 1 ? "" : "s"}
          </span>
        </div>

        {catalogo.length === 0 ? (
          <EmptyState
            title="Sin modelos en el catálogo"
            description="Primero agregá una máquina con marca, nombre e imagen."
            action={<PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catalogo.map((item) => (
              <div key={item.id} className="card overflow-hidden">
                {item.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imagen}
                    alt={`${item.marca} ${item.nombre}`}
                    className="machine-thumb rounded-none object-cover"
                  />
                ) : (
                  <div
                    className="machine-thumb rounded-none"
                    style={machineThumbStyle(item.nombre)}
                  />
                )}
                <div className="p-3">
                  <p className="font-medium text-white">
                    {item.marca} {item.nombre}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {item._count.maquinas} asignada
                    {item._count.maquinas === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="brand-font text-lg font-semibold text-white">
            Equipos asignados
          </h3>
          <SecondaryLink href="/maquinas/asignar">Asignar a cliente</SecondaryLink>
        </div>

        {maquinas.length === 0 ? (
          <EmptyState
            title="Nadie tiene equipos asignados"
            description="Elegí un modelo del catálogo y asignalo a un cliente con nro. de serie."
            action={<PrimaryLink href="/maquinas/asignar">Asignar</PrimaryLink>}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Nro. serie</th>
                  <th className="hidden md:table-cell">Cliente</th>
                  <th>Estado</th>
                  <th>Trabajos</th>
                </tr>
              </thead>
              <tbody>
                {maquinas.map((maquina) => (
                  <tr key={maquina.id}>
                    <td>
                      <Link
                        href={`/maquinas/${maquina.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {machineName(maquina)}
                      </Link>
                      {maquina.ubicacion ? (
                        <p className="text-[var(--ink-muted)]">{maquina.ubicacion}</p>
                      ) : null}
                    </td>
                    <td className="font-mono text-xs text-[var(--ink-muted)]">
                      {maquina.numeroSerie}
                    </td>
                    <td className="hidden md:table-cell">
                      <Link
                        href={`/clientes/${maquina.clienteId}`}
                        className="hover:text-[var(--accent)]"
                      >
                        {maquina.cliente.empresa || maquina.cliente.nombre}
                      </Link>
                    </td>
                    <td>
                      <Badge tone={estadoTone(maquina.estadoEquipo)}>
                        {labelEstado(maquina.estadoEquipo)}
                      </Badge>
                    </td>
                    <td>{maquina._count.mantenimientos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
