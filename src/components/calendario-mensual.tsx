"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  desprogramarMantenimiento,
  programarMantenimiento,
} from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { Field, Panel, inputClass } from "@/components/ui";
import { IconChevron } from "@/components/icons";
import { labelEstado } from "@/lib/utils";

export type CalendarioItem = {
  id: number;
  tipo: string;
  estado: string;
  descripcion: string | null;
  programado: string | null;
  asignadoA: string | null;
  machineLabel: string;
  clienteLabel: string;
  sitio: string | null;
  href: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYmd(value: string) {
  const [y, m, day] = value.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function formatHora(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function dayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return toYmd(d);
}

export function CalendarioMensual({
  mes,
  diaInicial,
  programados,
  pendientes,
}: {
  mes: string;
  diaInicial: string | null;
  programados: CalendarioItem[];
  pendientes: CalendarioItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(diaInicial);
  const today = toYmd(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarioItem[]>();
    for (const item of programados) {
      if (!item.programado) continue;
      const key = dayKeyFromIso(item.programado);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const ta = a.programado ? new Date(a.programado).getTime() : 0;
        const tb = b.programado ? new Date(b.programado).getTime() : 0;
        return ta - tb;
      });
    }
    return map;
  }, [programados]);

  const cells = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    // Monday-first: Sun=0 -> 6
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m, 0).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    const out: { ymd: string | null; day: number | null }[] = [];
    for (let i = 0; i < total; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        out.push({ ymd: null, day: null });
      } else {
        out.push({ ymd: `${mes}-${pad(dayNum)}`, day: dayNum });
      }
    }
    return out;
  }, [mes]);

  const selectedItems = selected ? byDay.get(selected) ?? [] : [];
  const selectedLabel = selected
    ? new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parseYmd(selected))
    : null;

  function goMonth(next: string) {
    router.push(`/calendario?mes=${next}`);
    setSelected(null);
  }

  function pickDay(ymd: string) {
    setSelected(ymd);
    router.replace(`/calendario?mes=${mes}&dia=${ymd}`, { scroll: false });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <Panel className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <button
            type="button"
            className="btn-ghost !px-2"
            aria-label="Mes anterior"
            onClick={() => goMonth(shiftMonth(mes, -1))}
          >
            <IconChevron className="h-5 w-5 rotate-180" />
          </button>
          <h2 className="brand-font text-lg font-semibold capitalize text-white">
            {monthLabel(mes)}
          </h2>
          <button
            type="button"
            className="btn-ghost !px-2"
            aria-label="Mes siguiente"
            onClick={() => goMonth(shiftMonth(mes, 1))}
          >
            <IconChevron className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[rgba(255,255,255,0.02)]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-1 py-2 text-center text-xs font-medium text-[var(--ink-muted)]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell.ymd || cell.day == null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[5.5rem] border-b border-r border-[var(--line)] bg-[rgba(0,0,0,0.15)]"
                />
              );
            }
            const items = byDay.get(cell.ymd) ?? [];
            const isSelected = selected === cell.ymd;
            const isToday = cell.ymd === today;
            return (
              <button
                key={cell.ymd}
                type="button"
                onClick={() => pickDay(cell.ymd!)}
                className={`min-h-[5.5rem] border-b border-r border-[var(--line)] p-1.5 text-left transition hover:bg-[rgba(182,255,59,0.06)] ${
                  isSelected ? "bg-[rgba(182,255,59,0.1)]" : ""
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? "bg-[var(--accent)] font-semibold text-[#0b0f0c]"
                      : "text-white"
                  }`}
                >
                  {cell.day}
                </span>
                <ul className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((item) => {
                    const hora = formatHora(item.programado);
                    return (
                      <li
                        key={item.id}
                        className="truncate rounded px-1 py-0.5 text-[0.65rem] leading-tight text-[var(--accent)] bg-[rgba(182,255,59,0.08)]"
                        title={`${item.tipo} · ${item.machineLabel}`}
                      >
                        {hora ? `${hora} · ` : ""}
                        {item.tipo}
                      </li>
                    );
                  })}
                  {items.length > 3 ? (
                    <li className="px-1 text-[0.65rem] text-[var(--ink-muted)]">
                      +{items.length - 3} más
                    </li>
                  ) : null}
                </ul>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        {!selected ? (
          <div>
            <h3 className="brand-font text-lg font-semibold text-white">
              Agenda del día
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Elegí un día en el calendario para ver visitas programadas y
              asignar arreglos o instalaciones pendientes.
            </p>
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Pendientes sin fecha:{" "}
              <span className="text-white">{pendientes.length}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="brand-font text-lg font-semibold capitalize text-white">
                {selectedLabel}
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Programá visitas opcionales con horario y quién va.
              </p>
            </div>

            <section>
              <h4 className="mb-2 text-sm font-medium text-white">
                Ese día ({selectedItems.length})
              </h4>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  Todavía no hay nada agendado.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedItems.map((item) => {
                    const hora = formatHora(item.programado);
                    const unschedule = desprogramarMantenimiento.bind(
                      null,
                      item.id
                    );
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={item.href}
                              className="font-medium text-white hover:text-[var(--accent)]"
                            >
                              {item.tipo}
                              {hora ? ` · ${hora}` : ""}
                            </Link>
                            <p className="truncate text-sm text-[var(--ink-muted)]">
                              {item.machineLabel} · {item.clienteLabel}
                              {item.sitio ? ` · ${item.sitio}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-muted)]">
                              {labelEstado(item.estado)}
                              {item.asignadoA ? ` · Va: ${item.asignadoA}` : ""}
                            </p>
                          </div>
                        </div>
                        <GuardedForm action={unschedule} className="mt-2">
                          <input type="hidden" name="mes" value={mes} />
                          <input type="hidden" name="dia" value={selected} />
                          <DangerButton
                            formAction={unschedule}
                            pendingLabel="Cargando…"
                          >
                            Quitar del día
                          </DangerButton>
                        </GuardedForm>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-medium text-white">
                Asignar pendiente
              </h4>
              {pendientes.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  No hay arreglos ni instalaciones sin programar.
                </p>
              ) : (
                <GuardedForm action={programarMantenimiento} className="grid gap-3">
                  <input type="hidden" name="fecha" value={selected} />
                  <Field label="Trabajo pendiente *">
                    <select
                      name="mantenimientoId"
                      required
                      className={inputClass}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Elegir…
                      </option>
                      {pendientes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.tipo} — {item.machineLabel} (
                          {item.clienteLabel})
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Horario (opcional)">
                      <input
                        type="time"
                        name="hora"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Quién va (opcional)">
                      <input
                        type="text"
                        name="asignadoA"
                        placeholder="Nombre o equipo"
                        className={inputClass}
                        maxLength={150}
                      />
                    </Field>
                  </div>
                  <SubmitButton pendingLabel="Cargando…">Programar</SubmitButton>
                </GuardedForm>
              )}
            </section>
          </div>
        )}
      </Panel>
    </div>
  );
}
