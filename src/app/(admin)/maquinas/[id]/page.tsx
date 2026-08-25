import Link from "next/link";
import { notFound } from "next/navigation";
import {
  crearPeriodoAlquiler,
  deleteMaquina,
  updateAlquilerFin,
  updateMaquina,
} from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import {
  listClientes,
  getCliente,
  getClientesMap,
  clienteLabel,
} from "@/lib/clientes";
import { catalogImageUrl } from "@/lib/uploads";
import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  inputClass,
  estadoTone,
} from "@/components/ui";
import {
  daysBetween,
  formatDate,
  labelEstado,
  machineName,
  machineThumbStyle,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  const d = value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function MaquinaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ alquiler?: string }>;
}) {
  const { id: idParam } = await params;
  const { alquiler: alquilerMsg } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [unidad, clientes, catalogo] = await Promise.all([
    prismaPg.clienteMaquina.findUnique({
      where: { id },
      include: {
        maquina: {
          select: {
            idmachine: true,
            marca: true,
            modelo: true,
            imagenMime: true,
            imagenUpdatedAt: true,
          },
        },
        mantenimientos: { orderBy: { solicitado: "desc" } },
        alquileres: { orderBy: { fechaInicio: "desc" } },
      },
    }),
    listClientes(),
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
      },
    }),
  ]);

  if (!unidad) notFound();

  const cliente = await getCliente(unidad.idCliente);
  const alquilerClientesMap = await getClientesMap(
    unidad.alquileres.map((a) => a.idCliente)
  );
  const update = updateMaquina.bind(null, unidad.id);
  const remove = deleteMaquina.bind(null, unidad.id);
  const nuevoAlquiler = crearPeriodoAlquiler.bind(null, unidad.id);
  const esAlquiler = unidad.modalidad === "alquiler";
  const alquilerActivo = unidad.alquileres[0] ?? null;

  return (
    <div>
      <PageHeader
        title={machineName(unidad)}
        description={`Nro. serie ${unidad.numeroSerie} · Cliente: ${clienteLabel(cliente)} · ${esAlquiler ? "Alquiler" : "Venta"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
            <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
              Nuevo trabajo
            </PrimaryLink>
          </div>
        }
      />

      {alquilerMsg === "ok" || alquilerMsg === "nuevo" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          {alquilerMsg === "nuevo"
            ? "Período de alquiler registrado."
            : "Alquiler actualizado."}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Panel>
            <h3 className="brand-font mb-4 text-lg font-semibold text-white">
              Datos del equipo
            </h3>
            {unidad.maquina.imagenMime ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={catalogImageUrl(
                  unidad.maquina.idmachine,
                  unidad.maquina.imagenUpdatedAt
                )}
                alt={machineName(unidad)}
                className="mb-4 machine-thumb object-cover"
              />
            ) : (
              <div
                className="mb-4 machine-thumb"
                style={machineThumbStyle(
                  unidad.maquina.modelo ?? unidad.maquina.marca
                )}
              />
            )}
            <GuardedForm action={update} className="grid gap-4">
              <Field label="Modelo del catálogo *">
                <select
                  name="catalogoId"
                  required
                  defaultValue={unidad.idMaquina}
                  className={inputClass}
                >
                  {catalogo.map((c) => (
                    <option key={c.idmachine} value={c.idmachine}>
                      {c.marca} {c.modelo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cliente *">
                <select
                  name="clienteId"
                  required
                  defaultValue={unidad.idCliente}
                  className={inputClass}
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {clienteLabel(c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nro. de serie *">
                <input
                  name="numeroSerie"
                  required
                  defaultValue={unidad.numeroSerie}
                  className={inputClass}
                />
              </Field>
              <Field label="Sitio / ubicación">
                <input
                  name="ubicacion"
                  defaultValue={unidad.sitio ?? ""}
                  className={inputClass}
                />
              </Field>
              <div>
                <p className="text-sm font-medium text-[var(--ink-muted)]">
                  Modalidad
                </p>
                <p className="mt-1.5 text-white">
                  {esAlquiler ? "Alquiler" : "Venta"}
                </p>
              </div>
              {!esAlquiler ? (
                <Field label="Fecha de compra">
                  <input
                    name="fechaCompra"
                    type="date"
                    defaultValue={toDateInput(unidad.fechaCompra)}
                    className={inputClass}
                  />
                </Field>
              ) : null}
              <Field label="Fecha de fabricación">
                <input
                  name="fechaFabricacion"
                  type="date"
                  defaultValue={toDateInput(unidad.fechaFabricacion)}
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <SubmitButton>Guardar cambios</SubmitButton>
                <DangerButton formAction={remove}>Eliminar equipo</DangerButton>
              </div>
            </GuardedForm>
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Cliente:{" "}
              <Link
                href={`/clientes/${unidad.idCliente}`}
                className="text-[var(--accent)] hover:underline"
              >
                {clienteLabel(cliente)}
              </Link>
              <span className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md border border-[var(--accent)] bg-[rgba(182,255,59,0.1)] px-2 py-1 font-mono text-xs text-[var(--accent)]">
                  Voxel Cam · clientes_maquinas.id = {unidad.id}
                </span>
                <span className="rounded-md border border-[var(--line)] px-2 py-1 font-mono text-xs text-[var(--ink-muted)]">
                  Catálogo · id_maquina = {unidad.idMaquina}
                </span>
              </span>
            </p>
          </Panel>

          {esAlquiler && alquilerActivo ? (
            <Panel>
              <h3 className="brand-font mb-1 text-lg font-semibold text-white">
                Alquiler actual
              </h3>
              <p className="mb-4 text-sm text-[var(--ink-muted)]">
                La fecha de inicio no se puede cambiar. Solo el fin y el
                comentario.
              </p>
              <GuardedForm
                action={updateAlquilerFin.bind(null, alquilerActivo.id)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink-muted)]">
                    Inicio
                  </p>
                  <p className="mt-1.5 text-white">
                    {formatDate(alquilerActivo.fechaInicio)}
                  </p>
                </div>
                <Field label="Fin del alquiler *">
                  <input
                    name="fechaFin"
                    type="date"
                    required
                    defaultValue={toDateInput(alquilerActivo.fechaFin)}
                    className={inputClass}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Comentario">
                    <textarea
                      name="comentario"
                      rows={3}
                      defaultValue={alquilerActivo.comentario ?? ""}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <SubmitButton>Actualizar fin / comentario</SubmitButton>
                </div>
              </GuardedForm>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          {esAlquiler ? (
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="brand-font text-lg font-semibold text-white">
                  Historial de alquileres
                </h3>
                <Badge>{unidad.alquileres.length}</Badge>
              </div>

              {unidad.alquileres.length === 0 ? (
                <p className="mb-4 text-sm text-[var(--ink-muted)]">
                  Todavía no hay períodos registrados.
                </p>
              ) : (
                <ul className="mb-5 space-y-3">
                  {unidad.alquileres.map((a, idx) => {
                    const dias = daysBetween(a.fechaInicio, a.fechaFin);
                    return (
                      <li
                        key={a.id}
                        className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-white">
                            {clienteLabel(alquilerClientesMap.get(a.idCliente))}
                          </p>
                          {idx === 0 ? <Badge tone="ok">Actual</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          {formatDate(a.fechaInicio)} → {formatDate(a.fechaFin)}
                          {dias != null ? ` · ${dias} día${dias === 1 ? "" : "s"}` : ""}
                        </p>
                        {a.comentario ? (
                          <p className="mt-2 text-sm text-white">{a.comentario}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              <h4 className="mb-3 font-medium text-white">
                Registrar otro período
              </h4>
              <GuardedForm
                action={nuevoAlquiler}
                className="grid gap-3 sm:grid-cols-2"
              >
                <Field label="Inicio *">
                  <input
                    name="fechaInicio"
                    type="date"
                    required
                    className={inputClass}
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <Field label="Fin *">
                  <input
                    name="fechaFin"
                    type="date"
                    required
                    className={inputClass}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Comentario">
                    <textarea
                      name="comentario"
                      rows={2}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <SubmitButton>Agregar período</SubmitButton>
                </div>
              </GuardedForm>
            </Panel>
          ) : null}

          <Panel>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="brand-font text-lg font-semibold text-white">
                Expediente técnico
              </h3>
              <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
                Agregar
              </PrimaryLink>
            </div>

            {unidad.mantenimientos.length === 0 ? (
              <EmptyState
                title="Expediente vacío"
                description="Acá se listan calibraciones, preventivos y correctivos de este dimensionador."
                action={
                  <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
                    Registrar primer trabajo
                  </PrimaryLink>
                }
              />
            ) : (
              <ol className="relative space-y-0 border-l border-[var(--line)] pl-6">
                {unidad.mantenimientos.map((item) => (
                  <li key={item.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/mantenimientos/${item.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {mantenimientoTitulo(item)}
                      </Link>
                      <Badge tone={estadoTone(item.estado)}>
                        {labelEstado(item.estado)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {item.tipo} · Solicitado {formatDate(item.solicitado)}
                      {item.arreglado
                        ? ` · Arreglado ${formatDate(item.arreglado)}`
                        : ""}
                    </p>
                    {item.descripcion ? (
                      <p className="mt-2 text-sm leading-relaxed">
                        {item.descripcion}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
