"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoThumb } from "@/components/image-lightbox";
import { assignFilesToInput } from "@/components/pending-fotos";
import { Field, inputClass } from "@/components/ui";

export function StockPoImagenField({
  stockId,
  hasImage = false,
  compact = false,
  className = "",
}: {
  /** Si hay stockId, muestra preview y permite quitar. En alta de stock no hay id aún. */
  stockId?: number;
  hasImage?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function clearSelection() {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    assignFilesToInput(inputRef.current, []);
    if (inputRef.current) inputRef.current.value = "";
  }

  const src =
    stockId != null && hasImage && !preview
      ? `/api/stock/${stockId}/po-imagen`
      : preview?.url;

  return (
    <section
      className={`rounded-xl border border-[var(--line)] p-4 ${
        compact ? "" : "sm:col-span-2"
      } ${className}`}
    >
      {!compact ? (
        <>
          <h3 className="brand-font mb-1 text-lg font-semibold text-white">
            Boleta de importación
          </h3>
          <p className="mb-4 text-xs text-[var(--ink-muted)]">
            Opcional. Foto o escaneo de la boleta de importación (JPG, PNG, WEBP
            o GIF · máx. 2 MB). Se puede cargar o reemplazar después, aunque la
            unidad ya esté asignada.
          </p>
        </>
      ) : (
        <p className="mb-3 text-sm font-medium text-white">
          Imagen de boleta de importación
        </p>
      )}

      {src ? (
        <div className="mb-3 overflow-hidden rounded-lg border border-[var(--line)]">
          <PhotoThumb
            src={src}
            alt="Boleta de importación"
            className="h-36 w-full object-contain bg-[rgba(0,0,0,0.25)]"
          />
          {preview ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <p className="min-w-0 truncate text-xs text-[var(--ink-muted)]">
                Nueva · {preview.name}
              </p>
              <button
                type="button"
                className="shrink-0 text-xs text-[var(--danger)] hover:underline"
                onClick={clearSelection}
              >
                Quitar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {stockId != null && hasImage && !preview ? (
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-muted)]">
          <input
            type="checkbox"
            name="quitarPoImagen"
            value="1"
            className="accent-[var(--accent)]"
          />
          Quitar imagen actual
        </label>
      ) : null}

      <Field label={hasImage || preview ? "Reemplazar imagen" : "Adjuntar imagen"}>
        <input
          ref={inputRef}
          name="poImagen"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={inputClass}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setPreview((old) => {
              if (old) URL.revokeObjectURL(old.url);
              return file
                ? { url: URL.createObjectURL(file), name: file.name }
                : null;
            });
          }}
        />
      </Field>
    </section>
  );
}
