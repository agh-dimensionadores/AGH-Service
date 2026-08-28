"use client";

import { useMemo, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { seriePrefixFromModelo } from "@/lib/utils";
import { MachineThumb } from "@/components/machine-thumb";

export type CatalogoOption = {
  idmachine: number;
  marca: string;
  modelo: string | null;
  imagenMime: string | null;
  imagenUpdatedAt: string | null;
};

export function AsignacionCatalogoYSerie({
  catalogo,
  defaultCatalogoId,
}: {
  catalogo: CatalogoOption[];
  defaultCatalogoId?: string;
}) {
  const initial =
    defaultCatalogoId &&
    catalogo.some((c) => String(c.idmachine) === defaultCatalogoId)
      ? defaultCatalogoId
      : "";
  const [catalogoId, setCatalogoId] = useState(initial);
  const [digits, setDigits] = useState("");

  const selected = useMemo(
    () => catalogo.find((c) => String(c.idmachine) === catalogoId) ?? null,
    [catalogo, catalogoId]
  );
  const prefix = seriePrefixFromModelo(selected?.modelo);
  const soloNumeros = Boolean(catalogoId) && !prefix;

  return (
    <>
      <div className="sm:col-span-2">
        <Field label="Máquina del catálogo *">
          <select
            name="catalogoId"
            required
            value={catalogoId}
            onChange={(e) => {
              setCatalogoId(e.target.value);
              setDigits("");
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Seleccionar modelo...
            </option>
            {catalogo.map((item) => (
              <option key={item.idmachine} value={item.idmachine}>
                {item.marca} {item.modelo}
                {seriePrefixFromModelo(item.modelo)
                  ? ` · serie ${seriePrefixFromModelo(item.modelo)}…`
                  : " · serie numérica"}
              </option>
            ))}
          </select>
        </Field>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {catalogo.slice(0, 3).map((item) => (
            <button
              key={item.idmachine}
              type="button"
              onClick={() => {
                setCatalogoId(String(item.idmachine));
                setDigits("");
              }}
              className={`overflow-hidden rounded-lg border text-left transition ${
                catalogoId === String(item.idmachine)
                  ? "border-[var(--accent)]"
                  : "border-[var(--line)]"
              }`}
            >
              <MachineThumb
                maquina={item}
                alt={`${item.marca} ${item.modelo ?? ""}`}
                className="h-20 w-full object-cover"
              />
              <p className="px-2 py-1 text-xs text-[var(--ink-muted)]">
                {item.marca} {item.modelo}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <Field label="Nro. de serie *">
          {prefix ? (
            <div className="flex overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] focus-within:border-[rgba(182,255,59,0.45)] focus-within:shadow-[0_0_0_3px_var(--accent-dim)]">
              <span className="grid place-items-center border-r border-[var(--line)] bg-[rgba(182,255,59,0.08)] px-3 font-mono text-sm font-semibold text-[var(--accent)]">
                {prefix}
              </span>
              <input
                name="numeroSerieDigitos"
                required
                inputMode="numeric"
                pattern="[0-9]+"
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
                disabled={!catalogoId}
                placeholder="0001"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none disabled:opacity-50"
              />
            </div>
          ) : (
            <input
              name="numeroSerieDigitos"
              required
              inputMode="numeric"
              pattern="[0-9]+"
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
              disabled={!catalogoId}
              placeholder={
                catalogoId ? "Ej. 040027" : "Elegí un modelo primero"
              }
              className={inputClass}
            />
          )}
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            {!catalogoId
              ? "Elegí un modelo del catálogo."
              : prefix
                ? `Se guarda como ${prefix}${digits || "…"}`
                : soloNumeros
                  ? "CubiScan / sin prefijo: solo números."
                  : null}
          </p>
        </Field>
      </div>
    </>
  );
}
