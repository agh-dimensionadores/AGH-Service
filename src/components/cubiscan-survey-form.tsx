"use client";

import { GuardedForm, SubmitButton } from "@/components/form";
import { Field, inputClass } from "@/components/ui";
import type { CubiscanOrdenPayload } from "@/lib/cubiscan-planilla";
import {
  planillaFalloPregunta,
  planillaFirmaLabel,
  type PlanillaKind,
} from "@/lib/planilla-template";

export function CubiscanSurveyForm({
  action,
  defaults,
  readOnly = false,
  representanteNombre = "",
  kind = "cubiscan",
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: CubiscanOrdenPayload;
  readOnly?: boolean;
  representanteNombre?: string;
  kind?: PlanillaKind;
}) {
  const firmaLabel = planillaFirmaLabel(kind);

  return (
    <GuardedForm action={action} className="space-y-6">
      <section className="rounded-xl border border-[var(--line)] p-4">
        <h3 className="brand-font mb-1 text-lg font-semibold text-white">
          Califique nuestro servicio
        </h3>
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Opcional. Podés completar la encuesta hasta que AGH envíe la orden por
          correo.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={planillaFalloPregunta(kind)}>
            <select
              name="falloResuelto"
              defaultValue={defaults.falloResuelto}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
              <option value="en_proceso">En proceso</option>
            </select>
          </Field>
          <Field label="El servicio de mantenimiento fue">
            <select
              name="velocidadServicio"
              defaultValue={defaults.velocidadServicio}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="rapido">Rápido</option>
              <option value="normal">Normal</option>
              <option value="lento">Lento</option>
            </select>
          </Field>
          <Field label="El trato del Representante fue">
            <select
              name="tratoIngeniero"
              defaultValue={defaults.tratoIngeniero}
              disabled={readOnly}
              className={inputClass}
            >
              <option value="">—</option>
              <option value="amable">Amable</option>
              <option value="descortes">Descortés</option>
            </select>
          </Field>
          <Field label="Tiempo de reparación">
            <input
              name="tiempoReparacion"
              defaultValue={defaults.tiempoReparacion}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <Field label="Fecha (calificación)">
            <input
              name="fechaCalificacion"
              type="date"
              defaultValue={defaults.fechaCalificacion}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <Field label="Horario">
            <input
              name="horarioCalificacion"
              defaultValue={defaults.horarioCalificacion}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <Field label="Representante del Cliente">
            <input
              name="representanteCliente"
              defaultValue={defaults.representanteCliente}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <Field label={firmaLabel}>
            <input
              name="representanteCubiscan"
              defaultValue={defaults.representanteCubiscan || representanteNombre}
              readOnly
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Comentarios / sugerencias">
              <textarea
                name="sugerencias"
                rows={3}
                defaultValue={defaults.sugerencias}
                readOnly={readOnly}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </section>

      {!readOnly ? (
        <SubmitButton pendingLabel="Guardando…">Guardar calificación</SubmitButton>
      ) : null}
    </GuardedForm>
  );
}
