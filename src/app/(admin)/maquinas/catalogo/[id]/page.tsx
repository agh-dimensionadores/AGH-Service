import { notFound } from "next/navigation";
import {
  deleteCatalogoMaquina,
  updateCatalogoMaquina,
} from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { catalogImageUrl } from "@/lib/uploads";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { machineThumbStyle } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarCatalogoMaquinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const id = Number((await params).id);
  const { ok } = await searchParams;
  if (!Number.isInteger(id)) notFound();

  const item = await prismaPg.maquina.findUnique({
    where: { idmachine: id },
    select: {
      idmachine: true,
      marca: true,
      modelo: true,
      imagenMime: true,
      imagenUpdatedAt: true,
      _count: { select: { instalaciones: true } },
    },
  });
  if (!item) notFound();

  const update = updateCatalogoMaquina.bind(null, item.idmachine);
  const remove = deleteCatalogoMaquina.bind(null, item.idmachine);

  return (
    <div>
      <PageHeader
        title={`Editar ${item.marca} ${item.modelo ?? ""}`.trim()}
        description="Actualizá marca, modelo o foto del catálogo (PostgreSQL)."
        action={<SecondaryLink href="/maquinas">Volver</SecondaryLink>}
      />

      <Panel className="max-w-xl">
        {ok ? (
          <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
            Cambios guardados.
          </p>
        ) : null}
        {item.imagenMime ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${item.idmachine}-${item.imagenUpdatedAt?.getTime() ?? 0}`}
            src={catalogImageUrl(item.idmachine, item.imagenUpdatedAt)}
            alt={`${item.marca} ${item.modelo ?? ""}`}
            className="mb-4 machine-thumb object-cover"
          />
        ) : (
          <div
            className="mb-4 machine-thumb"
            style={machineThumbStyle(item.modelo ?? item.marca)}
          />
        )}

        <GuardedForm action={update} className="grid gap-4">
          <Field label="Marca *">
            <input
              name="marca"
              required
              defaultValue={item.marca}
              className={inputClass}
            />
          </Field>
          <Field label="Modelo">
            <input
              name="modelo"
              defaultValue={item.modelo ?? ""}
              className={inputClass}
              placeholder="ODC, PDC, PDL, CLD-100..."
              list="modelos-agh"
            />
            <datalist id="modelos-agh">
              <option value="ODC" />
              <option value="PDC" />
              <option value="PDL" />
              <option value="CLD-100" />
            </datalist>
          </Field>
          <Field label={item.imagenMime ? "Reemplazar imagen" : "Agregar imagen"}>
            <input
              name="imagen"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              JPG, PNG, WEBP o GIF · máx. 5 MB · se guarda en PostgreSQL.
              {item.imagenMime
                ? " Si subís una nueva, reemplaza la actual (no hace falta marcar quitar)."
                : ""}
            </p>
          </Field>
          {item.imagenMime ? (
            <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
              <input type="checkbox" name="quitarImagen" value="1" />
              Quitar imagen actual (sin subir otra)
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <SubmitButton>Guardar cambios</SubmitButton>
            {item._count.instalaciones === 0 ? (
              <DangerButton formAction={remove}>Eliminar modelo</DangerButton>
            ) : (
              <p className="text-xs text-[var(--ink-muted)]">
                No se puede eliminar: tiene {item._count.instalaciones} unidad
                {item._count.instalaciones === 1 ? "" : "es"} asignada
                {item._count.instalaciones === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </GuardedForm>
      </Panel>
    </div>
  );
}
