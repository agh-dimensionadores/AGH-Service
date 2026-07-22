import Link from "next/link";
import { asignarMaquina } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import {
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { ESTADOS_EQUIPO, labelEstado, machineThumbStyle } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AsignarMaquinaPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; catalogoId?: string }>;
}) {
  const { clienteId, catalogoId } = await searchParams;
  const [clientes, catalogo] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nombre: "asc" } }),
    prisma.catalogoMaquina.findMany({ orderBy: [{ marca: "asc" }, { nombre: "asc" }] }),
  ]);

  return (
    <div>
      <PageHeader
        title="Asignar máquina"
        description="Elegí un modelo del catálogo, el cliente, el nro. de serie y los datos de instalación."
        action={<SecondaryLink href="/maquinas">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {catalogo.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            Primero necesitás{" "}
            <Link href="/maquinas/nueva" className="text-[var(--accent)] underline">
              agregar una máquina al catálogo
            </Link>
            .
          </p>
        ) : clientes.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            Primero necesitás{" "}
            <Link href="/clientes/nuevo" className="text-[var(--accent)] underline">
              crear un cliente
            </Link>
            .
          </p>
        ) : (
          <form action={asignarMaquina} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Máquina del catálogo *">
                <select
                  name="catalogoId"
                  required
                  defaultValue={catalogoId ?? ""}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Seleccionar modelo...
                  </option>
                  {catalogo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.marca} {item.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {catalogo.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-[var(--line)]"
                  >
                    {item.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="h-20 w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-20 w-full"
                        style={machineThumbStyle(item.nombre)}
                      />
                    )}
                    <p className="px-2 py-1 text-xs text-[var(--ink-muted)]">
                      {item.marca} {item.nombre}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Field label="Cliente *">
              <select
                name="clienteId"
                required
                defaultValue={clienteId ?? ""}
                className={inputClass}
              >
                <option value="" disabled>
                  Seleccionar...
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa || c.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado del equipo">
              <select name="estadoEquipo" className={inputClass} defaultValue="operativa">
                {ESTADOS_EQUIPO.map((estado) => (
                  <option key={estado} value={estado}>
                    {labelEstado(estado)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nro. de serie *">
              <input name="numeroSerie" required className={inputClass} />
            </Field>
            <Field label="Fecha de compra">
              <input name="fechaCompra" type="date" className={inputClass} />
            </Field>
            <Field label="Ubicación">
              <input
                name="ubicacion"
                className={inputClass}
                placeholder="Muelle, packing, CEDIS..."
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción / notas de instalación">
                <textarea name="descripcion" rows={3} className={inputClass} />
              </Field>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                Asignar al cliente
              </button>
              <PrimaryLink href="/maquinas/nueva">Agregar otra al catálogo</PrimaryLink>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
