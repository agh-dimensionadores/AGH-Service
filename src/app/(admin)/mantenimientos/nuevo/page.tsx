import Link from "next/link";
import { createMantenimiento } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import {ESTADOS_MANTENIMIENTO, TIPOS_MANTENIMIENTO, labelEstado, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ maquinaId?: string }>;
}) {
  const { maquinaId } = await searchParams;
  const maquinas = await prisma.maquina.findMany({
    orderBy: { marca: "asc" },
    include: { cliente: true, catalogo: true },
  });

  return (
    <div>
      <PageHeader
        title="Nuevo mantenimiento"
        description="Registrá el trabajo en el expediente del dimensionador (calibración, service, correctivo)."
        action={<SecondaryLink href="/mantenimientos">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {maquinas.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            Primero necesitás{" "}
            <Link href="/maquinas/nueva" className="text-[var(--accent)] underline">
              registrar un equipo
            </Link>
            .
          </p>
        ) : (
          <form action={createMantenimiento} className="grid gap-4 sm:grid-cols-2">
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
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {machineName(m)} ({m.numeroSerie}) — {m.cliente.nombre}
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
            <Field label="Estado">
              <select name="estado" className={inputClass} defaultValue="completado">
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
                  className={inputClass}
                  placeholder="Ej: Calibración volumétrica trimestral"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Descripción del trabajo *">
                <textarea
                  name="descripcion"
                  required
                  rows={5}
                  className={inputClass}
                  placeholder="Detalle del expediente: sensores, calibración, firmware, integración WMS/balanza..."
                />
              </Field>
            </div>
            <Field label="Técnico">
              <input name="tecnico" className={inputClass} />
            </Field>
            <Field label="Costo">
              <input name="costo" type="number" step="0.01" min="0" className={inputClass} />
            </Field>
            <Field label="Fecha">
              <input
                name="fecha"
                type="date"
                className={inputClass}
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <Field label="Próximo mantenimiento">
              <input name="proximo" type="date" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Piezas / materiales">
                <textarea name="piezas" rows={2} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                Guardar en expediente
              </button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
