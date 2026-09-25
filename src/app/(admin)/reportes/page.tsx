import Link from "next/link";
import { EstadoSplit, RankBars, TrendChart } from "@/components/reportes-charts";
import {
  IconAlert,
  IconCheck,
  IconMachine,
  IconPulse,
  IconWrench,
} from "@/components/icons";
import { Badge, Panel, estadoTone } from "@/components/ui";
import {
  loadReporte,
  reportesCsvHref,
  reportesHref,
  PERIODOS,
} from "@/lib/reportes";
import { formatDate, formatMoney, labelCountdown, labelEstado } from "@/lib/utils";

export const dynamic = "force-dynamic";

function chipClass(active: boolean) {
  return active
    ? "rounded-lg border border-[var(--accent)] bg-[rgba(182,255,59,0.12)] px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
    : "rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] hover:border-[rgba(182,255,59,0.35)] hover:text-white";
}

function Delta({
  current,
  previous,
  suffix = "",
  lowerIsBetter = false,
}: {
  current: number;
  previous: number | null;
  suffix?: string;
  lowerIsBetter?: boolean;
}) {
  if (previous == null) return <p className="text-xs text-[var(--ink-muted)]">sin comparación</p>;
  const diff = current - previous;
  if (diff === 0) return <p className="text-xs text-[var(--ink-muted)]">igual al período anterior</p>;
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "";
  return (
    <p className={`text-xs ${better ? "text-[var(--accent)]" : "text-[var(--warn)]"}`}>
      {sign}
      {diff}
      {suffix} vs período anterior
    </p>
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; cliente?: string }>;
}) {
  const { periodo, cliente } = await searchParams;
  const data = await loadReporte(periodo, cliente);
  const csvHref = reportesCsvHref(data.rango.id, data.clienteId);

  const resumen = data.ingresados
    ? `En ${data.rango.label.toLowerCase()} ingresaron ${data.ingresados} servicios y se cerraron ${data.cerrados}${
        data.tiempoMedio != null ? `. El cierre promedio tardó ${data.tiempoMedio} días` : ""
      }.`
    : `No hubo servicios nuevos en ${data.rango.label.toLowerCase()}.`;

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[var(--accent)] uppercase">
            Operación
          </p>
          <h1 className="brand-font mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Reportes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            {data.clienteNombre ? `${data.clienteNombre} · ` : ""}
            {resumen}
          </p>
        </div>
        <a href={csvHref} className="btn-ghost">
          Exportar CSV
        </a>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((item) => (
            <Link
              key={item.id}
              href={reportesHref(item.id, data.clienteId)}
              className={chipClass(data.rango.id === item.id)}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="periodo" value={data.rango.id} />
          <select
            name="cliente"
            defaultValue={data.clienteId ? String(data.clienteId) : ""}
            className="field-input w-auto min-w-[220px] py-2"
          >
            <option value="">Todos los clientes</option>
            {data.clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost py-2">
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="flex items-center gap-4">
          <div className="kpi-icon">
            <IconWrench className="h-5 w-5" />
          </div>
          <div>
            <p className="brand-font text-2xl font-semibold text-white">{data.ingresados}</p>
            <p className="text-sm text-[var(--ink-muted)]">Ingresados</p>
            <Delta current={data.ingresados} previous={data.ingresadosPrev} />
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <div className="kpi-icon">
            <IconCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="brand-font text-2xl font-semibold text-white">{data.cerrados}</p>
            <p className="text-sm text-[var(--ink-muted)]">Cerrados</p>
            <Delta current={data.cerrados} previous={data.cerradosPrev} />
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <div className="kpi-icon">
            <IconPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="brand-font text-2xl font-semibold text-white">
              {data.tiempoMedio == null ? "—" : `${data.tiempoMedio}d`}
            </p>
            <p className="text-sm text-[var(--ink-muted)]">Tiempo medio de cierre</p>
            {data.tiempoMedio == null ? (
              <p className="text-xs text-[var(--ink-muted)]">sin cierres en el período</p>
            ) : (
              <Delta
                current={data.tiempoMedio}
                previous={data.tiempoMedioPrev}
                suffix="d"
                lowerIsBetter
              />
            )}
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <div className="kpi-icon warn">
            <IconAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="brand-font text-2xl font-semibold text-white">
              {data.backlog + data.enCurso}
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              Backlog ahora · {data.backlog} abiertos, {data.enCurso} en curso
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Tasa de cierre {data.tasaCierre == null ? "—" : `${data.tasaCierre}%`}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <h2 className="brand-font text-lg font-semibold text-white">Ingreso y cierre</h2>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">{data.rango.label}</p>
          {data.trend.every((p) => p.abiertos === 0 && p.cerrados === 0) ? (
            <p className="text-sm text-[var(--ink-muted)]">Sin movimiento en este período.</p>
          ) : (
            <TrendChart series={data.trend} />
          )}
        </Panel>
        <Panel>
          <h2 className="brand-font mb-4 text-lg font-semibold text-white">Por estado</h2>
          <EstadoSplit items={data.porEstado} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel>
          <h2 className="brand-font mb-4 text-lg font-semibold text-white">Por tipo</h2>
          <RankBars items={data.porTipo} empty="Sin servicios en el período." />
        </Panel>
        <Panel>
          <h2 className="brand-font mb-4 text-lg font-semibold text-white">Por técnico</h2>
          <RankBars items={data.porTecnico} empty="Nadie tiene servicios asignados." />
        </Panel>
        <Panel>
          <h2 className="brand-font mb-4 text-lg font-semibold text-white">Por marca</h2>
          <RankBars items={data.porMarca} empty="Sin equipos asociados." />
        </Panel>
      </div>

      <div className="mt-6 mb-3">
        <p className="text-xs font-medium tracking-[0.16em] text-[var(--ink-muted)] uppercase">
          Foto de hoy
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel>
          <div className="mb-3 flex items-center gap-3">
            <div className="kpi-icon">
              <IconMachine className="h-5 w-5" />
            </div>
            <div>
              <p className="brand-font text-2xl font-semibold text-white">{data.disponibilidad}%</p>
              <p className="text-sm text-[var(--ink-muted)]">Disponibilidad</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between">
              <span className="text-[var(--ink-muted)]">Operativas</span>
              <span className="text-white">{data.operativas}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--ink-muted)]">Con ticket</span>
              <span className="text-white">{data.pendientes}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--ink-muted)]">En reparación</span>
              <span className="text-white">{data.enReparacion}</span>
            </li>
          </ul>
        </Panel>
        <Panel>
          <p className="text-sm text-[var(--ink-muted)]">Flota asignada</p>
          <p className="brand-font mt-1 text-2xl font-semibold text-white">{data.flota}</p>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            {data.venta} en venta · {data.alquiler} en alquiler
          </p>
        </Panel>
        <Panel>
          <p className="text-sm text-[var(--ink-muted)]">Alquileres</p>
          <p className="brand-font mt-1 text-2xl font-semibold text-white">
            {data.alquileresPorVencer}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">vencen en 30 días</p>
          <p className={`mt-3 text-sm ${data.alquileresVencidos ? "text-[var(--danger)]" : "text-[var(--ink-muted)]"}`}>
            {data.alquileresVencidos} vencidos y todavía asignados
          </p>
        </Panel>
        <Panel>
          <p className="text-sm text-[var(--ink-muted)]">Depósito</p>
          {data.clienteId ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              El stock es de la empresa. Sacá el filtro de cliente para verlo.
            </p>
          ) : (
            <>
              <p className="brand-font mt-1 text-2xl font-semibold text-white">
                {data.stockDisponible}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                disponibles · {data.stockAsignado} asignadas
              </p>
              <p className="mt-3 text-sm text-white">
                Valor FO {data.valorDeposito == null ? "—" : formatMoney(data.valorDeposito)}
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="brand-font text-lg font-semibold text-white">Clientes con más servicio</h2>
          </div>
          {data.topClientes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[var(--ink-muted)]">Sin clientes en el período.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Abiertos</th>
                    <th>Cerrados</th>
                    <th>Días prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topClientes.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/clientes/${row.id}`} className="text-white hover:text-[var(--accent)]">
                          {row.label}
                        </Link>
                      </td>
                      <td>{row.total}</td>
                      <td>{row.abiertos}</td>
                      <td>{row.cerrados}</td>
                      <td>{row.dias == null ? "—" : row.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <Panel>
          <h2 className="brand-font mb-4 text-lg font-semibold text-white">Alquileres a revisar</h2>
          {data.alquileres.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">Ningún alquiler vence en los próximos 30 días.</p>
          ) : (
            <ul className="space-y-3">
              {data.alquileres.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 hover:border-[rgba(182,255,59,0.35)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.cliente}</p>
                      <p className="truncate text-xs text-[var(--ink-muted)]">
                        {item.equipo} · {item.serie} · {formatDate(item.fin + "T12:00:00")}
                      </p>
                    </div>
                    <Badge tone={item.dias != null && item.dias < 0 ? "danger" : item.dias != null && item.dias <= 10 ? "warn" : "ok"}>
                      {labelCountdown(item.dias)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className="card mt-4 overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="brand-font text-lg font-semibold text-white">Tickets abiertos más viejos</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">Backlog actual, independiente del período.</p>
        </div>
        {data.aging.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--ink-muted)]">No hay tickets abiertos ni en curso.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Días</th>
                  <th>Asignado</th>
                </tr>
              </thead>
              <tbody>
                {data.aging.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/mantenimientos/${row.id}`}
                        className="text-white hover:text-[var(--accent)]"
                      >
                        {row.tipo}
                        {row.titulo !== row.tipo ? `: ${row.titulo}` : ""}
                      </Link>
                    </td>
                    <td className="text-[var(--ink-muted)]">{row.cliente}</td>
                    <td className="text-[var(--ink-muted)]">{row.equipo}</td>
                    <td>
                      <Badge tone={estadoTone(row.estado)}>{labelEstado(row.estado)}</Badge>
                    </td>
                    <td>{row.dias}</td>
                    <td className="text-[var(--ink-muted)]">{row.asignado}</td>
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
