"use client";

import { useEffect, useState } from "react";

/** Popup centrado de confirmación al guardar. */
export function SuccessNotice({
  children = "Cambios guardados.",
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    for (const key of ["ok", "cerrado", "alquiler", "guardado"]) {
      url.searchParams.delete(key);
    }
    const next = url.pathname + (url.search ? url.search : "") + url.hash;
    window.history.replaceState(null, "", next);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-notice-title"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[rgba(182,255,59,0.35)] bg-[var(--bg-elevated)] px-6 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p
          id="success-notice-title"
          className="brand-font text-lg font-semibold text-white"
          role="status"
        >
          {children}
        </p>
        <button type="button" className="btn-primary mt-6 w-full" onClick={close}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
