import { notFound, redirect } from "next/navigation";
import { guardarEncuestaCliente } from "@/app/actions";
import { CubiscanSurveyForm } from "@/components/cubiscan-survey-form";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";
import { requireCliente } from "@/lib/auth";
import { emptyCubiscanPayload, type CubiscanOrdenPayload } from "@/lib/cubiscan-planilla";
import { planillaKind } from "@/lib/planilla-template";
import { prismaPg } from "@/lib/prisma";
import { formatDate, machineName, mantenimientoTitulo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalEncuestaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const session = await requireCliente();
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
  if (!item || item.instalacion.idCliente !== session.clienteId) notFound();

  const kind = planillaKind(
    item.instalacion.maquina.marca,
    item.instalacion.maquina.modelo
  );
  if (!kind) notFound();

  if (item.estado !== "cerrado") {
    redirect("/portal/historial");
  }

  if (!item.ordenCubiscan) {
    return (
      <div>
        <PageHeader
          title="Calificar servicio"
          description={mantenimientoTitulo(item)}
          action={<SecondaryLink href="/portal/historial">Volver</SecondaryLink>}
        />
        <Panel className="max-w-2xl text-sm text-[var(--ink-muted)]">
          El técnico todavía está preparando la orden de servicio. Volvé a
          intentar más tarde desde el historial.
        </Panel>
      </div>
    );
  }

  const locked = Boolean(item.ordenCubiscan.emailEnviadoEn);
  const savedPayload = item.ordenCubiscan.payload as CubiscanOrdenPayload | null;
  const defaults = emptyCubiscanPayload({
    ...(savedPayload ?? {}),
    representanteCubiscan:
      savedPayload?.representanteCubiscan || item.asignadoA || "",
  });

  const submit = guardarEncuestaCliente.bind(null, item.id);

  return (
    <div>
      <PageHeader
        title="Calificar servicio"
        description={`${mantenimientoTitulo(item)} · ${machineName(item.instalacion)}`}
        action={<SecondaryLink href="/portal/historial">Volver</SecondaryLink>}
      />

      {guardado === "1" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Calificación guardada. Podés editarla hasta que AGH envíe la orden por
          correo.
        </p>
      ) : null}

      {locked ? (
        <Panel className="max-w-2xl">
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            La orden ya fue enviada
            {item.ordenCubiscan.emailEnviadoEn
              ? ` el ${formatDate(item.ordenCubiscan.emailEnviadoEn)}`
              : ""}
            . La encuesta ya no se puede modificar.
          </p>
          <CubiscanSurveyForm
            action={submit}
            defaults={defaults}
            representanteNombre={item.asignadoA || defaults.representanteCubiscan}
            kind={kind}
            readOnly
          />
        </Panel>
      ) : (
        <Panel className="max-w-2xl">
          <CubiscanSurveyForm
            action={submit}
            defaults={defaults}
            representanteNombre={item.asignadoA || defaults.representanteCubiscan}
            kind={kind}
          />
        </Panel>
      )}
    </div>
  );
}
