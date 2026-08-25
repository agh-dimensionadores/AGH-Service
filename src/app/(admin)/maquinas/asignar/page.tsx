import Link from "next/link";
import { asignarMaquina } from "@/app/actions";
import { AsignacionModalidadFields } from "@/components/asignacion-modalidad";
import { AsignacionCatalogoYSerie } from "@/components/asignacion-serie";
import { GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { listClientes, clienteLabel } from "@/lib/clientes";
import {
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  inputClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AsignarMaquinaPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; catalogoId?: string }>;
}) {
  const { clienteId, catalogoId } = await searchParams;
  const [clientes, catalogo] = await Promise.all([
    listClientes(),
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
        imagenMime: true,
        imagenUpdatedAt: true,
      },
    }),
  ]);

  const catalogoForClient = catalogo.map((item) => ({
    idmachine: item.idmachine,
    marca: item.marca,
    modelo: item.modelo,
    imagenMime: item.imagenMime,
    imagenUpdatedAt: item.imagenUpdatedAt
      ? item.imagenUpdatedAt.toISOString()
      : null,
  }));

  return (
    <div>
      <PageHeader
        title="Asignar máquina"
        description="Venta o alquiler: nro. de serie (prefijo del modelo o solo números en CubiScan), sitio y fechas."
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
          <GuardedForm action={asignarMaquina} className="grid gap-4 sm:grid-cols-2">
            <AsignacionCatalogoYSerie
              catalogo={catalogoForClient}
              defaultCatalogoId={catalogoId}
            />

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
                    {clienteLabel(c)}
                  </option>
                ))}
              </select>
            </Field>

            <AsignacionModalidadFields />

            <Field label="Fecha de fabricación">
              <input
                name="fechaFabricacion"
                type="date"
                className={inputClass}
              />
            </Field>
            <Field label="Sitio / ubicación">
              <input
                name="ubicacion"
                className={inputClass}
                placeholder="Muelle, packing, CEDIS..."
              />
            </Field>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <SubmitButton>Asignar al cliente</SubmitButton>
              <PrimaryLink href="/maquinas/nueva">Agregar otra al catálogo</PrimaryLink>
            </div>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
