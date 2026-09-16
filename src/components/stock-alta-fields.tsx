"use client";

import { useMemo, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { marcaEsAgh, marcaEsImportacion } from "@/lib/marcas";
import { seriePrefixFromModelo } from "@/lib/utils";

export type StockCatalogoOption = {
  idmachine: number;
  marca: string;
  modelo: string | null;
};

export function StockAltaFields({
  modelos,
}: {
  modelos: StockCatalogoOption[];
}) {
  const [catalogoId, setCatalogoId] = useState("");
  const [digits, setDigits] = useState("");
  const selected = useMemo(
    () => modelos.find((m) => String(m.idmachine) === catalogoId) ?? null,
    [modelos, catalogoId]
  );
  const esAgh = marcaEsAgh(selected?.marca);
  const esImportacion = marcaEsImportacion(selected?.marca);
  const prefix = seriePrefixFromModelo(selected?.modelo);
  const serieEnabled = Boolean(catalogoId) && (esAgh || esImportacion);

  return (
    <>
      <div className="sm:col-span-2">
        <Field label="Modelo *">
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
              Seleccionar...
            </option>
            {modelos.map((item) => (
              <option key={item.idmachine} value={item.idmachine}>
                {item.marca} {item.modelo}
                {seriePrefixFromModelo(item.modelo)
                  ? ` · serie ${seriePrefixFromModelo(item.modelo)}…`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {esAgh ? (
        <>
          <Field label="Fecha de fabricación *">
            <input
              name="fechaFabricacion"
              type="date"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Precio (opcional)">
            <input
              name="precio"
              inputMode="decimal"
              className={inputClass}
              placeholder="0.00"
            />
          </Field>
        </>
      ) : null}

      {esImportacion ? (
        <>
          <Field label="Fecha importación *">
            <input
              name="fechaImportacion"
              type="date"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Despacho importación *">
            <input
              name="despachoImportacion"
              required
              maxLength={100}
              className={inputClass}
            />
          </Field>
          <Field label="PO *">
            <input name="po" required maxLength={100} className={inputClass} />
          </Field>
          <Field label="Origen *">
            <input
              name="origen"
              required
              maxLength={150}
              className={inputClass}
              placeholder="País / proveedor"
            />
          </Field>
          <Field label="Valor FO *">
            <input
              name="valorFo"
              required
              inputMode="decimal"
              className={inputClass}
              placeholder="0.00"
            />
          </Field>
        </>
      ) : null}

      {catalogoId && !esAgh && !esImportacion ? (
        <p className="sm:col-span-2 text-sm text-[var(--ink-muted)]">
          Ese modelo no usa el flujo de stock.
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Field label="Nro. de serie *">
          {prefix ? (
            <div className="flex overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] focus-within:border-[rgba(182,255,59,0.45)] focus-within:shadow-[0_0_0_3px_var(--accent-dim)]">
              <span className="grid place-items-center border-r border-[var(--line)] bg-[rgba(182,255,59,0.08)] px-3 font-mono text-sm font-semibold text-[var(--accent)]">
                {prefix}
              </span>
              <input
                name="numeroSerie"
                required
                inputMode="numeric"
                pattern="[0-9]+"
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
                disabled={!serieEnabled}
                placeholder="0001"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none disabled:opacity-50"
                autoComplete="off"
              />
            </div>
          ) : (
            <input
              name="numeroSerie"
              required
              inputMode="numeric"
              pattern="[0-9]+"
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
              maxLength={100}
              disabled={!serieEnabled}
              className={inputClass}
              placeholder={serieEnabled ? "040027" : "Elegí un modelo primero"}
              autoComplete="off"
            />
          )}
          {prefix && digits ? (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Se guarda como {prefix}
              {digits}
            </p>
          ) : null}
        </Field>
      </div>
    </>
  );
}
