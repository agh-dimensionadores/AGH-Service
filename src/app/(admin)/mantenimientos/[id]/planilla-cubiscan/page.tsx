import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  reenviarPlanillaCubiscan,
  submitPlanillaCubiscan,
} from "@/app/actions";
import { CubiscanFotosField } from "@/components/cubiscan-fotos-field";
import { CubiscanPlanillaForm } from "@/components/cubiscan-planilla-form";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { GuardedForm, SubmitButton } from "@/components/form";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { getCliente, clienteLabel } from "@/lib/clientes";
import {
  emptyCubiscanPayload,
  stripPlanillaBoilerplate,
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";
import { calibracionPesoAplica, extractCalibracionPeso } from "@/lib/calibracion-peso";
import { mailConfigured } from "@/lib/mail";
import {
  planillaKind,
  planillaModeloFromMaquina,
  planillaPageTitle,
} from "@/lib/planilla-template";
import { prismaPg } from "@/lib/prisma";
import { formatDate, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlanillaCubiscanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    enviado?: string;
    guardado?: string;
    mail?: string;
  }>;
}) {
  const { id: idParam } = await params;
  const { enviado, guardado, mail } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const item = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    include: {
      instalacion: { include: { maquina: true } },
      ordenCubiscan: {
        include: { fotos: { select: { id: true }, orderBy: { orden: "asc" } } },
      },
    },
  });
  if (!item) notFound();

  const maquina = item.instalacion.maquina;
  const kind = planillaKind(maquina.marca, maquina.modelo);
  if (!kind) notFound();

  if (item.estado !== "cerrado") {
    redirect(`/mantenimientos/${id}`);
  }

  const cliente = await getCliente(item.instalacion.idCliente);
  const modelo = planillaModeloFromMaquina(maquina.marca, maquina.modelo);

  const saved = item.ordenCubiscan;
  const savedPayload = saved?.payload as CubiscanOrdenPayload | null;
  const defaults = emptyCubiscanPayload({
    ...(savedPayload ?? {}),
    modelo,
    ingenieros: savedPayload?.ingenieros || item.asignadoA || "",
    cliente: clienteLabel(cliente),
    numeroSerie: item.instalacion.numeroSerie,
    ubicacion: savedPayload?.ubicacion || item.instalacion.sitio || "",
    fecha:
      savedPayload?.fecha ||
      (item.arreglado
        ? item.arreglado.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)),
    comentarios: stripPlanillaBoilerplate(savedPayload?.comentarios),
    representanteCubiscan:
      savedPayload?.representanteCubiscan || item.asignadoA || "",
    nroOrden: savedPayload?.nroOrden || String(item.id),
  });

  const locked = Boolean(saved?.emailEnviadoEn);
  const submit = submitPlanillaCubiscan.bind(null, item.id);
  const reenviar = reenviarPlanillaCubiscan.bind(null, item.id);
  const emailDefault = saved?.emailDestino || cliente?.email || "";
  const pdfHref = `/api/mantenimientos/${item.id}/planilla-cubiscan/pdf`;
  const esCubiscan = calibracionPesoAplica(maquina.marca, maquina.modelo);
  const calibracion = esCubiscan ? extractCalibracionPeso(saved?.payload) : null;
  const calibracionHref = esCubiscan
    ? `/mantenimientos/${item.id}/planilla-cubiscan/calibracion-peso`
    : undefined;
  const calibracionPdfHref =
    esCubiscan && calibracion?.activa
      ? `/api/mantenimientos/${item.id}/calibracion-peso/pdf`
      : undefined;

  return (
    <div>
      <PageHeader
        title={planillaPageTitle(kind)}
        description={`${machineName(item.instalacion)} · ${clienteLabel(cliente)} · Orden de servicio`}
        action={
          <SecondaryLink href={`/mantenimientos/${item.id}`}>
            Volver al trabajo
          </SecondaryLink>
        }
      />

      {enviado === "1" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Orden enviada por correo
          {saved?.emailDestino ? ` a ${saved.emailDestino}` : ""}.
        </p>
      ) : null}
      {guardado === "1" ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Planilla guardada. Podés seguir editando hasta enviar el mail.
          {mail ? ` ${decodeURIComponent(mail)}` : ""}
        </p>
      ) : null}

      {saved?.emailEnviadoEn ? (
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Enviada el {formatDate(saved.emailEnviadoEn)}
          {saved.emailDestino ? ` → ${saved.emailDestino}` : ""}. Ya no se puede
          editar.
        </p>
      ) : null}

      <Panel className="max-w-3xl">
        {locked ? (
          <div className="space-y-5">
            <GuardedForm action={reenviar} className="space-y-4">
              <Field label="Email del cliente">
                <input
                  name="emailDestino"
                  type="email"
                  required
                  defaultValue={emailDefault}
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <DownloadPdfButton href={pdfHref}>
                  Descargar PDF
                </DownloadPdfButton>
                <SubmitButton pendingLabel="Enviando…">Enviar mail</SubmitButton>
              </div>
            </GuardedForm>
            {!mailConfigured() ? (
              <p className="text-xs text-[var(--ink-muted)]">
                Falta configurar SMTP en el servidor (.env).
              </p>
            ) : null}
            {(saved?.fotos?.length ?? 0) > 0 ? (
              <CubiscanFotosField
                mantenimientoId={item.id}
                existing={saved?.fotos ?? []}
                readOnly
              />
            ) : null}
            {calibracionHref ? (
              <div className="flex flex-wrap items-center gap-2">
                <SecondaryLink href={calibracionHref}>
                  Plantilla de calibración de peso
                </SecondaryLink>
                {calibracionPdfHref ? (
                  <DownloadPdfButton href={calibracionPdfHref}>
                    PDF calibración
                  </DownloadPdfButton>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-[var(--ink-muted)]">
              Completá la planilla técnica y guardá. Podés registrar la firma del
              cliente acá en la visita (desde tu celular). El cliente puede
              calificar el servicio desde su portal hasta que envíes el mail.
            </p>
            <CubiscanPlanillaForm
              action={submit}
              defaults={defaults}
              emailDefault={emailDefault}
              readOnly={false}
              firmaIngeniero={saved?.firmaIngeniero ?? ""}
              firmaCliente={saved?.firmaCliente ?? ""}
              mantenimientoId={item.id}
              fotos={saved?.fotos ?? []}
              kind={kind}
              pdfHref={saved ? pdfHref : undefined}
              calibracionDisponible={esCubiscan}
              calibracionHref={calibracionHref}
              calibracionPdfHref={calibracionPdfHref}
            />
          </>
        )}

        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Equipo:{" "}
          <Link
            href={`/maquinas/${item.idClienteMaquina}`}
            className="text-[var(--accent)] hover:underline"
          >
            {machineName(item.instalacion)}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
