"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { IconBell } from "@/components/icons";

export type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  when: string;
};

export function NotificationsBell({
  items,
}: {
  items: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const count = items.length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[0.65rem] font-bold text-[#0b0f0c] shadow-[0_0_8px_var(--accent-glow)]">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--line)] bg-[#121812] shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          role="menu"
        >
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="text-sm font-medium text-white">Notificaciones</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {count === 0
                ? "Sin pendientes"
                : `${count} mantenimiento${count === 1 ? "" : "s"} pendiente${count === 1 ? "" : "s"}`}
            </p>
          </div>

          {count === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--ink-muted)]">
              No hay arreglos abiertos ni en curso.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-[var(--line)] last:border-0">
                  <Link
                    href={item.href}
                    role="menuitem"
                    className="block px-4 py-3 transition hover:bg-[rgba(182,255,59,0.06)]"
                    onClick={() => setOpen(false)}
                  >
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--ink-muted)]">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-[var(--ink-muted)]">
                      {item.when}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-[var(--line)] px-4 py-2">
            <Link
              href="/mantenimientos"
              className="text-xs text-[var(--accent)] hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todos los mantenimientos
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
