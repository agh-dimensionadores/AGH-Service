"use client";

import { useEffect, useState } from "react";

export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-sm text-white hover:bg-black/60"
      >
        Cerrar
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function PhotoThumb({
  src,
  alt,
  className = "h-28 w-full object-cover",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden text-left"
        title="Ampliar"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`${className} cursor-zoom-in transition hover:opacity-90`}
        />
      </button>
      {open ? (
        <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

export function PhotoGallery({
  photos,
  className = "grid grid-cols-2 gap-2 sm:grid-cols-3",
  imgClassName = "h-24 w-full rounded-lg border border-[var(--line)] object-cover",
}: {
  photos: { id: number | string; src: string; alt?: string }[];
  className?: string;
  imgClassName?: string;
}) {
  if (!photos.length) return null;

  return (
    <div className={className}>
      {photos.map((foto) => (
        <div key={foto.id} className="overflow-hidden rounded-lg">
          <PhotoThumb
            src={foto.src}
            alt={foto.alt || `Foto ${foto.id}`}
            className={imgClassName}
          />
        </div>
      ))}
    </div>
  );
}
