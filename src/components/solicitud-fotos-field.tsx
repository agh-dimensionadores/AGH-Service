"use client";

import { useEffect, useState } from "react";
import { PhotoThumb } from "@/components/image-lightbox";
import { MAX_FOTOS_SOLICITUD } from "@/lib/uploads";
import { Field, inputClass } from "@/components/ui";

export function SolicitudFotosField({
  mantenimientoId,
  existing = [],
  readOnly = false,
  className = "",
}: {
  mantenimientoId?: number;
  existing?: { id: number }[];
  readOnly?: boolean;
  className?: string;
}) {
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const slots = Math.max(0, MAX_FOTOS_SOLICITUD - existing.length);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  return (
    <section
      className={`rounded-xl border border-[var(--line)] p-4 ${className}`}
    >
      <h3 className="brand-font mb-1 text-base font-semibold text-white">
        Fotos del problema
      </h3>
      <p className="mb-3 text-xs text-[var(--ink-muted)]">
        Opcional. Hasta {MAX_FOTOS_SOLICITUD} fotos (JPG, PNG, WEBP o GIF · máx.
        2 MB). Ayudan a entender el fallo antes de la visita. Clic para ampliar.
      </p>
      {existing.length && mantenimientoId != null ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existing.map((foto) => {
            const src = `/api/mantenimientos/${mantenimientoId}/fotos/${foto.id}`;
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
              </div>
            );
          })}
        </div>
      ) : null}
      {previews.length ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            name="fotosSolicitud"
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
