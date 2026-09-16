"use client";

import { useMemo, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { IconSearch } from "@/components/icons";

export type EquipoOption = {
  id: number;
  marca: string;
  modelo: string | null;
  numeroSerie: string;
  sitio: string | null;
  clienteLabel: string;
};

export function EquipoSelectField({
  unidades,
  defaultId,
}: {
  unidades: EquipoOption[];
  defaultId?: string;
}) {
  const marcas = useMemo(() => {
    const set = new Set(unidades.map((u) => u.marca.trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [unidades]);

  const initialId =
    defaultId && unidades.some((u) => String(u.id) === defaultId)
      ? defaultId
      : "";

  const [q, setQ] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [selectedId, setSelectedId] = useState(initialId);

  const modelos = useMemo(() => {
    const source = marca
      ? unidades.filter(
          (u) => u.marca.trim().toLowerCase() === marca.trim().toLowerCase()
        )
      : unidades;
    const set = new Set(
      source.map((u) => (u.modelo || "").trim()).filter(Boolean)
    );
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [unidades, marca]);

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return unidades.filter((u) => {
      if (
        marca &&
        u.marca.trim().toLowerCase() !== marca.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        modelo &&
        (u.modelo || "").trim().toLowerCase() !== modelo.trim().toLowerCase()
      ) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        u.marca,
        u.modelo || "",
        u.numeroSerie,
        u.sitio || "",
        u.clienteLabel,
        String(u.id),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [unidades, q, marca, modelo]);

  // Si el seleccionado queda fuera del filtro, no lo borramos: el hidden/radio sigue.
  // Pero avisamos si no aparece en la lista filtrada.
  const selectedVisible = filtradas.some((u) => String(u.id) === selectedId);
  const selected = unidades.find((u) => String(u.id) === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1.5 block text-sm text-[var(--ink-muted)]">
            Buscar equipo
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cliente, nro. de serie, modelo…"
              className={`${inputClass} field-input-with-icon`}
            />
          </div>
        </div>
        <Field label="Marca">
          <select
            value={marca}
            onChange={(e) => {
              setMarca(e.target.value);
              setModelo("");
            }}
            className={inputClass}
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Modelo">
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className={inputClass}
            disabled={!modelos.length}
          >
            <option value="">Todos</option>
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <p className="pb-2 text-sm text-[var(--ink-muted)]">
            {filtradas.length} equipo{filtradas.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {selected && !selectedVisible ? (
        <p className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-muted)]">
          Equipo elegido:{" "}
          <span className="text-white">
            {selected.marca} {selected.modelo} · {selected.numeroSerie} ·{" "}
            {selected.clienteLabel}
          </span>{" "}
          (no aparece en el filtro actual)
        </p>
      ) : null}

      <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--line)]">
        {filtradas.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--ink-muted)]">
            No hay equipos con ese criterio. Probá otra marca, modelo o búsqueda.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {filtradas.map((u) => {
              const active = selectedId === String(u.id);
              return (
                <li key={u.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 transition hover:bg-[rgba(182,255,59,0.06)] ${
                      active ? "bg-[rgba(182,255,59,0.1)]" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="maquinaId"
                      value={u.id}
                      required
                      checked={active}
                      onChange={() => setSelectedId(String(u.id))}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-white">
                        {u.marca} {u.modelo || ""}
                      </span>
                      <span className="block truncate text-sm text-[var(--ink-muted)]">
                        {u.clienteLabel} · Serie {u.numeroSerie}
                        {u.sitio ? ` · ${u.sitio}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!selectedId ? (
        <p className="text-xs text-[var(--ink-muted)]">
          Elegí un equipo de la lista para continuar.
        </p>
      ) : null}
    </div>
  );
}
