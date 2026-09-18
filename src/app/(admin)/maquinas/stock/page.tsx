import Link from "next/link";
import { deleteStockMaquina } from "@/app/actions";
import { DangerButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { marcaEsAgh } from "@/lib/marcas";
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
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Nro. serie</th>
                  <th>Detalle</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const remove = deleteStockMaquina.bind(null, row.id);
                  const agh = marcaEsAgh(row.maquina.marca);
                  return (
                    <tr key={row.id}>
                      <td>
                        <p className="font-medium text-white">
                          {machineName(row.maquina)}
                        </p>
                        <p className="text-xs text-[var(--ink-muted)]">
                          #{row.id}
                        </p>
                      </td>
                      <td className="font-mono text-sm text-white">
                        {row.numeroSerie}
                      </td>
                      <td className="text-sm text-[var(--ink-muted)]">
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
                      </td>
                      <td>
                        <Badge
                          tone={row.estado === "disponible" ? "ok" : "neutral"}
                        >
                          {row.estado === "disponible"
                            ? "Disponible"
                            : "Asignado"}
                        </Badge>
                        {row.idClienteMaquina ? (
                          <p className="mt-1 text-xs">
                            <Link
                              href={`/maquinas/${row.idClienteMaquina}`}
                              className="text-[var(--accent)] hover:underline"
                            >
                              Ver unidad
                            </Link>
                          </p>
                        ) : null}
                      </td>
                      <td>
                        {row.estado === "disponible" ? (
                          <form action={remove}>
                            <DangerButton formAction={remove}>
                              Quitar
                            </DangerButton>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
