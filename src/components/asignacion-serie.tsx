"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AsignacionModalidadFields } from "@/components/asignacion-modalidad";
import { IconSearch } from "@/components/icons";
import { Field, inputClass } from "@/components/ui";
import { MachineThumb } from "@/components/machine-thumb";
import { marcaUsaStock } from "@/lib/marcas";
import { seriePrefixFromModelo } from "@/lib/utils";

export type CatalogoOption = {
  idmachine: number;
  marca: string;
  modelo: string | null;
  imagenMime: string | null;
  imagenUpdatedAt: string | null;
};

export type StockOption = {
  id: number;
  idMaquina: number;
  numeroSerie: string | null;
  fechaImportacion: string;
  despachoImportacion: string;
  po: string;
  origen: string;
  valorFo: string;
};

function digitsFromSerie(modelo: string | null | undefined, serie: string) {
  const prefix = seriePrefixFromModelo(modelo);
  const cleaned = serie.trim().toUpperCase().replace(/[\s-]+/g, "");
  if (!prefix) return cleaned.replace(/\D/g, "");
  if (cleaned.startsWith(prefix)) {
    return cleaned.slice(prefix.length).replace(/\D/g, "");
  }
  return cleaned.replace(/\D/g, "");
}

export function AsignacionCatalogoYSerie({
  catalogo,
  stockDisponible,
  defaultCatalogoId,
}: {
  catalogo: CatalogoOption[];
  stockDisponible: StockOption[];
  defaultCatalogoId?: string;
}) {
  const initial =
    defaultCatalogoId &&
    catalogo.some((c) => String(c.idmachine) === defaultCatalogoId)
      ? defaultCatalogoId
      : "";
  const [q, setQ] = useState("");
  const [catalogoId, setCatalogoId] = useState(initial);
  const [digits, setDigits] = useState("");
  const [stockId, setStockId] = useState("");

  const selected = useMemo(
    () => catalogo.find((c) => String(c.idmachine) === catalogoId) ?? null,
    [catalogo, catalogoId]
  );
  const prefix = seriePrefixFromModelo(selected?.modelo);
  const soloNumeros = Boolean(catalogoId) && !prefix;
  const usaStock = marcaUsaStock(selected?.marca);

  const stockById = useMemo(() => {
    const map = new Map(stockDisponible.map((s) => [String(s.id), s]));
    return map;
  }, [stockDisponible]);

  const stockSeleccionado = stockId ? stockById.get(stockId) ?? null : null;

  const stockDelModelo = useMemo(() => {
    const term = q.trim().toLowerCase();
    return stockDisponible.filter((s) => {
      if (String(s.idMaquina) !== catalogoId) return false;
      if (!term) return true;
      const cat = catalogo.find((c) => c.idmachine === s.idMaquina);
      const haystack = [
        cat?.marca ?? "",
        cat?.modelo ?? "",
        s.numeroSerie ?? "",
        s.po,
        s.origen,
        s.despachoImportacion,
        String(s.id),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [stockDisponible, catalogoId, catalogo, q]);

  const catalogoFiltrado = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return catalogo;
    return catalogo.filter((item) => {
      const stockMatch = stockDisponible.some((s) => {
        if (s.idMaquina !== item.idmachine) return false;
        const hay = [s.numeroSerie ?? "", s.po, s.origen, String(s.id)]
          .join(" ")
          .toLowerCase();
        return hay.includes(term);
      });
      if (stockMatch) return true;
      const haystack = [item.marca, item.modelo ?? "", String(item.idmachine)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [catalogo, stockDisponible, q]);

  const stockHits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return stockDisponible
      .filter((s) => {
        const cat = catalogo.find((c) => c.idmachine === s.idMaquina);
        const haystack = [
          cat?.marca ?? "",
          cat?.modelo ?? "",
          s.numeroSerie ?? "",
          s.po,
          s.origen,
          s.despachoImportacion,
          String(s.id),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .slice(0, 12);
  }, [stockDisponible, catalogo, q]);

  const stockCountByModelo = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of stockDisponible) {
      map.set(s.idMaquina, (map.get(s.idMaquina) ?? 0) + 1);
    }
    return map;
  }, [stockDisponible]);

  function pickCatalogo(id: string) {
    setCatalogoId(id);
    setDigits("");
    setStockId("");
  }

  function pickStock(s: StockOption) {
    const cat = catalogo.find((c) => c.idmachine === s.idMaquina);
    setCatalogoId(String(s.idMaquina));
    setStockId(String(s.id));
    if (s.numeroSerie) {
      setDigits(digitsFromSerie(cat?.modelo, s.numeroSerie));
    } else {
      setDigits("");
    }
  }

  return (
    <>
      <div className="sm:col-span-2">
        <Field label="Buscar por modelo o nro. de serie">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. Cubiscan 100, 040027…"
              className={`${inputClass} field-input-with-icon`}
            />
          </div>
        </Field>

        {stockHits.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-[var(--ink-muted)]">
              Unidades en stock
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] p-2">
              {stockHits.map((s) => {
                const cat = catalogo.find((c) => c.idmachine === s.idMaquina);
                const active = stockId === String(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickStock(s)}
                    className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-[rgba(182,255,59,0.12)] text-[var(--accent)]"
                        : "hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    <span className="font-medium text-white">
                      {cat?.marca} {cat?.modelo}
                      {s.numeroSerie ? (
                        <span className="ml-2 font-mono text-[var(--accent)]">
                          · {s.numeroSerie}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)]">
                      PO {s.po} · {s.origen} · {s.fechaImportacion}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <Field label="Máquina del catálogo *">
          <select
            name="catalogoId"
            required
            value={catalogoId}
            onChange={(e) => pickCatalogo(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Seleccionar modelo...
            </option>
            {catalogoFiltrado.map((item) => {
              const stockN = stockCountByModelo.get(item.idmachine) ?? 0;
              const stockLabel = marcaUsaStock(item.marca)
                ? ` · stock ${stockN}`
                : seriePrefixFromModelo(item.modelo)
                  ? ` · serie ${seriePrefixFromModelo(item.modelo)}…`
                  : " · serie numérica";
              return (
                <option key={item.idmachine} value={item.idmachine}>
                  {item.marca} {item.modelo}
                  {stockLabel}
                </option>
              );
            })}
          </select>
        </Field>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {catalogoFiltrado.slice(0, 3).map((item) => (
            <button
              key={item.idmachine}
              type="button"
              onClick={() => pickCatalogo(String(item.idmachine))}
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

      {usaStock ? (
        <div className="sm:col-span-2">
          <Field label="Unidad de stock *">
            {stockDelModelo.length === 0 ? (
              <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--ink-muted)]">
                {catalogoId
                  ? q.trim()
                    ? "Ninguna unidad coincide con la búsqueda."
                    : "No hay stock disponible de este modelo."
                  : "Elegí un modelo primero."}{" "}
                <Link
                  href="/maquinas/stock/nuevo"
                  className="text-[var(--accent)] underline"
                >
                  Agregar stock
                </Link>
                .
                <input name="stockId" required value="" readOnly className="hidden" />
              </div>
            ) : (
              <select
                name="stockId"
                required
                value={stockId}
                onChange={(e) => {
                  const next = stockById.get(e.target.value);
                  if (next) pickStock(next);
                  else setStockId(e.target.value);
                }}
                className={inputClass}
              >
                <option value="" disabled>
                  Elegir unidad (por nro. de serie)…
                </option>
                {stockDelModelo.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.numeroSerie
                      ? `Serie ${s.numeroSerie}`
                      : `Sin serie #${s.id}`}
                    {" · "}PO {s.po} · {s.origen} · {s.fechaImportacion}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Field label="Nro. de serie *">
          {usaStock && stockSeleccionado?.numeroSerie ? (
            <>
              <input
                type="hidden"
                name="numeroSerieDigitos"
                value={digits || stockSeleccionado.numeroSerie}
              />
              <p className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 font-mono text-sm text-white">
                {stockSeleccionado.numeroSerie}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Se toma del stock seleccionado.
              </p>
            </>
          ) : prefix ? (
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
              required={!usaStock || !stockSeleccionado?.numeroSerie}
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
          {!usaStock || !stockSeleccionado?.numeroSerie ? (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {!catalogoId
                ? "Elegí un modelo del catálogo."
                : prefix
                  ? `Se guarda como ${prefix}${digits || "…"}`
                  : soloNumeros
                    ? "CubiScan / sin prefijo: solo números."
                    : null}
            </p>
          ) : null}
        </Field>
      </div>

      {usaStock ? (
        <input type="hidden" name="modalidad" value="venta" />
      ) : (
        <AsignacionModalidadFields />
      )}
    </>
  );
}
