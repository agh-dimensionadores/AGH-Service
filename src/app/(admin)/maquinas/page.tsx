import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { catalogImageUrl } from "@/lib/uploads";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
} from "@/components/ui";
import {
  equipoEstado,
  labelEstado,
  machineName,
  machineThumbStyle,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaquinasPage() {
  const [catalogo, unidades] = await Promise.all([
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
        imagenMime: true,
        imagenUpdatedAt: true,
        _count: { select: { instalaciones: true } },
      },
    }),
    prismaPg.clienteMaquina.findMany({
      orderBy: { fechaCreacion: "desc" },
      include: {
        maquina: {
          select: {
            idmachine: true,
            marca: true,
            modelo: true,
            imagenMime: true,
            imagenUpdatedAt: true,
          },
        },
        mantenimientos: { select: { estado: true } },
        _count: { select: { mantenimientos: true } },
      },
    }),
  ]);

  const clientesMap = await getClientesMap(unidades.map((u) => u.idCliente));

  return (
    <div>
      <PageHeader
        title="Máquinas"
        description="Catálogo en PostgreSQL (tabla maquinas) y unidades asignadas (clientes_maquinas)."
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
            description="Primero agregá una máquina con marca y modelo."
            action={<PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catalogo.map((item) => (
              <Link
                key={item.idmachine}
                href={`/maquinas/catalogo/${item.idmachine}`}
                className="card overflow-hidden transition hover:border-[rgba(182,255,59,0.35)]"
              >
                {item.imagenMime ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={catalogImageUrl(item.idmachine, item.imagenUpdatedAt)}
                    alt={`${item.marca} ${item.modelo ?? ""}`}
                    className="machine-thumb rounded-none object-cover"
                  />
                ) : (
                  <div
                    className="machine-thumb rounded-none"
                    style={machineThumbStyle(item.modelo ?? item.marca)}
                  />
                )}
                <div className="p-3">
                  <p className="font-medium text-white">
                    {item.marca} {item.modelo}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {item._count.instalaciones} asignada
                    {item._count.instalaciones === 1 ? "" : "s"}
                    {!item.imagenMime ? " · sin foto" : ""}
                  </p>
                  <p className="mt-2 text-xs text-[var(--accent)]">
                    Editar / agregar foto
                  </p>
                </div>
              </Link>
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

        {unidades.length === 0 ? (
          <EmptyState
            title="Nadie tiene equipos asignados"
            description="Elegí un modelo del catálogo y asignalo a un cliente con nro. de serie y sitio."
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
                {unidades.map((unidad) => {
                  const estado = equipoEstado(unidad.mantenimientos);
                  return (
                    <tr key={unidad.id}>
                      <td>
                        <Link
                          href={`/maquinas/${unidad.id}`}
                          className="font-medium text-[var(--accent)] hover:underline"
                        >
                          {machineName(unidad)}
                        </Link>
                        {unidad.sitio ? (
                          <p className="text-[var(--ink-muted)]">{unidad.sitio}</p>
                        ) : null}
                      </td>
                      <td className="font-mono text-xs text-[var(--ink-muted)]">
                        {unidad.numeroSerie}
                      </td>
                      <td className="hidden md:table-cell">
                        <Link
                          href={`/clientes/${unidad.idCliente}`}
                          className="hover:text-[var(--accent)]"
                        >
                          {clienteLabel(clientesMap.get(unidad.idCliente))}
                        </Link>
                      </td>
                      <td>
                        <Badge tone={estadoTone(estado)}>
                          {labelEstado(estado)}
                        </Badge>
                      </td>
                      <td>{unidad._count.mantenimientos}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
