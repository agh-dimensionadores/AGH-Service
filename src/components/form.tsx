"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

type ServerAction = (formData: FormData) => void | Promise<void>;

/** Evita doble envío mientras el POST a PostgreSQL (remoto) está en curso. */
export function GuardedForm({
  action,
  className,
  children,
}: {
  action: ServerAction;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      className={className}
      action={action}
      onSubmit={(e) => {
        const form = e.currentTarget;
        if (form.dataset.submitting === "1") {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        form.dataset.submitting = "1";
      }}
    >
      {children}
      <FormPendingHint />
      <FormSubmitUnlock />
    </form>
  );
}

function FormPendingHint() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <p className="mt-3 text-sm text-[var(--accent)]" role="status">
      Cargando…
    </p>
  );
}

/** Si falla sin navegar, permite reintentar. */
function FormSubmitUnlock() {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    const form = ref.current?.closest("form");
    const t = window.setTimeout(() => {
      form?.removeAttribute("data-submitting");
    }, 500);
    return () => window.clearTimeout(t);
  }, [pending]);

  return <span ref={ref} className="hidden" aria-hidden />;
}

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function DangerButton({
  formAction,
  children,
  pendingLabel = "Eliminando…",
  className = "btn-ghost text-[var(--danger)]",
}: {
  formAction: ServerAction;
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const locked = useRef(false);

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      formAction={(formData) => {
        if (locked.current || pending) return;
        locked.current = true;
        return formAction(formData);
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
