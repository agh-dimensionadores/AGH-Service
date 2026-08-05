import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMantenimiento, updateMantenimiento } from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { getCliente, getClientesMap, clienteLabel } from "@/lib/clientes";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import {
  ESTADOS_MANTENIMIENTO,
  TIPOS_MANTENIMIENTO,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

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
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [item, unidades] = await Promise.all([
    prismaPg.clienteMantenimiento.findUnique({
      where: { id },
      include: { instalacion: { include: { maquina: true } } },
    }),
    prismaPg.clienteMaquina.findMany({
      orderBy: { fechaCreacion: "desc" },
      include: { maquina: true },
    }),
  ]);

  if (!item) notFound();

  const [cliente, clientesMap] = await Promise.all([
    getCliente(item.instalacion.idCliente),
    getClientesMap(unidades.map((u) => u.idCliente)),
  ]);

  const update = updateMantenimiento.bind(null, item.id);
  const remove = deleteMantenimiento.bind(null, item.id);

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

      <Panel className="max-w-2xl">
        <GuardedForm action={update} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Equipo *">
              <select
                name="maquinaId"
                required
                defaultValue={item.idClienteMaquina}
                className={inputClass}
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {machineName(u)} ({u.numeroSerie}) —{" "}
                    {clienteLabel(clientesMap.get(u.idCliente))}
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
            <select name="estado" defaultValue={item.estado} className={inputClass}>
              {ESTADOS_MANTENIMIENTO.map((estado) => (
                <option key={estado} value={estado}>
                  {labelEstado(estado)}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <textarea
                name="descripcion"
                rows={5}
                defaultValue={item.descripcion ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Solicitado">
            <input
              name="solicitado"
              type="date"
              defaultValue={toDateInput(item.solicitado)}
              className={inputClass}
            />
          </Field>
          <Field label="Arreglado">
            <input
              name="arreglado"
              type="date"
              defaultValue={toDateInput(item.arreglado)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <SubmitButton>Guardar cambios</SubmitButton>
            <DangerButton formAction={remove}>Eliminar trabajo</DangerButton>
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
