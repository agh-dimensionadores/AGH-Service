"use client";

import { useMemo, useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { seriePrefixFromModelo } from "@/lib/utils";

export function NumeroSerieConPrefijo({
  modelo,
  defaultSerie,
  name = "numeroSerieDigitos",
}: {
  modelo?: string | null;
  defaultSerie?: string | null;
  name?: string;
}) {
  const prefix = seriePrefixFromModelo(modelo);
  const initialDigits = useMemo(() => {
    const raw = (defaultSerie || "").trim().toUpperCase();
    if (prefix && raw.startsWith(prefix)) return raw.slice(prefix.length);
    return raw.replace(/\D/g, "");
  }, [defaultSerie, prefix]);
  const [digits, setDigits] = useState(initialDigits);

  return (
    <Field label="Nro. de serie *">
      {prefix ? (
        <div className="flex overflow-hidden rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] focus-within:border-[rgba(182,255,59,0.45)] focus-within:shadow-[0_0_0_3px_var(--accent-dim)]">
          <span className="grid place-items-center border-r border-[var(--line)] bg-[rgba(182,255,59,0.08)] px-3 font-mono text-sm font-semibold text-[var(--accent)]">
            {prefix}
          </span>
          <input
            name={name}
            required
            inputMode="numeric"
            pattern="[0-9]+"
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
            placeholder="0001"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
          />
        </div>
      ) : (
        <input
          name={name}
          required
          inputMode="numeric"
          pattern="[0-9]+"
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
          placeholder="Ej. 040027"
          className={inputClass}
        />
      )}
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        {prefix
          ? `Se guarda como ${prefix}${digits || "…"}`
          : "Sin prefijo de modelo: solo números."}
      </p>
    </Field>
  );
}
