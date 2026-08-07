"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import {
  IconHistory,
  IconMachine,
  IconWrench,
} from "@/components/icons";

const nav = [
  { href: "/portal", label: "Mis máquinas", icon: IconMachine },
  { href: "/portal/historial", label: "Historial", icon: IconHistory },
  { href: "/portal/solicitar", label: "Solicitar arreglo", icon: IconWrench },
];

export function PortalSidebar({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const initials = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="px-5 pb-4 pt-6">
        <Link href="/portal" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-dim)] text-lg font-bold text-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]">
            A
          </span>
          <span>
            <span className="brand-font block text-lg font-semibold tracking-tight text-white">
              AGH <span className="text-[var(--accent)]">PORTAL</span>
            </span>
            <span className="text-[0.65rem] tracking-[0.16em] text-[#a8b5ab] uppercase">
              Área cliente
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--line)] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-[rgba(255,255,255,0.03)] p-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-[#0b0f0c]">
            {initials || "CL"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{nombre}</p>
            <p className="text-xs text-[#a8b5ab]">Cliente</p>
          </div>
        </div>
        <form action={logoutAction} className="mt-3">
          <button type="submit" className="btn-ghost w-full text-sm">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
