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

const MARCAS = ["AGH", "CUBISCAN", "Conlida"] as const;

function normalizeMarca(value: string) {
  return value.trim().toLowerCase();
}

function chipClass(active: boolean) {
  return active
    ? "rounded-lg border border-[var(--accent)] bg-[rgba(182,255,59,0.12)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
    : "rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] hover:border-[rgba(182,255,59,0.35)] hover:text-white";
}

export default async function MaquinasPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; vista?: string }>;
}) {
  const { marca: marcaParam, vista: vistaParam } = await searchParams;
  const marcaActiva = MARCAS.find(
    (m) => normalizeMarca(m) === normalizeMarca(marcaParam ?? "")
  );
  const verTodas = vistaParam === "todas" || Boolean(marcaActiva);
  const verFavoritas = !verTodas;

  const [catalogoAll, unidadesAll] = await Promise.all([
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
        imagenMime: true,
        imagenUpdatedAt: true,
        favorito: true,
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
            favorito: true,
          },
        },
        mantenimientos: { select: { estado: true } },
        _count: { select: { mantenimientos: true } },
      },
    }),
  ]);

  const hayFavoritos = catalogoAll.some((item) => item.favorito);

  let catalogo = catalogoAll;
  let unidades = unidadesAll;

  if (marcaActiva) {
    catalogo = catalogoAll.filter(
      (item) => normalizeMarca(item.marca) === normalizeMarca(marcaActiva)
    );
    unidades = unidadesAll.filter(
      (u) => normalizeMarca(u.maquina.marca) === normalizeMarca(marcaActiva)
    );
  } else if (verFavoritas && hayFavoritos) {
    catalogo = catalogoAll.filter((item) => item.favorito);
    const favIds = new Set(catalogo.map((c) => c.idmachine));
    unidades = unidadesAll.filter((u) => favIds.has(u.idMaquina));
  }

  const clientesMap = await getClientesMap(unidades.map((u) => u.idCliente));

  return (
    <div>
      <PageHeader
        title="Máquinas"
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>
            <SecondaryLink href="/maquinas/asignar">Asignar</SecondaryLink>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--ink-muted)]">
          Ver
        </span>
        <Link href="/maquinas" className={chipClass(verFavoritas)}>
          Favoritas
        </Link>
        <Link href="/maquinas?vista=todas" className={chipClass(vistaParam === "todas")}>
          Todas
        </Link>
        <span className="mx-1 text-[var(--ink-muted)]">·</span>
        <span className="text-sm font-medium text-[var(--ink-muted)]">
          Marca
        </span>
        {MARCAS.map((marca) => (
          <Link
            key={marca}
            href={`/maquinas?marca=${encodeURIComponent(marca)}`}
            className={chipClass(marcaActiva === marca)}
          >
            {marca}
          </Link>
        ))}
      </div>

      {verFavoritas && !hayFavoritos ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Todavía no marcaste favoritos. Se muestran todas. Elegilas en{" "}
          <Link href="/configuracion" className="text-[var(--accent)] hover:underline">
            Configuración
          </Link>
          .
        </p>
      ) : null}

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
            title={
              marcaActiva
                ? `Sin modelos ${marcaActiva}`
                : verFavoritas
                  ? "Sin favoritos"
                  : "Sin modelos en el catálogo"
            }
            description={
              marcaActiva
                ? "No hay máquinas de esta marca en el catálogo."
                : verFavoritas
                  ? "Marcá los modelos que más usás en Configuración."
                  : "Primero agregá una máquina con marca y modelo."
            }
            action={
              verFavoritas && !marcaActiva ? (
                <PrimaryLink href="/configuracion">Ir a Configuración</PrimaryLink>
              ) : (
                <PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>
              )
            }
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
                    Editar
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
            title={
              marcaActiva
                ? `Sin equipos ${marcaActiva} asignados`
                : verFavoritas && hayFavoritos
                  ? "Sin equipos de favoritos asignados"
                  : "Nadie tiene equipos asignados"
            }
            description={
              marcaActiva
                ? "No hay unidades de esta marca asignadas a clientes."
                : "Elegí un modelo del catálogo y asignalo a un cliente con nro. de serie y sitio."
            }
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
