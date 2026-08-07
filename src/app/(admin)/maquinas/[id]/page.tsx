import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMaquina, updateMaquina } from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { listClientes, getCliente, clienteLabel } from "@/lib/clientes";
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
  formatDate,
  labelEstado,
  machineName,
  machineThumbStyle,
  mantenimientoTitulo,
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
  const { id: idParam } = await params;
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
  const update = updateMaquina.bind(null, unidad.id);
  const remove = deleteMaquina.bind(null, unidad.id);

  return (
    <div>
      <PageHeader
        title={machineName(unidad)}
        description={`Nro. serie ${unidad.numeroSerie} · Cliente: ${clienteLabel(cliente)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
            <PrimaryLink href={`/mantenimientos/nuevo?maquinaId=${unidad.id}`}>
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
            <Field label="Fecha de compra">
              <input
                name="fechaCompra"
                type="date"
                defaultValue={toDateInput(unidad.fechaCompra)}
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
            <span className="mt-1 block font-mono text-xs">
              ID máquina (integraciones): {unidad.idMaquina}
            </span>
          </p>
        </Panel>

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
            <ol className="relative space-y-0 border-l border-[var(--line)] pl-5">
              {unidad.mantenimientos.map((item) => (
                <li key={item.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
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
                    <p className="mt-2 text-sm leading-relaxed">{item.descripcion}</p>
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
