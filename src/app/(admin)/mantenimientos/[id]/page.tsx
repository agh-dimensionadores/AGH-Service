import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMantenimiento, updateMantenimiento } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import {ESTADOS_MANTENIMIENTO,
  TIPOS_MANTENIMIENTO,
  labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toDateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function MantenimientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, maquinas] = await Promise.all([
    prisma.mantenimiento.findUnique({
      where: { id },
      include: {
        maquina: { include: { cliente: true, catalogo: true } },
      },
    }),
    prisma.maquina.findMany({
      orderBy: { marca: "asc" },
      include: { cliente: true, catalogo: true },
    }),
  ]);

  if (!item) notFound();

  const update = updateMantenimiento.bind(null, item.id);
  const remove = deleteMantenimiento.bind(null, item.id);

  return (
    <div>
      <PageHeader
        title={item.titulo}
        description={`${item.tipo} · ${machineName(item.maquina)} · ${item.maquina.cliente.nombre}`}
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href={`/maquinas/${item.maquinaId}`}>
              Ver expediente
            </SecondaryLink>
            <SecondaryLink href="/mantenimientos">Volver</SecondaryLink>
          </div>
        }
      />

      <Panel className="max-w-2xl">
        <form action={update} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Equipo *">
              <select
                name="maquinaId"
                required
                defaultValue={item.maquinaId}
                className={inputClass}
              >
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {machineName(m)} ({m.numeroSerie}) — {m.cliente.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tipo *">
            <select name="tipo" required defaultValue={item.tipo} className={inputClass}>
              {TIPOS_MANTENIMIENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select
              name="estado"
              defaultValue={item.estado}
              className={inputClass}
            >
              {ESTADOS_MANTENIMIENTO.map((estado) => (
                <option key={estado} value={estado}>
                  {labelEstado(estado)}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Título *">
              <input
                name="titulo"
                required
                defaultValue={item.titulo}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción del trabajo *">
              <textarea
                name="descripcion"
                required
                rows={5}
                defaultValue={item.descripcion}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Técnico">
            <input
              name="tecnico"
              defaultValue={item.tecnico ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Costo">
            <input
              name="costo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item.costo ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Fecha">
            <input
              name="fecha"
              type="date"
              defaultValue={toDateInput(item.fecha)}
              className={inputClass}
            />
          </Field>
          <Field label="Próximo mantenimiento">
            <input
              name="proximo"
              type="date"
              defaultValue={toDateInput(item.proximo)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Piezas / materiales">
              <textarea
                name="piezas"
                rows={2}
                defaultValue={item.piezas ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary">
              Guardar cambios
            </button>
            <button
              formAction={remove}
              className="btn-ghost text-[var(--danger)]"
            >
              Eliminar trabajo
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Cliente:{" "}
          <Link
            href={`/clientes/${item.maquina.clienteId}`}
            className="text-[var(--accent)] hover:underline"
          >
            {item.maquina.cliente.nombre}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
