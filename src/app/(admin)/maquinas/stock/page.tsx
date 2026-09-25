import Link from "next/link";
import { deleteStockMaquina, updateStockPoImagen } from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { StockPoImagenField } from "@/components/stock-po-imagen-field";
import { prismaPg } from "@/lib/prisma";
import { marcaEsAgh, marcaEsImportacion } from "@/lib/marcas";
import { listStockPoImagenFlags } from "@/lib/stock-po-imagen";
import { machineName } from "@/lib/utils";
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

function formatMoney(value: { toString(): string } | null | undefined) {
  if (value == null) return "—";
  const n = Number(value.toString());
  if (Number.isNaN(n)) return value.toString();
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "—";
}

export default async function StockMaquinasPage() {
  const rows = await prismaPg.maquinaStock.findMany({
    orderBy: [{ estado: "asc" }, { creadoEn: "desc" }],
    include: {
      maquina: {
        select: { idmachine: true, marca: true, modelo: true },
      },
    },
  });

  const poFlags = await listStockPoImagenFlags(rows.map((r) => r.id));
  const disponibles = rows.filter((r) => r.estado === "disponible").length;

  return (
    <div>
      <PageHeader
        title="Stock"
        description="AGH y marcas importadas. Hay que tener stock para asignar a un cliente."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
            <PrimaryLink href="/maquinas/stock/nuevo">Agregar stock</PrimaryLink>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Sin stock"
          description="Cargá unidades para poder asignarlas a clientes."
          action={
            <PrimaryLink href="/maquinas/stock/nuevo">Agregar stock</PrimaryLink>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            {disponibles} disponible{disponibles === 1 ? "" : "s"} · {rows.length}{" "}
            total
          </p>
          <div className="space-y-4">
            {rows.map((row) => {
              const remove = deleteStockMaquina.bind(null, row.id);
              const agh = marcaEsAgh(row.maquina.marca);
              const importacion = marcaEsImportacion(row.maquina.marca);
              const hasPo = poFlags.get(row.id) === true;
              return (
                <section
                  key={row.id}
                  className="card overflow-hidden p-0 sm:grid sm:grid-cols-[1fr_auto]"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {machineName(row.maquina)}
                        </p>
                        <p className="mt-0.5 font-mono text-sm text-[var(--accent)]">
                          {row.numeroSerie}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-muted)]">
                          stock #{row.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          tone={row.estado === "disponible" ? "ok" : "neutral"}
                        >
                          {row.estado === "disponible"
                            ? "Disponible"
                            : "Asignado"}
                        </Badge>
                        {importacion ? (
                          <p className="mt-1 text-xs text-[var(--ink-muted)]">
                            {hasPo ? "Boleta con imagen" : "Sin imagen de boleta"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[var(--ink-muted)]">
                      {agh ? (
                        <>
                          Fab. {toDate(row.fechaFabricacion)}
                          {row.precio != null
                            ? ` · Precio ${formatMoney(row.precio)}`
                            : ""}
                        </>
                      ) : (
                        <>
                          Imp. {toDate(row.fechaImportacion)}
                          {row.despachoImportacion
                            ? ` · Desp. ${row.despachoImportacion}`
                            : ""}
                          {row.po ? ` · PO ${row.po}` : ""}
                          {row.origen ? ` · ${row.origen}` : ""}
                          {row.valorFo != null
                            ? ` · FO ${formatMoney(row.valorFo)}`
                            : ""}
                        </>
                      )}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {row.idClienteMaquina ? (
                        <Link
                          href={`/maquinas/${row.idClienteMaquina}`}
                          className="text-sm text-[var(--accent)] hover:underline"
                        >
                          Ver unidad asignada
                        </Link>
                      ) : null}
                      {row.estado === "disponible" ? (
                        <form action={remove}>
                          <DangerButton formAction={remove}>Quitar</DangerButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  {importacion ? (
                    <div className="border-t border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4 sm:w-80 sm:border-t-0 sm:border-l">
                      <GuardedForm
                        action={updateStockPoImagen.bind(null, row.id)}
                      >
                        <StockPoImagenField
                          stockId={row.id}
                          hasImage={hasPo}
                          compact
                        />
                        <div className="mt-3">
                          <SubmitButton>
                            {hasPo ? "Actualizar boleta" : "Guardar boleta"}
                          </SubmitButton>
                        </div>
                      </GuardedForm>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
