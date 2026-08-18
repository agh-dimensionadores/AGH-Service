"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import { BrandLogo } from "@/components/brand-logo";
import {
  IconCalendar,
  IconDashboard,
  IconHistory,
  IconMachine,
  IconReports,
  IconSettings,
  IconUsers,
  IconWrench,
} from "@/components/icons";

const nav = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/maquinas", label: "Máquinas", icon: IconMachine },
  { href: "/mantenimientos", label: "Mantenimientos", icon: IconWrench },
  { href: "/calendario", label: "Calendario", icon: IconCalendar },
  { href: "/clientes", label: "Clientes", icon: IconUsers },
  { href: "/historial", label: "Historial", icon: IconHistory },
  { href: "/reportes", label: "Reportes", icon: IconReports },
  { href: "/configuracion", label: "Configuración", icon: IconSettings },
];

export function Sidebar({
  nombre,
  rolLabel,
}: {
  nombre: string;
  rolLabel: string;
}) {
  const pathname = usePathname();
  const initials = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <BrandLogo href="/" subtitle="Servicio técnico" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
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
            {initials || "AD"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{nombre}</p>
            <p className="text-xs text-[#a8b5ab]">{rolLabel}</p>
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
