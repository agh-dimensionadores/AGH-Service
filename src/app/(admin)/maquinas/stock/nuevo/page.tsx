import { crearStockMaquina } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { marcaUsaStock } from "@/lib/marcas";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NuevoStockPage() {
  const catalogo = await prismaPg.maquina.findMany({
    orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    select: { idmachine: true, marca: true, modelo: true },
  });
  const modelosStock = catalogo.filter((c) => marcaUsaStock(c.marca));

  return (
    <div>
      <PageHeader
        title="Agregar stock"
        description="Cubiscan, Conlida o Cubetape. Cada unidad queda disponible para asignar a un cliente."
        action={<SecondaryLink href="/maquinas/stock">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {modelosStock.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            No hay modelos Cubiscan / Conlida / Cubetape en el catálogo.{" "}
            <Link href="/maquinas/nueva" className="text-[var(--accent)] underline">
              Agregá el modelo
            </Link>{" "}
            primero (con esa marca).
          </p>
        ) : (
          <GuardedForm
            action={crearStockMaquina}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <Field label="Modelo *">
                <select
                  name="catalogoId"
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>
                  {modelosStock.map((item) => (
                    <option key={item.idmachine} value={item.idmachine}>
                      {item.marca} {item.modelo}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Fecha importación *">
              <input
                name="fechaImportacion"
                type="date"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Despacho importación *">
              <input
                name="despachoImportacion"
                required
                maxLength={100}
                className={inputClass}
              />
            </Field>
            <Field label="PO *">
              <input name="po" required maxLength={100} className={inputClass} />
            </Field>
            <Field label="Origen *">
              <input
                name="origen"
                required
                maxLength={150}
                className={inputClass}
                placeholder="País / proveedor"
              />
            </Field>
            <Field label="Valor FO *">
              <input
                name="valorFo"
                required
                inputMode="decimal"
                className={inputClass}
                placeholder="0.00"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Nro(s). de serie *">
                <textarea
                  name="numerosSerie"
                  required
                  rows={3}
                  className={inputClass}
                  placeholder={"Una serie por línea, por ejemplo:\n040027\n040028"}
                />
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Cada serie crea una unidad en stock (así podés diferenciar dos
                  Cubiscan 100).
                </p>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Guardar en stock</SubmitButton>
            </div>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
