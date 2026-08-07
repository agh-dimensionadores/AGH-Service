import Link from "next/link";
import { prismaPg } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import { catalogImageUrl } from "@/lib/uploads";
import { DonutChart } from "@/components/donut";
import {
  IconAlert,
  IconCheck,
  IconChevron,
  IconMachine,
  IconPulse,
  IconWrench,
} from "@/components/icons";
import { Badge, Panel, TopBar, estadoTone } from "@/components/ui";
import {
  countdownTone,
  daysUntil,
  equipoEstado,
  formatDate,
  formatDateTime,
  labelCountdown,
  labelEstado,
  machineName,
  machineThumbStyle,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const maquinaSelect = {
  idmachine: true,
  marca: true,
  modelo: true,
  imagenMime: true,
  imagenUpdatedAt: true,
} as const;

export default async function DashboardPage() {
  const session = await getSession();
  const nombre = session?.nombre?.split(" ")[0] || "Micaela";

  const [unidades, pendientes, abiertos, proximos, recientes, actividad] =
    await Promise.all([
      prismaPg.clienteMaquina.findMany({
        include: {
          maquina: { select: maquinaSelect },
          mantenimientos: { select: { estado: true } },
        },
      }),
      prismaPg.clienteMantenimiento.count({
        where: { estado: { in: ["abierto", "en_curso"] } },
      }),
      prismaPg.clienteMantenimiento.count({
        where: { estado: "abierto" },
      }),
      prismaPg.clienteMantenimiento.findMany({
        where: { estado: { in: ["abierto", "en_curso"] } },
        orderBy: { solicitado: "asc" },
        take: 5,
        include: {
          instalacion: { include: { maquina: { select: maquinaSelect } } },
        },
      }),
      prismaPg.clienteMaquina.findMany({
        take: 4,
        orderBy: { fechaCreacion: "desc" },
        include: {
          maquina: { select: maquinaSelect },
          mantenimientos: { select: { estado: true } },
        },
      }),
      prismaPg.clienteMantenimiento.findMany({
        take: 5,
        orderBy: { solicitado: "desc" },
        include: {
          instalacion: { include: { maquina: { select: maquinaSelect } } },
        },
      }),
    ]);

  const clientesMap = await getClientesMap([
    ...unidades.map((u) => u.idCliente),
    ...proximos.map((p) => p.instalacion.idCliente),
    ...recientes.map((u) => u.idCliente),
    ...actividad.map((a) => a.instalacion.idCliente),
  ]);

  const estados = unidades.map((u) => equipoEstado(u.mantenimientos));
  const operativa = estados.filter((e) => e === "operativa").length;
  const proximo = estados.filter((e) => e === "proximo").length;
  const fuera = estados.filter((e) => e === "fuera").length;
  const total = unidades.length || 1;
  const disponibilidad = Math.round((operativa / total) * 100);

  const kpis = [
    {
      label: "Máquinas",
      value: String(unidades.length),
      icon: <IconMachine className="h-5 w-5" />,
      tone: "ok" as const,
    },
    {
      label: "Mantenimientos",
      value: String(pendientes),
      icon: <IconWrench className="h-5 w-5" />,
      tone: "ok" as const,
      hint: "pendientes",
    },
    {
      label: "Abiertos",
      value: String(abiertos),
      icon: <IconAlert className="h-5 w-5" />,
      tone: "warn" as const,
    },
    {
      label: "Equipos operativos",
      value: `${disponibilidad}%`,
      icon: <IconPulse className="h-5 w-5" />,
      tone: "ok" as const,
    },
  ];

  const notifications = proximos.map((item) => ({
    id: String(item.id),
    title: `${machineName(item.instalacion)} · ${labelEstado(item.estado)}`,
    subtitle: [
      clienteLabel(clientesMap.get(item.instalacion.idCliente)),
      item.tipo,
      item.instalacion.sitio || null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/maquinas/${item.idClienteMaquina}`,
    when: formatDateTime(item.solicitado),
  }));

  return (
    <div>
      <TopBar
        title={`Bienvenida, ${nombre}`}
        subtitle="Estado general desde PostgreSQL"
        notifications={notifications}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Panel key={kpi.label} className="flex items-center gap-4">
            <div className={`kpi-icon ${kpi.tone === "warn" ? "warn" : ""}`}>
              {kpi.icon}
            </div>
            <div>
              <p className="brand-font text-2xl font-semibold text-white">
                {kpi.value}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {kpi.label}
                {kpi.hint ? ` · ${kpi.hint}` : ""}
              </p>
            </div>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="brand-font text-lg font-semibold text-white">
              Mantenimientos pendientes
            </h3>
            <Link
              href="/mantenimientos"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              Ver todo <IconChevron className="h-4 w-4" />
            </Link>
          </div>
          {proximos.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              No hay mantenimientos abiertos o en curso.
            </p>
          ) : (
            <ul className="space-y-3">
              {proximos.map((item) => {
                const days = daysUntil(item.solicitado);
                const tone = countdownTone(days);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/maquinas/${item.idClienteMaquina}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 transition hover:border-[rgba(182,255,59,0.35)]"
                    >
                      {item.instalacion.maquina.imagenMime ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={catalogImageUrl(
                            item.instalacion.maquina.idmachine,
                            item.instalacion.maquina.imagenUpdatedAt
                          )}
                          alt={machineName(item.instalacion)}
                          className="h-12 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="h-12 w-14 shrink-0 rounded-lg"
                          style={machineThumbStyle(
                            item.instalacion.maquina.modelo ??
                              item.instalacion.maquina.marca
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {machineName(item.instalacion)}
                          <span className="text-[var(--ink-muted)]">
                            {" "}
                            · {item.tipo}
                          </span>
                        </p>
                        <p className="truncate text-sm text-[var(--ink-muted)]">
                          {clienteLabel(
                            clientesMap.get(item.instalacion.idCliente)
                          )}
                          {item.instalacion.sitio
                            ? ` · ${item.instalacion.sitio}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge tone={tone}>{labelCountdown(days)}</Badge>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          {formatDate(item.solicitado)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Estado general de equipos
          </h3>
          <DonutChart operativa={operativa} proximo={proximo} fuera={fuera} />
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[var(--ink-muted)]">
                <span className="status-dot ok" /> Operativas
              </span>
              <span className="text-white">
                {operativa} ({Math.round((operativa / total) * 100)}%)
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[var(--ink-muted)]">
                <span className="status-dot warn" /> Con ticket abierto
              </span>
              <span className="text-white">
                {proximo} ({Math.round((proximo / total) * 100)}%)
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[var(--ink-muted)]">
                <span className="status-dot danger" /> En reparación
              </span>
              <span className="text-white">
                {fuera} ({Math.round((fuera / total) * 100)}%)
              </span>
            </li>
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4">
            <div>
              <p className="text-xs text-[var(--ink-muted)]">Disponibilidad general</p>
              <p className="brand-font mt-1 text-xl font-semibold text-[var(--accent)]">
                {disponibilidad}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--ink-muted)]">Unidades asignadas</p>
              <p className="brand-font mt-1 text-xl font-semibold text-white">
                {unidades.length}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="brand-font text-lg font-semibold text-white">
              Máquinas recientes
            </h3>
            <Link
              href="/maquinas"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              Ver todo <IconChevron className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recientes.map((unidad) => {
              const estado = equipoEstado(unidad.mantenimientos);
              return (
                <Link
                  key={unidad.id}
                  href={`/maquinas/${unidad.id}`}
                  className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 transition hover:border-[rgba(182,255,59,0.35)]"
                >
                  {unidad.maquina.imagenMime ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={catalogImageUrl(
                        unidad.maquina.idmachine,
                        unidad.maquina.imagenUpdatedAt
                      )}
                      alt={machineName(unidad)}
                      className="machine-thumb mb-3 object-cover"
                    />
                  ) : (
                    <div
                      className="machine-thumb mb-3"
                      style={machineThumbStyle(
                        unidad.maquina.modelo ?? unidad.maquina.marca
                      )}
                    />
                  )}
                  <p className="font-medium text-white">{machineName(unidad)}</p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">
                    {clienteLabel(clientesMap.get(unidad.idCliente))}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                    <span
                      className={`status-dot ${
                        estado === "operativa"
                          ? "ok"
                          : estado === "proximo"
                            ? "warn"
                            : "danger"
                      }`}
                    />
                    {labelEstado(estado)}
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="brand-font text-lg font-semibold text-white">
              Actividad reciente
            </h3>
            <Link
              href="/historial"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              Ver todo <IconChevron className="h-4 w-4" />
            </Link>
          </div>
          <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
            {actividad.map((item) => {
              const tone = estadoTone(item.estado);
              return (
                <li key={item.id} className="relative pb-5 last:pb-0">
                  <span
                    className={`absolute -left-[1.45rem] top-1 grid h-5 w-5 place-items-center rounded-full ${
                      tone === "ok"
                        ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                        : tone === "warn"
                          ? "bg-[var(--warn-dim)] text-[var(--warn)]"
                          : "bg-[var(--danger-dim)] text-[var(--danger)]"
                    }`}
                  >
                    {item.estado === "cerrado" ? (
                      <IconCheck className="h-3 w-3" />
                    ) : item.estado === "en_curso" ? (
                      <IconWrench className="h-3 w-3" />
                    ) : (
                      <IconAlert className="h-3 w-3" />
                    )}
                  </span>
                  <Link href={`/mantenimientos/${item.id}`} className="block">
                    <p className="font-medium text-white">
                      {mantenimientoTitulo(item)}
                    </p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {machineName(item.instalacion)} ·{" "}
                      {clienteLabel(clientesMap.get(item.instalacion.idCliente))}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {formatDateTime(item.solicitado)} · {labelEstado(item.estado)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
