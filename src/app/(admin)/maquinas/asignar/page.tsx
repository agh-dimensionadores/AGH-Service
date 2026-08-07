import Link from "next/link";
import { asignarMaquina } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { listClientes, clienteLabel } from "@/lib/clientes";
import { catalogImageUrl } from "@/lib/uploads";
import {
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { machineThumbStyle } from "@/lib/utils";

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

  return (
    <div>
      <PageHeader
        title="Asignar máquina"
        description="Vinculá un modelo del catálogo a un cliente: nro. de serie, sitio y fecha de compra."
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
                    <option key={item.idmachine} value={item.idmachine}>
                      {item.marca} {item.modelo}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {catalogo.slice(0, 3).map((item) => (
                  <div
                    key={item.idmachine}
                    className="overflow-hidden rounded-lg border border-[var(--line)]"
                  >
                    {item.imagenMime ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={catalogImageUrl(item.idmachine, item.imagenUpdatedAt)}
                        alt={`${item.marca} ${item.modelo ?? ""}`}
                        className="h-20 w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-20 w-full"
                        style={machineThumbStyle(item.modelo ?? item.marca)}
                      />
                    )}
                    <p className="px-2 py-1 text-xs text-[var(--ink-muted)]">
                      {item.marca} {item.modelo}
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
                    {clienteLabel(c)}
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
