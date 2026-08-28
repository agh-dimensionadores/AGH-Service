import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cerrarMantenimiento,
  updateMantenimiento,
} from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { prismaPg } from "@/lib/prisma";
import { stripPlanillaBoilerplate } from "@/lib/cubiscan-planilla";
import { getCliente, clienteLabel } from "@/lib/clientes";
import {
  Badge,
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  estadoTone,
  inputClass,
} from "@/components/ui";
import {
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";
import { planillaKind } from "@/lib/planilla-template";

export const dynamic = "force-dynamic";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  const d = value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateTimeLocal(value?: Date | null) {
  if (!value) return "";
  const d = value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default async function MantenimientoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cerrado?: string }>;
}) {
  const { id: idParam } = await params;
  const { cerrado } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const item = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    include: {
      instalacion: { include: { maquina: true } },
      ordenCubiscan: true,
    },
  });

  if (!item) notFound();

  const cliente = await getCliente(item.instalacion.idCliente);

  const update = updateMantenimiento.bind(null, item.id);
  const cerrar = cerrarMantenimiento.bind(null, item.id);
  const estaCerrado = item.estado === "cerrado";
  const kind = planillaKind(
    item.instalacion.maquina.marca,
    item.instalacion.maquina.modelo
  );
  const tienePlanilla = Boolean(kind);
  const planillaEnviada = Boolean(item.ordenCubiscan?.emailEnviadoEn);
  const hayPlanilla = Boolean(item.ordenCubiscan);

  return (
    <div>
      <PageHeader
        title={mantenimientoTitulo(item)}
        description={`${item.tipo} · ${machineName(item.instalacion)} · ${clienteLabel(cliente)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href={`/maquinas/${item.idClienteMaquina}`}>
              Ver expediente
            </SecondaryLink>
            <SecondaryLink href="/mantenimientos">Volver</SecondaryLink>
          </div>
        }
      />

      {cerrado === "1" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Trabajo marcado como cerrado.
        </p>
      ) : null}

      <Panel className="max-w-2xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
          <p className="text-sm text-[var(--ink-muted)]">Estado actual</p>
          <Badge tone={estadoTone(item.estado)}>
            {labelEstado(item.estado)}
          </Badge>
        </div>

        <div className="mb-5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Pedido del cliente
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-[var(--ink-muted)]">Equipo</dt>
              <dd className="mt-0.5 text-sm text-white">
                <Link
                  href={`/maquinas/${item.idClienteMaquina}`}
                  className="text-[var(--accent)] hover:underline"
                >
                  {machineName(item.instalacion)}
                </Link>
                <span className="text-[var(--ink-muted)]">
                  {" "}
                  · Serie {item.instalacion.numeroSerie}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ink-muted)]">Tipo</dt>
              <dd className="mt-0.5 text-sm text-white">{item.tipo}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ink-muted)]">Solicitado</dt>
              <dd className="mt-0.5 text-sm text-white">
                {formatDate(item.solicitado)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-[var(--ink-muted)]">Descripción</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-white">
                {item.descripcion?.trim() || "Sin descripción"}
              </dd>
            </div>
          </dl>
        </div>

        <GuardedForm action={update} className="grid gap-4 sm:grid-cols-2">
          <Field label="Programado (agenda)">
            <input
              name="programado"
              type="datetime-local"
              defaultValue={toDateTimeLocal(item.programado)}
              className={inputClass}
            />
          </Field>
          <Field label="Quién va">
            <input
              name="asignadoA"
              type="text"
              maxLength={150}
              defaultValue={item.asignadoA ?? ""}
              placeholder="Nombre o equipo"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Comentario del arreglo">
              <textarea
                name="comentarioArreglo"
                rows={4}
                defaultValue={stripPlanillaBoilerplate(item.comentarioArreglo)}
                placeholder="Qué se hizo, repuestos, observaciones internas…"
                className={inputClass}
                readOnly={estaCerrado}
              />
            </Field>
          </div>

          {estaCerrado ? (
            <div className="sm:col-span-2 space-y-3 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
              <p>Cerrado el {formatDate(item.arreglado)}.</p>
              {tienePlanilla ? (
                planillaEnviada ? (
                  <div className="flex flex-wrap gap-2">
                    <PrimaryLink href={`/mantenimientos/${item.id}/planilla-cubiscan`}>
                      Enviar mail
                    </PrimaryLink>
                    {hayPlanilla ? (
                      <DownloadPdfButton
                        href={`/api/mantenimientos/${item.id}/planilla-cubiscan/pdf`}
                      >
                        Descargar PDF
                      </DownloadPdfButton>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <PrimaryLink href={`/mantenimientos/${item.id}/planilla-cubiscan`}>
                      Editar PDF de la orden
                    </PrimaryLink>
                    {hayPlanilla ? (
                      <DownloadPdfButton
                        href={`/api/mantenimientos/${item.id}/planilla-cubiscan/pdf`}
                      >
                        Descargar PDF
                      </DownloadPdfButton>
                    ) : null}
                  </div>
                )
              ) : null}
            </div>
          ) : tienePlanilla ? (
            <div className="sm:col-span-2 grid gap-3 rounded-xl border border-[rgba(182,255,59,0.25)] bg-[rgba(182,255,59,0.06)] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Fecha de arreglo (al cerrar)">
                <input
                  name="arreglado"
                  type="date"
                  defaultValue={toDateInput(new Date())}
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                formAction={cerrar}
                className="btn-primary"
              >
                Cerrar trabajo
              </button>
              <p className="sm:col-span-2 text-xs text-[var(--ink-muted)]">
                Marca el pedido como realizado y abre la orden de servicio para
                armar el PDF
                {kind === "agh" ? " AGH Dimensionadores" : " CubiScan"}. Podés
                editarla hasta enviar el mail.
              </p>
            </div>
          ) : (
            <div className="sm:col-span-2 grid gap-3 rounded-xl border border-[rgba(182,255,59,0.25)] bg-[rgba(182,255,59,0.06)] p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Fecha de arreglo (al cerrar)">
                <input
                  name="arreglado"
                  type="date"
                  defaultValue={toDateInput(new Date())}
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                formAction={cerrar}
                className="btn-primary"
              >
                Cerrar trabajo
              </button>
              <p className="sm:col-span-2 text-xs text-[var(--ink-muted)]">
                Marca el pedido como realizado. Podés completar el comentario
                arriba antes de cerrar.
              </p>
            </div>
          )}

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {!estaCerrado ? (
              <SubmitButton>Guardar cambios</SubmitButton>
            ) : null}
          </div>
        </GuardedForm>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Cliente:{" "}
          <Link
            href={`/clientes/${item.instalacion.idCliente}`}
            className="text-[var(--accent)] hover:underline"
          >
            {clienteLabel(cliente)}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
