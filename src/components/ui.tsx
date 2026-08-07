import Link from "next/link";
import { IconSearch } from "@/components/icons";
import {
  NotificationsBell,
  type NotificationItem,
} from "@/components/notifications";

export function TopBar({
  title,
  subtitle,
  notifications = [],
}: {
  title: string;
  subtitle?: string;
  notifications?: NotificationItem[];
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="brand-font text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell items={notifications} />
        <div className="relative hidden sm:block">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input className="search-input" placeholder="Buscar..." />
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="brand-font text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="btn-primary">
      {children}
    </Link>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="btn-ghost">
      {children}
    </Link>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card p-5 ${className}`}>{children}</section>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--ink-muted)]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "field-input";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel className="text-center">
      <h3 className="brand-font text-lg font-medium text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-muted)]">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Panel>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const tones = {
    neutral: "badge-soft badge-ok",
    ok: "badge-soft badge-ok",
    warn: "badge-soft badge-warn",
    danger: "badge-soft badge-danger",
  };
  return <span className={tones[tone]}>{children}</span>;
}

export function estadoTone(estado: string): "neutral" | "ok" | "warn" | "danger" {
  if (
    estado === "completado" ||
    estado === "cerrado" ||
    estado === "operativa"
  )
    return "ok";
  if (
    estado === "en_curso" ||
    estado === "abierto" ||
    estado === "proximo" ||
    estado === "programado"
  )
    return "warn";
  if (estado === "cancelado" || estado === "fuera") return "danger";
  return "neutral";
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <PageHeader
        title={title}
        description="Módulo del panel AGH CENTRAL — en desarrollo."
      />
      <EmptyState
        title="Próximamente"
        description="Esta sección ya está en el menú y se va a conectar con datos reales."
        action={<PrimaryLink href="/">Volver al dashboard</PrimaryLink>}
      />
    </div>
  );
}
