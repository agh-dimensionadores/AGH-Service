"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";

export type ActionResult = { error: string } | void | undefined;

type ServerAction = (formData: FormData) => ActionResult | Promise<ActionResult>;

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
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={className}
      action={async (formData) => {
        setError(null);
        try {
          const result = await action(formData);
          if (result && typeof result === "object" && result.error) {
            setError(result.error);
          }
        } catch (err) {
          unstable_rethrow(err);
          const message =
            err instanceof Error && err.message
              ? err.message
              : "No se pudo guardar. Revisá los datos e intentá de nuevo.";
          setError(
            message.includes("NEXT_") ||
              message === "An error occurred in the Server Components render."
              ? "No se pudo guardar. Revisá los datos e intentá de nuevo."
              : message
          );
        }
      }}
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
      {error ? (
        <div
          className="sm:col-span-2 rounded-lg border border-[rgba(255,80,80,0.35)] bg-[rgba(255,80,80,0.08)] px-3 py-2 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}
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
    <p className="mt-3 text-sm text-[var(--accent)] sm:col-span-2" role="status">
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
  formAction,
  name,
  value,
  onBeforeSubmit,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  formAction?: ServerAction;
  name?: string;
  value?: string;
  onBeforeSubmit?: (form: HTMLFormElement) => void;
}) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!pending) setClicked(false);
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      formAction={formAction}
      name={name}
      value={value}
      onClick={(e) => {
        setClicked(true);
        const form = e.currentTarget.form;
        if (form && onBeforeSubmit) onBeforeSubmit(form);
      }}
    >
      {pending && clicked ? pendingLabel : children}
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
