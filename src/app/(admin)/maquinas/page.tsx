import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { MachineThumb } from "@/components/machine-thumb";
import { IconSearch } from "@/components/icons";
import { maquinaImageSrc } from "@/lib/maquina-images";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
  inputClass,
} from "@/components/ui";
import {
  equipoEstado,
  labelEstado,
  machineName,
} from "@/lib/utils";
import { marcaUsaStock } from "@/lib/marcas";

export const dynamic = "force-dynamic";

const MARCAS = ["AGH", "CUBISCAN", "Conlida", "Cubetape"] as const;
const PAGE_SIZE = 20;

function normalizeMarca(value: string) {
  return value.trim().toLowerCase();
}

function chipClass(active: boolean) {
  return active
    ? "rounded-lg border border-[var(--accent)] bg-[rgba(182,255,59,0.12)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
    : "rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] hover:border-[rgba(182,255,59,0.35)] hover:text-white";
}

function matchesQ(haystack: string | null | undefined, q: string) {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q.toLowerCase());
}

function maquinasHref(opts: {
  q?: string;
  marca?: string;
  vista?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.marca) params.set("marca", opts.marca);
  if (opts.vista) params.set("vista", opts.vista);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const s = params.toString();
  return s ? `/maquinas?${s}` : "/maquinas";
}

