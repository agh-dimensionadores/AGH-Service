"use client";

import { PhotoThumb } from "@/components/image-lightbox";
import { usePendingFotos } from "@/components/pending-fotos";
import { MAX_FOTOS_UNIDAD } from "@/lib/uploads";
import { Field, inputClass } from "@/components/ui";

export function UnidadFotosField({
  unidadId,
  existing = [],
  readOnly = false,
  className = "",
}: {
  /** Si aún no existe la unidad (asignación), no se muestran fotos guardadas. */
  unidadId?: number;
  existing?: { id: number }[];
  readOnly?: boolean;
  className?: string;
}) {
  const slots = Math.max(0, MAX_FOTOS_UNIDAD - existing.length);
  const { inputRef, pending, replaceFromInput, removeAt, clearAll } =
    usePendingFotos(slots);

  return (
    <section
      className={`rounded-xl border border-[var(--line)] p-4 sm:col-span-2 ${className}`}
    >
      <h3 className="brand-font mb-1 text-lg font-semibold text-white">
        Fotos del equipo
      </h3>
      <p className="mb-4 text-xs text-[var(--ink-muted)]">
        Opcional. Hasta {MAX_FOTOS_UNIDAD} fotos (JPG, PNG, WEBP o GIF · máx. 2 MB
        cada una). Se guardan en la base asociadas a esta unidad. Clic en una
        foto para ampliarla.
      </p>
      {existing.length && unidadId != null ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existing.map((foto) => {
            const src = `/api/maquinas/${unidadId}/fotos/${foto.id}`;
            return (
              <div
                key={foto.id}
                className="overflow-hidden rounded-lg border border-[var(--line)]"
              >
                <PhotoThumb
                  src={src}
                  alt={`Foto ${foto.id}`}
                  className="h-28 w-full object-cover"
                />
                {!readOnly ? (
                  <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs text-[var(--ink-muted)]">
                    <input
                      type="checkbox"
                      name="quitarFotoUnidad"
                      value={foto.id}
                      className="accent-[var(--accent)]"
                    />
                    Quitar
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {pending.length ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pending.map((p, index) => (
            <div
              key={p.url}
              className="overflow-hidden rounded-lg border border-dashed border-[var(--line)]"
            >
              <PhotoThumb
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
              name="fotosUnidad"
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
