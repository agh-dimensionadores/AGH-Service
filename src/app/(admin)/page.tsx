import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
  formatDate,
  formatDateTime,
  labelCountdown,
  labelEstado,
  machineName,
  machineThumbStyle,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const nombre = session?.nombre?.split(" ")[0] || "Micaela";

  const [maquinas, pendientes, urgentes, proximos, recientes, actividad] =
    await Promise.all([
      prisma.maquina.findMany({ include: { cliente: true, catalogo: true } }),
      prisma.mantenimiento.count({
        where: { estado: { in: ["programado", "en_curso"] } },
      }),
      prisma.maquina.count({ where: { estadoEquipo: "fuera" } }),
      prisma.mantenimiento.findMany({
        where: {
          OR: [
            { estado: "programado" },
            { proximo: { not: null } },
          ],
        },
        orderBy: [{ proximo: "asc" }, { fecha: "asc" }],
        take: 5,
        include: { maquina: { include: { cliente: true, catalogo: true } } },
      }),
      prisma.maquina.findMany({
        take: 4,
        orderBy: { creadoEn: "desc" },
        include: { cliente: true, catalogo: true },
      }),
      prisma.mantenimiento.findMany({
        take: 5,
        orderBy: { creadoEn: "desc" },
        include: { maquina: { include: { cliente: true, catalogo: true } } },
      }),
    ]);

  const operativa = maquinas.filter((m) => m.estadoEquipo === "operativa").length;
  const proximo = maquinas.filter((m) => m.estadoEquipo === "proximo").length;
  const fuera = maquinas.filter((m) => m.estadoEquipo === "fuera").length;
  const total = maquinas.length || 1;
  const disponibilidad = Math.round((operativa / total) * 100);

  const kpis = [
    {
      label: "Máquinas",
      value: String(maquinas.length),
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
      label: "Urgentes",
      value: String(urgentes),
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

  return (
    <div>
      <TopBar
        title={`Bienvenida, ${nombre}`}
        subtitle="Aquí tenés el estado general de tus equipos"
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
              Próximos mantenimientos
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
              No hay mantenimientos próximos cargados.
            </p>
          ) : (
            <ul className="space-y-3">
              {proximos.map((item) => {
                const target = item.proximo ?? item.fecha;
                const days = daysUntil(target);
                const tone = countdownTone(days);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/maquinas/${item.maquinaId}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 transition hover:border-[rgba(182,255,59,0.35)]"
                    >
                      <div
                        className="h-12 w-14 shrink-0 rounded-lg bg-cover bg-center"
                        style={
                          item.maquina.catalogo.imagen
                            ? {
                                backgroundImage: `url(${item.maquina.catalogo.imagen})`,
                              }
                            : machineThumbStyle(item.maquina.catalogo.nombre)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {machineName(item.maquina)}
                          <span className="text-[var(--ink-muted)]">
                            {" "}
                            · {item.titulo}
                          </span>
                        </p>
                        <p className="truncate text-sm text-[var(--ink-muted)]">
                          {item.maquina.cliente.empresa ||
                            item.maquina.cliente.nombre}
                          {item.maquina.ubicacion
                            ? ` · ${item.maquina.ubicacion}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge tone={tone}>{labelCountdown(days)}</Badge>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          {formatDate(target)}
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
                <span className="status-dot warn" /> Próximo mantenimiento
              </span>
              <span className="text-white">
                {proximo} ({Math.round((proximo / total) * 100)}%)
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[var(--ink-muted)]">
                <span className="status-dot danger" /> Fuera de servicio
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
              <p className="text-xs text-[var(--ink-muted)]">Tiempo medio entre fallas</p>
              <p className="brand-font mt-1 text-xl font-semibold text-white">
                142 días
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
            {recientes.map((maquina) => (
              <Link
                key={maquina.id}
                href={`/maquinas/${maquina.id}`}
                className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 transition hover:border-[rgba(182,255,59,0.35)]"
              >
                <div
                  className="machine-thumb mb-3 bg-cover bg-center"
                  style={
                    maquina.catalogo.imagen
                      ? { backgroundImage: `url(${maquina.catalogo.imagen})` }
                      : machineThumbStyle(maquina.catalogo.nombre)
                  }
                />
                <p className="font-medium text-white">{machineName(maquina)}</p>
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  {maquina.cliente.empresa || maquina.cliente.nombre}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <span
                    className={`status-dot ${
                      maquina.estadoEquipo === "operativa"
                        ? "ok"
                        : maquina.estadoEquipo === "proximo"
                          ? "warn"
                          : "danger"
                    }`}
                  />
                  {labelEstado(maquina.estadoEquipo)}
                </p>
              </Link>
            ))}
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
                    {item.estado === "completado" ? (
                      <IconCheck className="h-3 w-3" />
                    ) : item.estado === "programado" ? (
                      <IconWrench className="h-3 w-3" />
                    ) : (
                      <IconAlert className="h-3 w-3" />
                    )}
                  </span>
                  <Link href={`/mantenimientos/${item.id}`} className="block">
                    <p className="font-medium text-white">{item.titulo}</p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {machineName(item.maquina)} ·{" "}
                      {item.maquina.cliente.empresa || item.maquina.cliente.nombre}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {formatDateTime(item.creadoEn)} · {labelEstado(item.estado)}
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
