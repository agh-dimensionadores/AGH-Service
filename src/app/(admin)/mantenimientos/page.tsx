import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { IconSearch } from "@/components/icons";
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
  ESTADOS_MANTENIMIENTO,
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";
import type { Prisma } from "@prisma/client-pg";

export const dynamic = "force-dynamic";

export default async function MantenimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; marca?: string }>;
}) {
  const { q: qRaw, estado: estadoRaw, marca: marcaRaw } = await searchParams;
  const q = (qRaw || "").trim();
  const marca = (marcaRaw || "").trim();
  const estado =
    ESTADOS_MANTENIMIENTO.includes(
      estadoRaw as (typeof ESTADOS_MANTENIMIENTO)[number]
    )
      ? estadoRaw!
      : "";

  const marcasRows = await prismaPg.maquina.findMany({
    select: { marca: true },
    distinct: ["marca"],
    orderBy: { marca: "asc" },
  });
  const marcas = marcasRows
    .map((r) => r.marca.trim())
    .filter(Boolean);

  let clienteIds: number[] = [];
  if (q) {
    const clientesMatch = await prismaPg.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { empresa: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    clienteIds = clientesMatch.map((c) => c.id);
  }

  const andFilters: Prisma.ClienteMantenimientoWhereInput[] = [];
  if (estado) {
    andFilters.push({ estado });
  }
  if (marca) {
    andFilters.push({
      instalacion: {
        maquina: {
          marca: { equals: marca, mode: "insensitive" },
        },
      },
    });
  }
  if (q) {
    const or: Prisma.ClienteMantenimientoWhereInput[] = [
      { tipo: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
      { empresaTemp: { contains: q, mode: "insensitive" } },
      { asignadoA: { contains: q, mode: "insensitive" } },
      {
        instalacion: {
          numeroSerie: { contains: q, mode: "insensitive" },
        },
      },
      {
        instalacion: {
          sitio: { contains: q, mode: "insensitive" },
        },
      },
      {
        instalacion: {
          maquina: {
            OR: [
              { marca: { contains: q, mode: "insensitive" } },
              { modelo: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
    if (clienteIds.length) {
      or.push({ instalacion: { idCliente: { in: clienteIds } } });
    }
    // búsqueda por id numérico de ticket
    const asId = Number(q);
    if (Number.isInteger(asId) && asId > 0) {
      or.push({ id: asId });
    }
    andFilters.push({ OR: or });
  }

  const where: Prisma.ClienteMantenimientoWhereInput | undefined =
    andFilters.length ? { AND: andFilters } : undefined;

  const items = await prismaPg.clienteMantenimiento.findMany({
    where,
    orderBy: { solicitado: "desc" },
    include: {
      instalacion: { include: { maquina: true } },
    },
  });
  const clientesMap = await getClientesMap(
    items
      .map((i) => i.instalacion?.idCliente)
      .filter((id): id is number => id != null)
  );

  const hayFiltros = Boolean(q || estado || marca);

  return (
    <div>
      <PageHeader
        title="Mantenimientos"
        description="Buscá por marca, modelo, cliente, nro. de serie, sitio o tipo."
        action={
          <PrimaryLink href="/mantenimientos/nuevo">Nuevo mantenimiento</PrimaryLink>
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
        <div className="w-full sm:w-44">
          <label className="mb-1.5 block text-sm text-[var(--ink-muted)]">
            Marca
          </label>
          <select name="marca" defaultValue={marca} className={inputClass}>
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label className="mb-1.5 block text-sm text-[var(--ink-muted)]">
            Estado
          </label>
          <select name="estado" defaultValue={estado} className={inputClass}>
            <option value="">Todos</option>
            {ESTADOS_MANTENIMIENTO.map((e) => (
              <option key={e} value={e}>
                {labelEstado(e)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Buscar
        </button>
        {hayFiltros ? (
          <SecondaryLink href="/mantenimientos">Limpiar</SecondaryLink>
        ) : null}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title={hayFiltros ? "Sin resultados" : "Sin trabajos"}
          description={
            hayFiltros
              ? "Probá con otra marca, modelo, cliente o nro. de serie."
              : "Registrá calibraciones, preventivos o correctivos."
          }
          action={
            hayFiltros ? (
              <SecondaryLink href="/mantenimientos">Ver todos</SecondaryLink>
            ) : (
              <PrimaryLink href="/mantenimientos/nuevo">
                Registrar trabajo
              </PrimaryLink>
            )
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            {items.length} resultado{items.length === 1 ? "" : "s"}
            {q ? ` para “${q}”` : ""}
            {marca ? ` · ${marca}` : ""}
            {estado ? ` · ${labelEstado(estado)}` : ""}
          </p>
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
                      {item.instalacion && item.idClienteMaquina != null ? (
                        <>
                          <Link
                            href={`/maquinas/${item.idClienteMaquina}`}
                            className="hover:text-[var(--accent)]"
                          >
                            {machineName(item.instalacion)}
                          </Link>
                          <p className="text-[var(--ink-muted)]">
                            {clienteLabel(
                              clientesMap.get(item.instalacion.idCliente)
                            )}
                            {item.instalacion.numeroSerie
                              ? ` · ${item.instalacion.numeroSerie}`
                              : ""}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="text-white">Sin equipo</span>
                          <p className="text-[var(--ink-muted)]">
                            {item.empresaTemp?.trim() || "Empresa provisional"}
                          </p>
                        </>
                      )}
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
        </>
      )}
    </div>
  );
}
