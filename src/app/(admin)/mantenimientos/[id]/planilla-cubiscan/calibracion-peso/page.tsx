import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { guardarCalibracionPeso } from "@/app/actions";
import { CalibracionPesoForm } from "@/components/calibracion-peso-form";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";
import {
  calibracionModeloLabel,
  calibracionPesoAplica,
  emptyCalibracionPeso,
  extractCalibracionPeso,
} from "@/lib/calibracion-peso";
import { emptyCubiscanPayload } from "@/lib/cubiscan-planilla";
import { planillaKind } from "@/lib/planilla-template";
import { prismaPg } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalibracionPesoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { id: idParam } = await params;
  const { guardado } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const item = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    include: {
      instalacion: { include: { maquina: true } },
      ordenCubiscan: true,
    },
  });
  if (!item) notFound();

  const maquina = item.instalacion.maquina;
  const kind = planillaKind(maquina.marca, maquina.modelo);
  if (!kind) notFound();
  if (!calibracionPesoAplica(maquina.marca, maquina.modelo)) notFound();

  if (item.estado !== "cerrado") {
    redirect(`/mantenimientos/${id}`);
  }

  const locked = Boolean(item.ordenCubiscan?.emailEnviadoEn);
  const saved = extractCalibracionPeso(item.ordenCubiscan?.payload);
  const fechaRef = item.arreglado ?? new Date();
  const modeloEquipo = calibracionModeloLabel(maquina.marca, maquina.modelo);

  const planillaPayload = item.ordenCubiscan?.payload
    ? emptyCubiscanPayload(
        item.ordenCubiscan.payload as Record<string, unknown>
      )
    : null;

  const defaults = emptyCalibracionPeso({
    ...(saved ?? {}),
    activa: true,
    lugar:
      saved?.lugar ||
      planillaPayload?.ubicacion ||
      item.instalacion.sitio ||
      "",
    equipo: item.instalacion.numeroSerie,
    mes: saved?.mes || String(fechaRef.getMonth() + 1),
    anio: saved?.anio || String(fechaRef.getFullYear()),
    modeloEquipo,
    nombreIngeniero:
      saved?.nombreIngeniero ||
      planillaPayload?.ingenieros ||
      item.asignadoA ||
      "",
    firmaIngeniero: saved?.firmaIngeniero ?? "",
  });

  const submit = guardarCalibracionPeso.bind(null, item.id);
  const pdfHref = saved?.activa
    ? `/api/mantenimientos/${item.id}/calibracion-peso/pdf`
    : undefined;

  return (
    <div>
      <PageHeader
        title="Plantilla de calibración de peso"
        description={`${maquina.marca} ${maquina.modelo ?? ""} · ${item.instalacion.numeroSerie}`}
        action={
          <SecondaryLink href={`/mantenimientos/${id}/planilla-cubiscan`}>
            Volver a la planilla
          </SecondaryLink>
        }
      />

      {guardado === "1" ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Plantilla guardada. Podés seguir editando o descargar el PDF.
        </p>
      ) : null}

      {locked ? (
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          La orden ya fue enviada
          {item.ordenCubiscan?.emailEnviadoEn
            ? ` el ${formatDate(item.ordenCubiscan.emailEnviadoEn)}`
            : ""}
          . Solo podés ver y descargar esta plantilla.
        </p>
      ) : (
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Completá las mediciones de calibración de peso. Esta plantilla es
          opcional y no forma parte del mail de la orden de servicio principal.
        </p>
      )}

      <Panel className="max-w-5xl">
        <CalibracionPesoForm
          action={submit}
          defaults={defaults}
          readOnly={locked}
          mantenimientoId={item.id}
          pdfHref={pdfHref}
        />
      </Panel>

      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        <Link
          href={`/mantenimientos/${id}/planilla-cubiscan`}
          className="text-[var(--accent)] hover:underline"
        >
          ← Planilla de mantenimiento
        </Link>
      </p>
    </div>
  );
}
