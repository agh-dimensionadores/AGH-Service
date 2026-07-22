import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMaquina, updateMaquina } from "@/app/actions";
import { prisma } from "@/lib/prisma";
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
  formatDate,
  formatMoney,
  labelEstado,
  machineName,
  machineThumbStyle,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function MaquinaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [maquina, clientes, catalogo] = await Promise.all([
    prisma.maquina.findUnique({
      where: { id },
      include: {
        cliente: true,
        catalogo: true,
        mantenimientos: { orderBy: { fecha: "desc" } },
      },
    }),
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.catalogoMaquina.findMany({
      orderBy: [{ marca: "asc" }, { nombre: "asc" }],
    }),
  ]);

  if (!maquina) notFound();

  const update = updateMaquina.bind(null, maquina.id);
  const remove = deleteMaquina.bind(null, maquina.id);

  return (
    <div>
      <PageHeader
        title={machineName(maquina)}
        description={`Nro. serie ${maquina.numeroSerie} · Cliente: ${maquina.cliente.empresa || maquina.cliente.nombre}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
            <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${maquina.id}`}>
              Nuevo trabajo
            </PrimaryLink>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Datos del equipo
          </h3>
          {maquina.catalogo.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={maquina.catalogo.imagen}
              alt={machineName(maquina)}
              className="mb-4 machine-thumb object-cover"
            />
          ) : (
            <div
              className="mb-4 machine-thumb"
              style={machineThumbStyle(maquina.catalogo.nombre)}
            />
          )}
          <form action={update} className="grid gap-4">
            <Field label="Modelo del catálogo *">
              <select
                name="catalogoId"
                required
                defaultValue={maquina.catalogoId}
                className={inputClass}
              >
                {catalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.marca} {c.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cliente *">
              <select
                name="clienteId"
                required
                defaultValue={maquina.clienteId}
                className={inputClass}
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa || c.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado del equipo">
              <select
                name="estadoEquipo"
                defaultValue={maquina.estadoEquipo}
                className={inputClass}
              >
                <option value="operativa">Operativa</option>
                <option value="proximo">Próximo mantenimiento</option>
                <option value="fuera">Fuera de servicio</option>
              </select>
            </Field>
            <Field label="Nro. de serie *">
              <input
                name="numeroSerie"
                required
                defaultValue={maquina.numeroSerie}
                className={inputClass}
              />
            </Field>
            <Field label="Ubicación">
              <input
                name="ubicacion"
                defaultValue={maquina.ubicacion ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Fecha de compra">
              <input
                name="fechaCompra"
                type="date"
                defaultValue={toDateInput(maquina.fechaCompra)}
                className={inputClass}
              />
            </Field>
            <Field label="Descripción">
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={maquina.descripcion ?? ""}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                Guardar cambios
              </button>
              <button formAction={remove} className="btn-ghost text-[var(--danger)]">
                Eliminar equipo
              </button>
            </div>
          </form>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Cliente:{" "}
            <Link
              href={`/clientes/${maquina.clienteId}`}
              className="text-[var(--accent)] hover:underline"
            >
              {maquina.cliente.empresa || maquina.cliente.nombre}
            </Link>
          </p>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="brand-font text-lg font-semibold text-white">
              Expediente técnico
            </h3>
            <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${maquina.id}`}>
              Agregar
            </PrimaryLink>
          </div>

          {maquina.mantenimientos.length === 0 ? (
            <EmptyState
              title="Expediente vacío"
              description="Acá se listan calibraciones, preventivos y correctivos de este dimensionador."
              action={
                <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${maquina.id}`}>
                  Registrar primer trabajo
                </PrimaryLink>
              }
            />
          ) : (
            <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
              {maquina.mantenimientos.map((item) => (
                <li key={item.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/mantenimientos/${item.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {item.titulo}
                    </Link>
                    <Badge tone={estadoTone(item.estado)}>
                      {labelEstado(item.estado)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {item.tipo} · {formatDate(item.fecha)}
                    {item.tecnico ? ` · ${item.tecnico}` : ""}
                    {item.costo != null ? ` · ${formatMoney(item.costo)}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{item.descripcion}</p>
                  {item.piezas ? (
                    <p className="mt-2 text-xs text-[var(--ink-muted)]">
                      Piezas / materiales: {item.piezas}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
