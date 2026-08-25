import Link from "next/link";
import { createMantenimiento } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { getClientesMap, clienteLabel } from "@/lib/clientes";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { TIPOS_MANTENIMIENTO, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ maquinaId?: string }>;
}) {
  const { maquinaId } = await searchParams;
  const unidades = await prismaPg.clienteMaquina.findMany({
    orderBy: { fechaCreacion: "desc" },
    include: { maquina: true },
  });
  const clientesMap = await getClientesMap(unidades.map((u) => u.idCliente));

  return (
    <div>
      <PageHeader
        title="Nuevo mantenimiento"
        description="Se registra siempre como abierto. Después lo cerrás cuando lo realicen."
        action={<SecondaryLink href="/mantenimientos">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {unidades.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            Primero necesitás{" "}
            <Link href="/maquinas/asignar" className="text-[var(--accent)] underline">
              asignar un equipo a un cliente
            </Link>
            .
          </p>
        ) : (
          <GuardedForm action={createMantenimiento} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Equipo *">
                <select
                  name="maquinaId"
                  required
                  defaultValue={maquinaId ?? ""}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>
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
              <select name="tipo" required className={inputClass} defaultValue="Preventivo">
                {TIPOS_MANTENIMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Solicitado">
              <input
                name="solicitado"
                type="date"
                className={inputClass}
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción">
                <textarea
                  name="descripcion"
                  rows={5}
                  className={inputClass}
                  placeholder="Detalle del trabajo..."
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Guardar solicitud</SubmitButton>
            </div>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
