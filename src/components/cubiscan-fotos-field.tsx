"use client";

import { useEffect, useState } from "react";
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
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const slots = Math.max(0, MAX_FOTOS_MANTENIMIENTO - existing.length);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

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
      {previews.length ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((p) => (
            <div
              key={p.url}
              className="overflow-hidden rounded-lg border border-dashed border-[var(--line)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
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
            name="fotos"
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