export default async function MaquinasPage({
  searchParams,
}: {
  searchParams: Promise<{
    marca?: string;
    vista?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const {
    marca: marcaParam,
    vista: vistaParam,
    q: qRaw,
    page: pageRaw,
  } = await searchParams;
  const q = (qRaw || "").trim();
  const marcaActiva = MARCAS.find(
    (m) => normalizeMarca(m) === normalizeMarca(marcaParam ?? "")
  );
  // Favoritas solo afecta el catálogo; los equipos asignados se listan todos
  // (salvo filtro de marca / búsqueda).
  const verTodas = vistaParam === "todas" || Boolean(marcaActiva) || Boolean(q);
  const verFavoritas = !verTodas;

  const [catalogoAll, unidadesAll, stockDisponible] = await Promise.all([
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
        imagenMime: true,
        imagenUpdatedAt: true,
        favorito: true,
        _count: { select: { instalaciones: { where: { liberadaEn: null } } } },
      },
    }),
    prismaPg.clienteMaquina.findMany({
      where: { liberadaEn: null },
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
    prismaPg.maquinaStock.groupBy({
      by: ["idMaquina"],
      where: { estado: "disponible" },
      _count: { _all: true },
    }),
  ]);

  const stockMap = new Map(
    stockDisponible.map((s) => [s.idMaquina, s._count._all])
  );

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
    // Equipos asignados: no se filtran por favoritos
  }

  const clientesMap = await getClientesMap(unidades.map((u) => u.idCliente));

  if (q) {
    const asId = Number(q);
    const matchId = Number.isInteger(asId) && asId > 0;
    catalogo = catalogo.filter(
      (item) =>
        matchesQ(item.marca, q) ||
        matchesQ(item.modelo, q) ||
        matchesQ(`${item.marca} ${item.modelo ?? ""}`, q) ||
        (matchId && item.idmachine === asId)
    );
    unidades = unidades.filter((u) => {
      const cliente = clientesMap.get(u.idCliente);
      return (
        matchesQ(u.maquina.marca, q) ||
        matchesQ(u.maquina.modelo, q) ||
        matchesQ(`${u.maquina.marca} ${u.maquina.modelo ?? ""}`, q) ||
        matchesQ(u.numeroSerie, q) ||
        matchesQ(u.sitio, q) ||
        matchesQ(cliente?.nombre, q) ||
        matchesQ(cliente?.empresa, q) ||
        matchesQ(clienteLabel(cliente), q) ||
        (matchId && (u.id === asId || u.idMaquina === asId))
      );
    });
  }

  const totalUnidades = unidades.length;
  const totalPages = Math.max(1, Math.ceil(totalUnidades / PAGE_SIZE));
  const pageNum = Math.min(
    Math.max(1, Number.parseInt(pageRaw || "1", 10) || 1),
    totalPages
  );
  const unidadesPage = unidades.slice(
    (pageNum - 1) * PAGE_SIZE,
    pageNum * PAGE_SIZE
  );

  const listHrefBase = {
    q: q || undefined,
    marca: marcaActiva,
    vista: vistaParam === "todas" ? "todas" : undefined,
  };

  const hayFiltros = Boolean(q || marcaActiva || vistaParam === "todas");

  return (
    <div>
      <PageHeader
        title="Máquinas"
        description="Buscá por marca, modelo, cliente, nro. de serie o sitio."
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryLink href="/maquinas/nueva">Agregar máquina</PrimaryLink>
            <SecondaryLink href="/maquinas/stock">Stock</SecondaryLink>
            <SecondaryLink href="/maquinas/asignar">Asignar</SecondaryLink>
          </div>
        }
      />

      <form
        method="get"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4"
      >
        <div className="min-w-[14rem] flex-1">
          <label className="mb-1.5 block text-sm text-[var(--ink-muted)]">
            Buscar
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Marca, modelo, cliente, serie…"
              className={`${inputClass} field-input-with-icon`}
            />
          </div>
        </div>
        {marcaActiva ? (
          <input type="hidden" name="marca" value={marcaActiva} />
        ) : null}
        {vistaParam === "todas" && !marcaActiva ? (
          <input type="hidden" name="vista" value="todas" />
        ) : null}
        <button type="submit" className="btn-primary">
          Buscar
        </button>
        {hayFiltros ? (
          <SecondaryLink href="/maquinas">Limpiar</SecondaryLink>
        ) : null}
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--ink-muted)]">
          Ver
        </span>
        <Link
          href={maquinasHref({ q: q || undefined })}
          className={chipClass(verFavoritas)}
        >
          Favoritas
        </Link>
        <Link
          href={maquinasHref({ q: q || undefined, vista: "todas" })}
          className={chipClass(
            vistaParam === "todas" || (Boolean(q) && !marcaActiva)
          )}
        >
          Todas
        </Link>
        <span className="mx-1 text-[var(--ink-muted)]">·</span>
        <span className="text-sm font-medium text-[var(--ink-muted)]">
          Marca
        </span>
        {MARCAS.map((marca) => (
          <Link
            key={marca}
            href={maquinasHref({ q: q || undefined, marca })}
            className={chipClass(marcaActiva === marca)}
          >
            {marca}
          </Link>
        ))}
      </div>

      {verFavoritas && !hayFavoritos ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Todavía no marcaste favoritos. Se muestran todas. Elegilas en{" "}
          <Link
            href="/configuracion"
            className="text-[var(--accent)] hover:underline"
          >
            Configuración
          </Link>
          .
        </p>
      ) : null}

      {q ? (
        <p className="mb-3 text-sm text-[var(--ink-muted)]">
          {catalogo.length + totalUnidades} resultado
          {catalogo.length + totalUnidades === 1 ? "" : "s"}
          {` para “${q}”`}
          {marcaActiva ? ` · ${marcaActiva}` : ""}
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
              q
                ? "Sin modelos"
                : marcaActiva
                  ? `Sin modelos ${marcaActiva}`
                  : verFavoritas
                    ? "Sin favoritos"
                    : "Sin modelos en el catálogo"
            }
            description={
              q
                ? "Probá con otra marca, modelo o texto."
                : marcaActiva
                  ? "No hay máquinas de esta marca en el catálogo."
                  : verFavoritas
                    ? "Marcá los modelos que más usás en Configuración."
                    : "Primero agregá una máquina con marca y modelo."
            }
            action={
              q ? (
                <SecondaryLink href="/maquinas">Ver todas</SecondaryLink>
              ) : verFavoritas && !marcaActiva ? (
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
                <MachineThumb
                  maquina={item}
                  alt={`${item.marca} ${item.modelo ?? ""}`}
                  className="machine-thumb rounded-none object-cover"
                />
                <div className="p-3">
                  <p className="font-medium text-white">
                    {item.marca} {item.modelo}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {item._count.instalaciones} asignada
                    {item._count.instalaciones === 1 ? "" : "s"}
                    {marcaUsaStock(item.marca)
                      ? ` · stock ${stockMap.get(item.idmachine) ?? 0}`
                      : ""}
                    {!maquinaImageSrc(item) ? " · sin foto" : ""}
                  </p>
                  <p className="mt-2 text-xs text-[var(--accent)]">Editar</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="brand-font text-lg font-semibold text-white">
              Equipos asignados
            </h3>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
              {totalUnidades} equipo{totalUnidades === 1 ? "" : "s"}
              {totalPages > 1
                ? ` · página ${pageNum} de ${totalPages}`
                : ""}
            </p>
          </div>
          <SecondaryLink href="/maquinas/asignar">Asignar a cliente</SecondaryLink>
        </div>

        {totalUnidades === 0 ? (
          <EmptyState
            title={
              q
                ? "Sin equipos"
                : marcaActiva
                  ? `Sin equipos ${marcaActiva} asignados`
                  : "Nadie tiene equipos asignados"
            }
            description={
              q
                ? "Probá con otra marca, modelo, cliente o nro. de serie."
                : marcaActiva
                  ? "No hay unidades de esta marca asignadas a clientes."
                  : "Elegí un modelo del catálogo y asignalo a un cliente con nro. de serie y sitio."
            }
            action={
              q ? (
                <SecondaryLink href="/maquinas">Ver todas</SecondaryLink>
              ) : (
                <PrimaryLink href="/maquinas/asignar">Asignar</PrimaryLink>
              )
            }
          />
        ) : (
          <>
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
                  {unidadesPage.map((unidad) => {
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
                            <p className="text-[var(--ink-muted)]">
                              {unidad.sitio}
                            </p>
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

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--ink-muted)]">
                  {(pageNum - 1) * PAGE_SIZE + 1}–
                  {Math.min(pageNum * PAGE_SIZE, totalUnidades)} de{" "}
                  {totalUnidades}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pageNum > 1 ? (
                    <Link
                      href={maquinasHref({
                        ...listHrefBase,
                        page: pageNum - 1,
                      })}
                      className="btn-ghost"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="btn-ghost pointer-events-none opacity-40">
                      Anterior
                    </span>
                  )}
                  {pageNum < totalPages ? (
                    <Link
                      href={maquinasHref({
                        ...listHrefBase,
                        page: pageNum + 1,
                      })}
                      className="btn-primary"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="btn-primary pointer-events-none opacity-40">
                      Siguiente
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
