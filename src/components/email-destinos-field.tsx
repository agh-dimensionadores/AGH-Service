"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui";

const MAX_EMAILS = 6;

export function EmailDestinosField({
  defaults,
  readOnly = false,
  required = false,
}: {
  defaults: string[];
  readOnly?: boolean;
  required?: boolean;
}) {
  const [emails, setEmails] = useState<string[]>(
    defaults.length ? defaults : [""]
  );

  function addRow() {
    if (emails.length >= MAX_EMAILS) return;
    setEmails((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setEmails((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  if (readOnly) {
    const list = defaults.filter(Boolean);
    return (
      <Field label="Destinatarios del reporte">
        <p className="text-sm text-white">
          {list.length ? list.join(", ") : "—"}
        </p>
      </Field>
    );
  }

  return (
    <Field label="Destinatarios del reporte">
      <div className="space-y-2">
        <p className="text-xs text-[var(--ink-muted)]">
          Por defecto el email del cliente. Podés agregar más destinatarios para
          enviar el PDF a varias personas.
        </p>
        {emails.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              name="emailDestino"
              type="email"
              defaultValue={email}
              required={required && index === 0}
              className={inputClass}
              placeholder={index === 0 ? "cliente@empresa.com" : "otro@empresa.com"}
            />
            {emails.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 text-xs text-[var(--ink-muted)] hover:text-white"
              >
                Quitar
              </button>
            ) : null}
          </div>
        ))}
        {emails.length < MAX_EMAILS ? (
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            + Agregar otro email
          </button>
        ) : null}
      </div>
    </Field>
  );
}
