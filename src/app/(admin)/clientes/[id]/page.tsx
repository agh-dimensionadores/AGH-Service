import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCliente, updateCliente } from "@/app/actions";
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
import {formatDate, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      maquinas: {
        orderBy: { creadoEn: "desc" },
        include: {
          catalogo: true,
          mantenimientos: {
            orderBy: { fecha: "desc" },
            take: 3,
          },
          _count: { select: { mantenimientos: true } },
        },
      },
    },
  });

  if (!cliente) notFound();

  const update = updateCliente.bind(null, cliente.id);
  const remove = deleteCliente.bind(null, cliente.id);

  return (
    <div>
      <PageHeader
        title={cliente.nombre}
        description={
          cliente.empresa
            ? `${cliente.empresa} · ficha del cliente y sus equipos AGH`
            : "Ficha del cliente y sus equipos AGH"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/clientes">Volver</SecondaryLink>
            <PrimaryLink href={`/maquinas/asignar?clienteId=${cliente.id}`}>
              Agregar equipo
            </PrimaryLink>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
              <h3 className="brand-font mb-4 text-lg font-semibold text-white">
                Datos del cliente
              </h3>
          <form action={update} className="grid gap-4">
            <Field label="Nombre *">
              <input
                name="nombre"
                required
                defaultValue={cliente.nombre}
                className={inputClass}
              />
            </Field>
            <Field label="Empresa">
              <input
                name="empresa"
                defaultValue={cliente.empresa ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={cliente.email ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Teléfono">
              <input
                name="telefono"
                defaultValue={cliente.telefono ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Dirección">
              <input
                name="direccion"
                defaultValue={cliente.direccion ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Notas">
              <textarea
                name="notas"
                rows={3}
                defaultValue={cliente.notas ?? ""}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                Guardar cambios
              </button>
              <button
                formAction={remove}
                className="btn-ghost text-[var(--danger)]"
              >
                Eliminar cliente
              </button>
            </div>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="brand-font text-lg font-semibold text-white">
                Equipos del cliente
              </h3>
              <span className="text-sm text-[var(--ink-muted)]">
                {cliente.maquinas.length} registrado
                {cliente.maquinas.length === 1 ? "" : "s"}
              </span>
            </div>

            {cliente.maquinas.length === 0 ? (
              <EmptyState
                title="Sin equipos"
                description="Este cliente todavía no tiene dimensionadores registrados."
                action={
                  <PrimaryLink href={`/maquinas/asignar?clienteId=${cliente.id}`}>
                    Registrar equipo
                  </PrimaryLink>
                }
              />
            ) : (
              <ul className="space-y-3">
                {cliente.maquinas.map((maquina) => (
                  <li
                    key={maquina.id}
                    className="rounded-lg border border-[var(--line)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/maquinas/${maquina.id}`}
                          className="font-medium text-[var(--accent)] hover:underline"
                        >
                          {machineName(maquina)}
                        </Link>
                        <p className="text-sm text-[var(--ink-muted)]">
                          Nro. serie: {maquina.numeroSerie}
                          {maquina.ubicacion ? ` · ${maquina.ubicacion}` : ""}
                        </p>
                      </div>
                      <Badge>
                        {maquina._count.mantenimientos} trabajo
                        {maquina._count.mantenimientos === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {maquina.mantenimientos[0] ? (
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">
                        Último: {maquina.mantenimientos[0].titulo} ·{" "}
                        {formatDate(maquina.mantenimientos[0].fecha)} ·{" "}
                        <Badge tone={estadoTone(maquina.mantenimientos[0].estado)}>
                          {labelEstado(maquina.mantenimientos[0].estado)}
                        </Badge>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
