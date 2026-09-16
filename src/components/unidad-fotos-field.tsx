"use client";

import { useEffect, useState } from "react";
import { PhotoThumb } from "@/components/image-lightbox";
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
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const slots = Math.max(0, MAX_FOTOS_UNIDAD - existing.length);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

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
      {previews.length ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((p) => (
            <div
              key={p.url}
              className="overflow-hidden rounded-lg border border-dashed border-[var(--line)]"
            >
              <PhotoThumb
                src={p.url}
                alt={p.name}
                className="h-28 w-full object-cover"
              />
              <p className="truncate px-2 py-1.5 text-xs text-[var(--ink-muted)]">
                Nueva · {p.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {!readOnly && slots > 0 ? (
        <Field label="Adjuntar fotos">
          <input
            name="fotosUnidad"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className={inputClass}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, slots);
              setPreviews((old) => {
                old.forEach((p) => URL.revokeObjectURL(p.url));
                return files.map((f) => ({
                  url: URL.createObjectURL(f),
                  name: f.name,
                }));
              });
            }}
          />
        </Field>
      ) : null}
    </section>
  );
}
