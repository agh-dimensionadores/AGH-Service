import { crearStockMaquina } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { StockAltaFields } from "@/components/stock-alta-fields";
import { prismaPg } from "@/lib/prisma";
import { marcaUsaStock } from "@/lib/marcas";
import {
  PageHeader,
  Panel,
  SecondaryLink,
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
        description="AGH: serie, fabricación y precio opcional. Cubiscan / Conlida / Cubetape: datos de importación."
        action={<SecondaryLink href="/maquinas/stock">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {modelosStock.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            No hay modelos AGH / Cubiscan / Conlida / Cubetape en el catálogo.{" "}
            <Link href="/maquinas/nueva" className="text-[var(--accent)] underline">
              Agregá el modelo
            </Link>{" "}
            primero.
          </p>
        ) : (
          <GuardedForm
            action={crearStockMaquina}
            className="grid gap-4 sm:grid-cols-2"
          >
            <StockAltaFields modelos={modelosStock} />
            <div className="sm:col-span-2">
              <SubmitButton>Guardar en stock</SubmitButton>
            </div>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
