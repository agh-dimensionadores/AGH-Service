import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteMaquina,
  liberarMaquinaAlquiler,
  updateAlquilerFin,
  updateMaquina,
  updateStockPoImagen,
} from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { DiasRestantesAlquiler } from "@/components/dias-restantes-alquiler";
import { NumeroSerieConPrefijo } from "@/components/numero-serie-prefijo";
import { UnidadFotosField } from "@/components/unidad-fotos-field";
import { RemitoFotosField } from "@/components/remito-fotos-field";
import { OrdenCompraFotosField } from "@/components/orden-compra-fotos-field";
import { StockPoImagenField } from "@/components/stock-po-imagen-field";
import { listRemitoFotos, getNumeroRemito } from "@/lib/remito-fotos";
import { listOrdenCompraFotos } from "@/lib/orden-compra-fotos";
import { stockHasPoImagen } from "@/lib/stock-po-imagen";
import { prismaPg } from "@/lib/prisma";
import {
  listClientes,
  getCliente,
  getClientesMap,
  clienteLabel,
} from "@/lib/clientes";
import { MachineThumb } from "@/components/machine-thumb";
import { marcaEsAgh, marcaEsImportacion } from "@/lib/marcas";
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
  SuccessNotice,
} from "@/components/ui";
import {
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  // @db.Date llega como medianoche UTC; usar UTC para no correr el día en AR.
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatStockMoney(value: { toString(): string } | null | undefined) {
  if (value == null) return "—";
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function MaquinaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ alquiler?: string; ok?: string }>;
}) {
  const { id: idParam } = await params;
  const { alquiler: alquilerMsg, ok } = await searchParams;
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
        stockOrigen: true,
        mantenimientos: { orderBy: { solicitado: "desc" } },
        alquileres: { orderBy: { fechaInicio: "desc" } },
        fotos: { select: { id: true }, orderBy: { orden: "asc" } },
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

  const fotosRemito = await listRemitoFotos(unidad.id);
  const fotosOrdenCompra = await listOrdenCompraFotos(unidad.id);
  const numeroRemito = await getNumeroRemito(unidad.id);
  // Si liberó y se desvinculó stockOrigen, buscar por serie.
  const stock =
    unidad.stockOrigen ??
    (await prismaPg.maquinaStock.findFirst({
      where: { numeroSerie: unidad.numeroSerie },
    }));

  const tienePoImagen = stock ? await stockHasPoImagen(stock.id) : false;
  const cliente = await getCliente(unidad.idCliente);
  const update = updateMaquina.bind(null, unidad.id);
  const remove = deleteMaquina.bind(null, unidad.id);
  const liberar = liberarMaquinaAlquiler.bind(null, unidad.id);
  const esAlquiler = unidad.modalidad === "alquiler";
  const liberada = Boolean(unidad.liberadaEn);
  const alquilerActivo = !liberada ? unidad.alquileres[0] ?? null : null;
  const clientesAlquilerMap = await getClientesMap(
    unidad.alquileres.map((a) => a.idCliente)
  );
  const esAgh = marcaEsAgh(unidad.maquina.marca);
  const esImportacion = marcaEsImportacion(unidad.maquina.marca);
  const hayDatosStock =
    stock &&
    (esAgh
      ? stock.precio != null || stock.fechaFabricacion != null
      : Boolean(
          stock.despachoImportacion ||
            stock.po ||
            stock.origen ||
            stock.valorFo != null ||
            stock.fechaImportacion
        ));

  return (
    <div>
      <PageHeader
        title={machineName(unidad)}
        description={`Nro. serie ${unidad.numeroSerie} · Cliente: ${clienteLabel(cliente)} · ${esAlquiler ? "Alquiler" : "Venta"}${liberada ? " · Liberada" : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
            {!liberada ? (
              <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
                Nuevo trabajo
              </PrimaryLink>
            ) : (
              <PrimaryLink href="/maquinas/stock">Ver stock</PrimaryLink>
            )}
          </div>
        }
      />

      {ok === "1" ? <SuccessNotice /> : null}

      {alquilerMsg === "ok" ||
      alquilerMsg === "nuevo" ||
      alquilerMsg === "liberada" ? (
        <SuccessNotice>
          {alquilerMsg === "nuevo"
            ? "Período de alquiler registrado."
            : alquilerMsg === "liberada"
              ? "Unidad liberada. El historial se conserva y la serie volvió a stock para reasignar."
              : "Alquiler actualizado."}
        </SuccessNotice>
      ) : null}

      {liberada ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Liberada el {formatDate(unidad.liberadaEn)}. Esta ficha es historial;
          la máquina está disponible en stock para otro cliente.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Panel>
            <h3 className="brand-font mb-4 text-lg font-semibold text-white">
              Datos del equipo
            </h3>
            <MachineThumb
              maquina={unidad.maquina}
              alt={machineName(unidad)}
              className="mb-4 machine-thumb object-cover"
            />
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
              <NumeroSerieConPrefijo
                modelo={unidad.maquina.modelo}
                defaultSerie={unidad.numeroSerie}
              />
              <Field label="Sitio / ubicación">
                <input
                  name="ubicacion"
                  defaultValue={unidad.sitio ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Nro. de orden de compra">
                <input
                  name="ordenCompra"
                  maxLength={100}
                  defaultValue={unidad.ordenCompra ?? ""}
                  className={inputClass}
                  placeholder="OC / nro. de orden del cliente"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nro. de remito">
                <input
                  name="numeroRemito"
                  maxLength={100}
                  defaultValue={numeroRemito ?? ""}
                  className={inputClass}
                  placeholder="Nro. de remito de entrega"
                  autoComplete="off"
                />
              </Field>
              <Field label="Dirección de máquina">
                <input
                  name="direccionMaquina"
                  maxLength={300}
                  defaultValue={unidad.direccion ?? ""}
                  className={inputClass}
                  placeholder="Calle, número, localidad…"
                />
              </Field>
              <Field label="AnyDesk (opcional)">
                <input
                  name="anydesk"
                  defaultValue={unidad.anydesk ?? ""}
                  className={inputClass}
                  placeholder="123 456 789"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nro. serie PC (opcional)">
                <input
                  name="serieCompu"
                  defaultValue={unidad.serieCompu ?? ""}
                  className={inputClass}
                  placeholder="Número de serie de la computadora"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nro. serie cámara (opcional)">
                <input
                  name="serieCamara"
                  defaultValue={unidad.serieCamara ?? ""}
                  className={inputClass}
                  placeholder="Número de serie de la cámara"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nro. serie EcoFlow (opcional)">
                <input
                  name="serieEcoflow"
                  defaultValue={unidad.serieEcoflow ?? ""}
                  className={inputClass}
                  placeholder="Número de serie del EcoFlow"
                  autoComplete="off"
                />
              </Field>
              <Field label="Nro. serie pistola (opcional)">
                <input
                  name="seriePistola"
                  defaultValue={unidad.seriePistola ?? ""}
                  className={inputClass}
                  placeholder="Número de serie de la pistola de código de barras"
                  autoComplete="off"
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
              <UnidadFotosField
                unidadId={unidad.id}
                existing={unidad.fotos}
                readOnly={liberada}
              />
              <OrdenCompraFotosField
                unidadId={unidad.id}
                existing={fotosOrdenCompra}
                readOnly={liberada}
              />
              <RemitoFotosField
                unidadId={unidad.id}
                existing={fotosRemito}
                readOnly={liberada}
              />
                <div className="flex flex-wrap gap-2">
                  {!liberada ? (
                    <>
                      <SubmitButton>Guardar cambios</SubmitButton>
                      <DangerButton formAction={remove}>
                        Eliminar equipo
                      </DangerButton>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--ink-muted)]">
                      Solo lectura: unidad liberada (historial).
                    </p>
                  )}
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

          {stock ? (
            <Panel>
              <h3 className="brand-font mb-1 text-lg font-semibold text-white">
                {esAgh ? "Datos de stock (AGH)" : "Datos de importación"}
              </h3>
              <p className="mb-4 text-sm text-[var(--ink-muted)]">
                Información cargada al ingresar la unidad a stock
                {stock.id ? ` · stock #${stock.id}` : ""}.
              </p>
              {hayDatosStock ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {esAgh ? (
                    <>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">
                          Fecha de fabricación (stock)
                        </dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {formatDate(stock.fechaFabricacion)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">Precio</dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {stock.precio != null
                            ? formatStockMoney(stock.precio)
                            : "—"}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">
                          Nro. de despacho
                        </dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {stock.despachoImportacion?.trim() || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">PO</dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {stock.po?.trim() || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">Origen</dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {stock.origen?.trim() || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">
                          Valor FO
                        </dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {stock.valorFo != null
                            ? formatStockMoney(stock.valorFo)
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--ink-muted)]">
                          Fecha de importación
                        </dt>
                        <dd className="mt-0.5 text-sm text-white">
                          {formatDate(stock.fechaImportacion)}
                        </dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt className="text-xs text-[var(--ink-muted)]">
                      Estado en stock
                    </dt>
                    <dd className="mt-0.5 text-sm text-white">
                      {stock.estado === "disponible" ? "Disponible" : "Asignado"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">
                  Hay registro de stock para esta serie, pero sin PO / despacho /
                  valor cargados.
                </p>
              )}
              {esImportacion && stock ? (
                <GuardedForm
                  action={updateStockPoImagen.bind(null, stock.id)}
                  className="mt-5"
                >
                  <StockPoImagenField
                    stockId={stock.id}
                    hasImage={tienePoImagen}
                    compact
                  />
                  <div className="mt-3">
                    <SubmitButton>Guardar imagen de boleta</SubmitButton>
                  </div>
                </GuardedForm>
              ) : null}
            </Panel>
          ) : (
            <Panel>
              <h3 className="brand-font mb-1 text-lg font-semibold text-white">
                Datos de stock
              </h3>
              <p className="text-sm text-[var(--ink-muted)]">
                Esta unidad no tiene un registro vinculado en stock (se asignó
                sin pasar por depósito, o la serie no coincide).
              </p>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          {esAlquiler && alquilerActivo && !liberada ? (
            <Panel>
              <h3 className="brand-font mb-1 text-lg font-semibold text-white">
                Alquiler actual
              </h3>
              <p className="mb-4 text-sm text-[var(--ink-muted)]">
                La fecha de inicio no se puede cambiar. Solo el fin y el
                comentario. Al liberar, la serie vuelve a stock y se conserva
                este historial.
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
                  <DiasRestantesAlquiler
                    key={toDateInput(alquilerActivo.fechaFin)}
                    defaultFin={toDateInput(alquilerActivo.fechaFin)}
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
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <SubmitButton>Actualizar fin / comentario</SubmitButton>
                </div>
              </GuardedForm>
              <form action={liberar} className="mt-4 border-t border-[var(--line)] pt-4">
                <DangerButton formAction={liberar} pendingLabel="Liberando…">
                  Liberar y devolver a stock
                </DangerButton>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  No borra el historial de alquiler. La máquina queda disponible
                  para asignar a otro cliente.
                </p>
              </form>
            </Panel>
          ) : null}

          {esAlquiler && unidad.alquileres.length > 0 ? (
            <Panel>
              <h3 className="brand-font mb-4 text-lg font-semibold text-white">
                Historial de alquileres
              </h3>
              <ul className="space-y-3">
                {unidad.alquileres.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-white">
                      {clienteLabel(clientesAlquilerMap.get(a.idCliente))}
                    </p>
                    <p className="text-[var(--ink-muted)]">
                      {formatDate(a.fechaInicio)} → {formatDate(a.fechaFin)}
                    </p>
                    {a.comentario ? (
                      <p className="mt-1 text-[var(--ink-muted)]">{a.comentario}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="brand-font text-lg font-semibold text-white">
                Expediente técnico
              </h3>
              {!liberada ? (
                <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
                  Agregar
                </PrimaryLink>
              ) : null}
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
