"use client";

import { usePendingFotos } from "@/components/pending-fotos";
import { MAX_FOTOS_MANTENIMIENTO } from "@/lib/uploads";
import { Field, inputClass } from "@/components/ui";

export function CubiscanFotosField({
  mantenimientoId,
  existing,
  readOnly,
}: {
  mantenimientoId: number;
  existing: { id: number }[];
  readOnly?: boolean;
}) {
  const slots = Math.max(0, MAX_FOTOS_MANTENIMIENTO - existing.length);
  const { inputRef, pending, replaceFromInput, removeAt, clearAll } =
    usePendingFotos(slots);

  return (
    <section className="rounded-xl border border-[var(--line)] p-4">
      <h3 className="brand-font mb-1 text-lg font-semibold text-white">
        Fotos del mantenimiento realizado
      </h3>
      <p className="mb-4 text-xs text-[var(--ink-muted)]">
        Hasta {MAX_FOTOS_MANTENIMIENTO} fotos (JPG, PNG, WEBP o GIF · máx. 2 MB
        cada una). Van en el PDF, en una grilla de hasta 3 columnas.
      </p>
      {existing.length ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existing.map((foto) => (
            <label
              key={foto.id}
              className="overflow-hidden rounded-lg border border-[var(--line)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/mantenimientos/${mantenimientoId}/planilla-cubiscan/fotos/${foto.id}`}
                alt={`Foto ${foto.id}`}
                className="h-28 w-full object-cover"
              />
              {!readOnly ? (
                <span className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--ink-muted)]">
                  <input
                    type="checkbox"
                    name="quitarFoto"
                    value={foto.id}
                    className="accent-[var(--accent)]"
                  />
                  Quitar
                </span>
              ) : null}
            </label>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-[var(--ink-muted)]">
          Todavía no hay fotos adjuntas.
        </p>
      )}
      {pending.length ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pending.map((p, index) => (
            <div
              key={p.url}
              className="overflow-hidden rounded-lg border border-dashed border-[var(--line)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.file.name}
                className="h-28 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <p className="min-w-0 truncate text-xs text-[var(--ink-muted)]">
                  Nueva · {p.file.name}
                </p>
                <button
                  type="button"
                  className="shrink-0 text-xs text-[var(--danger)] hover:underline"
                  onClick={() => removeAt(index)}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {!readOnly && slots > 0 ? (
        <div className="space-y-2">
          <Field label="Adjuntar fotos">
            <input
              ref={inputRef}
              name="fotos"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className={inputClass}
              onChange={(e) => replaceFromInput(e.target.files)}
            />
          </Field>
          {pending.length ? (
            <button
              type="button"
              className="text-xs text-[var(--ink-muted)] hover:text-white hover:underline"
              onClick={clearAll}
            >
              Limpiar selección
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
