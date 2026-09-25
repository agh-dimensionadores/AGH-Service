import Link from "next/link";
import { asignarMaquina } from "@/app/actions";
import { AsignacionCatalogoYSerie } from "@/components/asignacion-serie";
import { GuardedForm, SubmitButton } from "@/components/form";
import { UnidadFotosField } from "@/components/unidad-fotos-field";
import { RemitoFotosField } from "@/components/remito-fotos-field";
import { OrdenCompraFotosField } from "@/components/orden-compra-fotos-field";
import { prismaPg } from "@/lib/prisma";
import { listClientes, clienteLabel } from "@/lib/clientes";
import {
  Field,
  PageHeader,
  Panel,
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
  const [clientes, catalogo, stockDisponible] = await Promise.all([
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
    prismaPg.maquinaStock.findMany({
      where: { estado: "disponible" },
      orderBy: { creadoEn: "asc" },
      select: {
        id: true,
        idMaquina: true,
        numeroSerie: true,
        fechaImportacion: true,
        despachoImportacion: true,
        po: true,
        origen: true,
        valorFo: true,
        fechaFabricacion: true,
        precio: true,
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

  const stockForClient = stockDisponible.map((s) => ({
    id: s.id,
    idMaquina: s.idMaquina,
    numeroSerie: s.numeroSerie,
    fechaImportacion: s.fechaImportacion
      ? s.fechaImportacion.toISOString().slice(0, 10)
      : null,
    despachoImportacion: s.despachoImportacion,
    po: s.po,
    origen: s.origen,
    valorFo: s.valorFo?.toString() ?? null,
    fechaFabricacion: s.fechaFabricacion
      ? s.fechaFabricacion.toISOString().slice(0, 10)
      : null,
    precio: s.precio?.toString() ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Asignar máquina"
        description="Todas las marcas salen de stock. AGH: venta o alquiler. Cubiscan / Conlida / Cubetape: venta."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/maquinas/stock">Stock</SecondaryLink>
            <SecondaryLink href="/maquinas">Volver</SecondaryLink>
          </div>
        }
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
          <GuardedForm
            action={asignarMaquina}
            className="grid gap-4 sm:grid-cols-2"
          >
            <AsignacionCatalogoYSerie
              catalogo={catalogoForClient}
              stockDisponible={stockForClient}
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

            <Field label="Nro. de orden de compra">
              <input
                name="ordenCompra"
                maxLength={100}
                className={inputClass}
                placeholder="OC / nro. de orden del cliente"
                autoComplete="off"
              />
            </Field>
            <Field label="Nro. de remito">
              <input
                name="numeroRemito"
                maxLength={100}
                className={inputClass}
                placeholder="Nro. de remito de entrega"
                autoComplete="off"
              />
            </Field>
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
            <Field label="Dirección de máquina">
              <input
                name="direccionMaquina"
                maxLength={300}
                className={inputClass}
                placeholder="Calle, número, localidad…"
              />
            </Field>
            <Field label="AnyDesk (opcional)">
              <input
                name="anydesk"
                className={inputClass}
                placeholder="123 456 789"
                inputMode="numeric"
                autoComplete="off"
              />
            </Field>
            <Field label="Nro. serie PC (opcional)">
              <input
                name="serieCompu"
                className={inputClass}
                placeholder="Número de serie de la computadora"
                autoComplete="off"
              />
            </Field>
            <Field label="Nro. serie cámara (opcional)">
              <input
                name="serieCamara"
                className={inputClass}
                placeholder="Número de serie de la cámara"
                autoComplete="off"
              />
            </Field>
            <Field label="Nro. serie EcoFlow (opcional)">
              <input
                name="serieEcoflow"
                className={inputClass}
                placeholder="Número de serie del EcoFlow"
                autoComplete="off"
              />
            </Field>
            <Field label="Nro. serie pistola (opcional)">
              <input
                name="seriePistola"
                className={inputClass}
                placeholder="Número de serie de la pistola de código de barras"
                autoComplete="off"
              />
            </Field>
            <UnidadFotosField />
            <OrdenCompraFotosField />
            <RemitoFotosField />
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <SubmitButton>Asignar al cliente</SubmitButton>
            </div>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
