"use client";

import { DownloadPdfButton } from "@/components/download-pdf-button";
import { GuardedForm, SubmitButton } from "@/components/form";
import { SignaturePad } from "@/components/signature-pad";
import { Field, inputClass } from "@/components/ui";
import {
  CALIBRACION_PESO_ROWS,
  calibracionTitulo,
  patronNumeroFromStored,
  type CalibracionPesoPayload,
} from "@/lib/calibracion-peso";

const cellClass =
  "w-full min-w-[4.5rem] rounded border border-[var(--line)] bg-[rgba(0,0,0,0.2)] px-1.5 py-1 text-xs text-white";

export function CalibracionPesoForm({
  action,
  defaults,
  readOnly = false,
  mantenimientoId,
  pdfHref,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: CalibracionPesoPayload;
  readOnly?: boolean;
  mantenimientoId: number;
  pdfHref?: string;
}) {
  const titulo = calibracionTitulo(defaults.modeloEquipo || "—");

  return (
    <GuardedForm action={action} className="space-y-6">
      <section className="rounded-xl border border-[var(--line)] p-4">
        <h3 className="brand-font mb-1 text-center text-base font-semibold text-white sm:text-lg">
          {titulo}
        </h3>
        <p className="mb-4 text-center text-xs text-[var(--ink-muted)]">
          Plantilla opcional de calibración de peso · Mantenimiento #{mantenimientoId}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Lugar">
            <input
              name="lugar"
              defaultValue={defaults.lugar}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <Field label="Equipo (N.º de serie)">
            <input
              name="equipo"
              defaultValue={defaults.equipo}
              readOnly
              className={inputClass}
            />
          </Field>
          <Field label="Mes">
            <input
              name="mes"
              defaultValue={defaults.mes}
              readOnly={readOnly}
              className={inputClass}
              placeholder="1–12"
            />
          </Field>
          <Field label="Año">
            <input
              name="anio"
              defaultValue={defaults.anio}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
        </div>
        <input type="hidden" name="modeloEquipo" value={defaults.modeloEquipo} />
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--line)]">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.08)] text-[var(--ink-muted)]">
                <th className="border border-[var(--line)] px-2 py-2">Medición</th>
                <th className="border border-[var(--line)] px-2 py-2">Patrón</th>
                <th className="border border-[var(--line)] px-2 py-2">Punto 1</th>
                <th className="border border-[var(--line)] px-2 py-2">Punto 2</th>
                <th className="border border-[var(--line)] px-2 py-2">Punto 3</th>
                <th className="border border-[var(--line)] px-2 py-2">Punto 4</th>
                <th className="border border-[var(--line)] px-2 py-2">Hora</th>
                <th className="border border-[var(--line)] px-2 py-2">Realizó</th>
                <th className="border border-[var(--line)] px-2 py-2">Firma</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: CALIBRACION_PESO_ROWS }, (_, i) => {
                const fila = defaults.filas[i] ?? {
                  patron: "",
                  punto1: "",
                  punto2: "",
                  punto3: "",
                  punto4: "",
                  hora: "",
                  realizo: "",
                  firma: "",
                };
                return (
                  <tr key={i}>
                    <td className="border border-[var(--line)] px-2 py-1 text-center text-[var(--ink-muted)]">
                      {i + 1}
                    </td>
                    <td className="border border-[var(--line)] px-1 py-0.5">
                      {readOnly ? (
                        <span className="block px-1 py-1 text-white">
                          {fila.patron || "—"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <input
                            name="cal_patron"
                            type="text"
                            inputMode="decimal"
                            defaultValue={patronNumeroFromStored(fila.patron)}
                            placeholder="1"
                            className={`${cellClass} min-w-0 flex-1`}
                          />
                          <span className="shrink-0 pr-1 text-[var(--ink-muted)]">
                            kg
                          </span>
                        </div>
                      )}
                    </td>
                    {(
                      [
                        ["cal_punto1", fila.punto1],
                        ["cal_punto2", fila.punto2],
                        ["cal_punto3", fila.punto3],
                        ["cal_punto4", fila.punto4],
                        ["cal_hora", fila.hora, "time"],
                        ["cal_realizo", fila.realizo],
                        ["cal_firma", fila.firma],
                      ] as const
                    ).map(([name, value, type]) => (
                      <td
                        key={name}
                        className="border border-[var(--line)] px-1 py-0.5"
                      >
                        {readOnly ? (
                          <span className="block px-1 py-1 text-white">
                            {value || "—"}
                          </span>
                        ) : (
                          <input
                            name={name}
                            type={type === "time" ? "time" : "text"}
                            defaultValue={value}
                            className={cellClass}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-muted)]">
          En Patrón escribí solo el número de la pesa; el PDF agrega &quot;kg&quot;
          automáticamente. Los puntos 1–4 son las esquinas y el centro de la
          plataforma (ver diagrama en el PDF).
        </p>
      </section>

      <section className="rounded-xl border border-[var(--line)] p-4">
        <Field label="Comentarios">
          <textarea
            name="comentarios"
            rows={4}
            defaultValue={defaults.comentarios}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del representante">
            <input
              name="nombreIngeniero"
              defaultValue={defaults.nombreIngeniero}
              readOnly={readOnly}
              className={inputClass}
              placeholder="Ej. Representante Ariel Hartman"
            />
          </Field>
          {!readOnly ? (
            <SignaturePad
              name="firmaIngeniero"
              label="Firma del representante"
              defaultValue={defaults.firmaIngeniero}
            />
          ) : defaults.firmaIngeniero ? (
            <div>
              <p className="mb-2 text-sm text-[var(--ink-muted)]">Firma</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaults.firmaIngeniero}
                alt="Firma representante"
                className="h-28 rounded-xl border border-[var(--line)] bg-white object-contain"
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {pdfHref ? (
          <DownloadPdfButton href={pdfHref}>Descargar PDF</DownloadPdfButton>
        ) : null}
        {!readOnly ? (
          <SubmitButton pendingLabel="Guardando…">Guardar plantilla</SubmitButton>
        ) : null}
      </div>
    </GuardedForm>
  );
}
