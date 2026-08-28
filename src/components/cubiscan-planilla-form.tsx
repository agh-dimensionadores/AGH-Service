"use client";

import Link from "next/link";
import { useState } from "react";
import { CubiscanFotosField } from "@/components/cubiscan-fotos-field";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { GuardedForm, SubmitButton } from "@/components/form";
import { SignaturePad } from "@/components/signature-pad";
import { Field, inputClass } from "@/components/ui";
import {
  CUBISCAN_EMPRESA,
  checkKey,
  type CubiscanOrdenPayload,
  type CubiscanRefaccion,
} from "@/lib/cubiscan-planilla";
import {
  checkSectionsFor,
  planillaTitulo,
  type PlanillaKind,
} from "@/lib/planilla-template";

export function CubiscanPlanillaForm({
  action,
  defaults,
  emailDefault,
  readOnly = false,
  firmaIngeniero = "",
  firmaCliente = "",
  mantenimientoId,
  fotos = [],
  kind = "cubiscan",
  pdfHref,
  calibracionDisponible = false,
  calibracionHref,
  calibracionPdfHref,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: CubiscanOrdenPayload;
  emailDefault: string;
  readOnly?: boolean;
  firmaIngeniero?: string;
  firmaCliente?: string;
  mantenimientoId: number;
  fotos?: { id: number }[];
  kind?: PlanillaKind;
  pdfHref?: string;
  calibracionDisponible?: boolean;
  calibracionHref?: string;
  calibracionPdfHref?: string;
}) {
  const [refacciones, setRefacciones] = useState<CubiscanRefaccion[]>(
    defaults.refacciones?.length
      ? defaults.refacciones.map((r) => ({
          cantidad: r.cantidad ?? "",
          numeroParte: r.numeroParte ?? "",
          descripcion: r.descripcion ?? "",
          estado: r.estado === "nueva" ? "nueva" : "reemplazada",
        }))
      : [
          {
            cantidad: "",
            numeroParte: "",
            descripcion: "",
            estado: "reemplazada",
          },
        ]
  );

  const sections = checkSectionsFor(kind);
  const titulo = planillaTitulo(kind);
  const isAgh = kind === "agh";
  const leftSections = sections.filter((s) =>
    ["estructura", "energia", "cargador"].includes(s.id)
  );
  const rightSections = sections.filter((s) =>
    ["limpieza", "calibracion"].includes(s.id)
  );

  const renderCheckItem = (
    sectionId: string,
    item: (typeof sections)[number]["items"][number]
  ) => {
    const key = checkKey(sectionId, item.id);
    const current = defaults.checks[key];
    if (item.yesNo) {
      return (
        <li
          key={key}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <span className="text-[var(--ink-muted)]">{item.label}</span>
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
              current === true || current === "true" || current === "on"
            }
            disabled={readOnly}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {item.label}
        </label>
      </li>
    );
  };

  const renderSection = (section: (typeof sections)[number]) => (
    <div
      key={section.id}
      className={
        isAgh
          ? "space-y-2"
          : "rounded-xl border border-[var(--line)] p-4"
      }
    >
      <h4 className={`font-medium text-white ${isAgh ? "text-sm" : "mb-3"}`}>
        {section.title}
      </h4>
      <ul className="space-y-2">
        {section.items.map((item) => renderCheckItem(section.id, item))}
      </ul>
    </div>
  );

  return (
    <GuardedForm action={action} className="space-y-6">
      <section className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
        <h3 className="brand-font text-lg font-semibold text-white">
          {titulo}
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
            readOnly
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
        <Field label="Representante(s) *">
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
            readOnly
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
            readOnly
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

      <section className="rounded-xl border border-[var(--line)] p-4">
        <h3 className="brand-font mb-3 text-lg font-semibold text-white">
          Detalle del servicio realizado
        </h3>
        {isAgh ? (
          <div className="space-y-6">
            {(
              [
                [leftSections[0], rightSections[0]],
                [leftSections[1], rightSections[1]],
                [leftSections[2], undefined],
              ] as const
            ).map(([left, right], idx) => (
              <div
                key={idx}
                className="grid items-start gap-x-6 lg:grid-cols-2"
              >
                <div>{left ? renderSection(left) : null}</div>
                <div>{right ? renderSection(right) : null}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => renderSection(section))}
          </div>
        )}
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

      <CubiscanFotosField
        mantenimientoId={mantenimientoId}
        existing={fotos}
        readOnly={readOnly}
      />

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
                    cantidad: "",
                    numeroParte: "",
                    descripcion: "",
                    estado: "reemplazada",
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
              className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-4"
            >
              <select
                name="ref_estado"
                defaultValue={
                  row.estado === "nueva" ? "nueva" : "reemplazada"
                }
                disabled={readOnly}
                className={inputClass}
              >
                <option value="reemplazada">Reemplazada</option>
                <option value="nueva">Nueva</option>
              </select>
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

      {calibracionDisponible && calibracionHref ? (
        <section className="rounded-xl border border-[var(--line)] p-4">
          <h4 className="mb-2 font-medium text-white">
            Calibración de peso (opcional · solo CubiScan)
          </h4>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Plantilla aparte con las 31 mediciones de peso en los cuatro puntos
            de la plataforma. Disponible solo para equipos CubiScan.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={calibracionHref} className="btn-ghost inline-flex">
              Plantilla de calibración de peso
            </Link>
            {calibracionPdfHref ? (
              <DownloadPdfButton href={calibracionPdfHref}>
                PDF calibración
              </DownloadPdfButton>
            ) : null}
          </div>
        </section>
      ) : null}

      {!readOnly ? (
        <section className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            Podés registrar la firma del cliente acá en la visita (desde tu
            celular). La encuesta de servicio solo la completa el cliente en su
            portal.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <SignaturePad
              name="firmaCliente"
              label="Firma del cliente"
              required={false}
              defaultValue={firmaCliente}
            />
            <SignaturePad
              name="firmaIngeniero"
              label={`Firma del representante (${kind === "agh" ? "AGH" : "CubiScan"})`}
              required={false}
              defaultValue={firmaIngeniero}
            />
          </div>
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-[var(--ink-muted)]">Firma del cliente</p>
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
            <p className="mb-2 text-sm text-[var(--ink-muted)]">Firma del representante</p>
            {firmaIngeniero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firmaIngeniero}
                alt="Firma representante"
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
          <input type="hidden" name="intent" value="guardar" />
          <Field label="Email del cliente">
            <input
              name="emailDestino"
              type="email"
              defaultValue={emailDefault}
              className={inputClass}
              placeholder="cliente@empresa.com"
            />
          </Field>
          <SubmitButton
            className="btn-ghost"
            pendingLabel="Guardando…"
            onBeforeSubmit={(form) => {
              const input = form.elements.namedItem("intent");
              if (input instanceof HTMLInputElement) input.value = "guardar";
            }}
          >
            Guardar planilla
          </SubmitButton>
          <p className="sm:col-span-2 text-xs text-[var(--ink-muted)]">
            Podés guardar y seguir editando las veces que quieras. Al enviar el
            mail la orden queda bloqueada (solo reenvío y descarga del PDF).
            El envío pide la firma del representante y un email válido. La firma del
            cliente se registra acá en la visita.
          </p>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {pdfHref ? (
          <DownloadPdfButton href={pdfHref}>Descargar PDF</DownloadPdfButton>
        ) : null}
        {!readOnly ? (
          <SubmitButton
            pendingLabel="Enviando…"
            onBeforeSubmit={(form) => {
              const input = form.elements.namedItem("intent");
              if (input instanceof HTMLInputElement) input.value = "enviar";
            }}
          >
            Enviar mail
          </SubmitButton>
        ) : null}
      </div>
    </GuardedForm>
  );
}
