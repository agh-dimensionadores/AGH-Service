"use client";

import { useEffect, useState } from "react";
import { Badge, inputClass } from "@/components/ui";
import { countdownTone, daysUntil } from "@/lib/utils";

function labelDiasRestantes(days: number | null) {
  if (days == null) return "Sin fecha de fin";
  if (days < 0)
    return `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Queda 1 día";
  return `Quedan ${days} días`;
}

export function DiasRestantesAlquiler({
  defaultFin,
}: {
  defaultFin: string;
}) {
  const [fin, setFin] = useState(defaultFin);

  useEffect(() => {
    setFin(defaultFin);
  }, [defaultFin]);

  const days = daysUntil(fin || null);

  return (
    <div className="space-y-2">
      <input
        name="fechaFin"
        type="date"
        required
        value={fin}
        onChange={(e) => setFin(e.target.value)}
        className={inputClass}
      />
      <Badge tone={countdownTone(days)}>{labelDiasRestantes(days)}</Badge>
    </div>
  );
}
