"use client";

import { useState } from "react";
import { GuardedForm, SubmitButton } from "@/components/form";
import { SignaturePad } from "@/components/signature-pad";
import { Field, inputClass } from "@/components/ui";
import {
  CUBISCAN_CHECK_SECTIONS,
  CUBISCAN_EMPRESA,
  checkKey,
  type CubiscanOrdenPayload,
  type CubiscanRefaccion,
} from "@/lib/cubiscan-planilla";

export function CubiscanPlanillaForm({
  action,
  defaults,
  emailDefault,
  readOnly = false,
  firmaIngeniero = "",
  firmaCliente = "",
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: CubiscanOrdenPayload;
  emailDefault: string;
  readOnly?: boolean;
  firmaIngeniero?: string;
  firmaCliente?: string;
}) {
  const [refacciones, setRefacciones] = useState<CubiscanRefaccion[]>(
    defaults.refacciones?.length
      ? defaults.refacciones.map((r) => ({
          ...r,
          estado: r.estado ?? "",
        }))
      : [{ parte: "", cantidad: "", numeroParte: "", descripcion: "", estado: "" }]
  );

  return (
    <GuardedForm action={action} className="space-y-6">
      <section className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
        <h3 className="brand-font text-lg font-semibold text-white">
          Orden de Servicio para Equipo CubiScan
        </h3>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          <strong className="text-white">{CUBISCAN_EMPRESA.nombre}</strong>
          <br />
          {CUBISCAN_EMPRESA.direccion}
          <br />
          {CUBISCAN_EMPRESA.telefono} · {CUBISCAN_EMPRESA.web}
          <br />
          {CUBISCAN_EMPRESA.horario}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Modelo *">
          <input
            name="modelo"
            required
            defaultValue={defaults.modelo}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="N.º de Orden">
          <input
            name="nroOrden"
            defaultValue={defaults.nroOrden}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Ingeniero(s) *">
          <input
            name="ingenieros"
            required
            defaultValue={defaults.ingenieros}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Fecha *">
          <input
            name="fecha"
            type="date"
            required
            defaultValue={defaults.fecha}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Hora de llegada">
          <input
            name="horaLlegada"
            type="time"
            defaultValue={defaults.horaLlegada}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Cliente *">
          <input
            name="cliente"
            required
            defaultValue={defaults.cliente}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Ubicación">
          <input
            name="ubicacion"
            defaultValue={defaults.ubicacion}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="N.º de Serie *">
          <input
            name="numeroSerie"
            required
            defaultValue={defaults.numeroSerie}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
        <Field label="Contacto">
          <input
            name="contacto"
            defaultValue={defaults.contacto}
            readOnly={readOnly}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="rounded-xl border border-[var(--line)] p-4">
        <h4 className="mb-3 font-medium text-white">Tipo de servicio</h4>
        <div className="flex flex-wrap gap-4 text-sm text-white">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="embalaje"
              value="true"
              defaultChecked={defaults.embalaje}
              disabled={readOnly}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Embalaje
          </label>
          <label className="flex items-center gap-2">
            Instalación
            <select
              name="instalacion"
              defaultValue={defaults.instalacion}
              disabled={readOnly}
              className={`${inputClass} w-auto`}
            >
              <option value="">No</option>
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Mantenimiento
            <select
              name="mantenimientoTipo"
              defaultValue={defaults.mantenimientoTipo}
              disabled={readOnly}
              className={`${inputClass} w-auto`}
            >
              <option value="">—</option>
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="brand-font mb-3 text-lg font-semibold text-white">
          Detalle del servicio realizado
        </h3>
        <div className="space-y-4">
          {CUBISCAN_CHECK_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-[var(--line)] p-4"
            >
              <h4 className="mb-3 font-medium text-white">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const key = checkKey(section.id, item.id);
                  const current = defaults.checks[key];
                  if (item.yesNo) {
                    return (
                      <li
                        key={key}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-[var(--ink-muted)]">
                          {item.label}
                        </span>
                        <select
                          name={`check_${key}`}
                          defaultValue={
                            current === true || current === "si"
                              ? "si"
                              : current === false || current === "no"
                                ? "no"
                                : ""
                          }
                          disabled={readOnly}
                          className={`${inputClass} w-auto min-w-[7rem]`}
                        >
                          <option value="">—</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </li>
                    );
                  }
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-white">
                        <input
                          type="checkbox"
                          name={`check_${key}`}
                          value="true"
                          defaultChecked={
                            current === true ||
                            current === "true" ||
                            current === "on"
                          }
                          disabled={readOnly}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        {item.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Field label="Comentarios / Notas">
        <textarea
          name="comentarios"
          rows={4}
          defaultValue={defaults.comentarios}
          readOnly={readOnly}
          className={inputClass}
          placeholder="Detalle del trabajo realizado…"
        />
      </Field>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            name="cuboCalibracion"
            value="true"
            defaultChecked={defaults.cuboCalibracion}
            disabled={readOnly}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Cubo de calibración
        </label>
        <Field label="No. de masa">
          <input
            name="nroMasa"
            defaultValue={defaults.nroMasa}
            readOnly={readOnly}
            placeholder="Ej. 20 kg"
            className={inputClass}
          />
        </Field>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="brand-font text-lg font-semibold text-white">
            Refacciones reemplazadas
          </h3>
          {!readOnly ? (
            <button
              type="button"
              className="text-sm text-[var(--accent)] hover:underline"
              onClick={() =>
                setRefacciones((rows) => [
                  ...rows,
                  {
                    parte: "",
                    cantidad: "",
                    numeroParte: "",
                    descripcion: "",
                    estado: "",
                  },
                ])
              }
            >
              + Fila
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {refacciones.map((row, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-5"
            >
              <select
                name="ref_estado"
                defaultValue={row.estado}
                disabled={readOnly}
                className={inputClass}
              >
                <option value="">Parte…</option>
                <option value="reemplazada">Reemplazada</option>
                <option value="nueva">Nueva</option>
              </select>
              <input
                name="ref_parte"
                placeholder="Parte"
                defaultValue={row.parte}
                readOnly={readOnly}
                className={inputClass}
              />
              <input
                name="ref_cantidad"
                placeholder="Cantidad"
                defaultValue={row.cantidad}
                readOnly={readOnly}
                className={inputClass}
              />
              <input
                name="ref_numero"
                placeholder="N.º de parte"
                defaultValue={row.numeroParte}
                readOnly={readOnly}
                className={inputClass}
              />
              <input
                name="ref_descripcion"
                placeholder="Descripción"
                defaultValue={row.descripcion}
                readOnly={readOnly}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--line)] p-4">
        <h3 className="brand-font mb-3 text-lg font-semibold text-white">
          Califique nuestro servicio
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="¿Resolvimos la falla reportada?">
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
          <Field label="El trato del Ingeniero fue">
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
          <Field label="Representante de CubiScan">
            <input
              name="representanteCubiscan"
              defaultValue={defaults.representanteCubiscan}
              readOnly={readOnly}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Comentarios / sugerencias">
              <input
                name="sugerencias"
                defaultValue={defaults.sugerencias}
                readOnly={readOnly}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </section>

      {!readOnly ? (
        <section className="grid gap-6 sm:grid-cols-2">
          <SignaturePad
            name="firmaCliente"
            label="Firma del cliente"
            required
            defaultValue={firmaCliente}
          />
          <SignaturePad
            name="firmaIngeniero"
            label="Firma del ingeniero (CubiScan)"
            required
            defaultValue={firmaIngeniero}
          />
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-[var(--ink-muted)]">
              Firma del cliente
            </p>
            {firmaCliente ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firmaCliente}
                alt="Firma cliente"
                className="h-28 rounded-xl border border-[var(--line)] bg-white object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">Sin firma</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm text-[var(--ink-muted)]">
              Firma del ingeniero
            </p>
            {firmaIngeniero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firmaIngeniero}
                alt="Firma ingeniero"
                className="h-28 rounded-xl border border-[var(--line)] bg-white object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">Sin firma</p>
            )}
          </div>
        </section>
      )}

      {!readOnly ? (
        <section className="grid gap-4 rounded-xl border border-[rgba(182,255,59,0.25)] bg-[rgba(182,255,59,0.06)] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Email del cliente (envío de la orden) *">
            <input
              name="emailDestino"
              type="email"
              required
              defaultValue={emailDefault}
              className={inputClass}
            />
          </Field>
          <SubmitButton pendingLabel="Cerrando y enviando…">
            Cerrar, firmar y enviar
          </SubmitButton>
          <p className="sm:col-span-2 text-xs text-[var(--ink-muted)]">
            Guarda la planilla, cierra el trabajo y manda la orden al correo del
            cliente (con firmas).
          </p>
        </section>
      ) : null}
    </GuardedForm>
  );
}
