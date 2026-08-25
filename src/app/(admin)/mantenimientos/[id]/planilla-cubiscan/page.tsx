import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cerrarConPlanillaCubiscan,
  reenviarPlanillaCubiscan,
} from "@/app/actions";
import { CubiscanPlanillaForm } from "@/components/cubiscan-planilla-form";
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
  type CubiscanOrdenPayload,
} from "@/lib/cubiscan-planilla";
import { mailConfigured } from "@/lib/mail";
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
      ordenCubiscan: true,
    },
  });
  if (!item) notFound();

  const marca = (item.instalacion.maquina.marca || "").trim().toLowerCase();
  if (marca !== "cubiscan") notFound();

  const cliente = await getCliente(item.instalacion.idCliente);
  const modelo = [
    item.instalacion.maquina.marca,
    item.instalacion.maquina.modelo,
  ]
    .filter(Boolean)
    .join(" ");

  const saved = item.ordenCubiscan;
  const savedPayload = saved?.payload as CubiscanOrdenPayload | null;
  const defaults = emptyCubiscanPayload({
    ...(savedPayload ?? {}),
    modelo: savedPayload?.modelo || modelo,
    ingenieros:
      savedPayload?.ingenieros || item.asignadoA || "",
    cliente: savedPayload?.cliente || clienteLabel(cliente),
    numeroSerie: savedPayload?.numeroSerie || item.instalacion.numeroSerie,
    ubicacion: savedPayload?.ubicacion || item.instalacion.sitio || "",
    fecha:
      savedPayload?.fecha ||
      (item.arreglado
        ? item.arreglado.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)),
    comentarios:
      savedPayload?.comentarios || item.comentarioArreglo || "",
    representanteCubiscan:
      savedPayload?.representanteCubiscan || item.asignadoA || "",
    nroOrden: savedPayload?.nroOrden || String(item.id),
  });

  const readOnly = Boolean(saved) && item.estado === "cerrado";
  const submit = cerrarConPlanillaCubiscan.bind(null, item.id);
  const reenviar = reenviarPlanillaCubiscan.bind(null, item.id);
  const emailDefault =
    saved?.emailDestino || cliente?.email || "";

  return (
    <div>
      <PageHeader
        title="Planilla CubiScan"
        description={`${machineName(item.instalacion)} · ${clienteLabel(cliente)} · Orden de servicio`}
        action={
          <div className="flex flex-wrap gap-2">
            {saved ? (
              <a
                href={`/api/mantenimientos/${item.id}/planilla-cubiscan/pdf`}
                className="btn-primary"
              >
                Descargar PDF
              </a>
            ) : null}
            <SecondaryLink href={`/mantenimientos/${item.id}`}>
              Volver al trabajo
            </SecondaryLink>
          </div>
        }
      />

      {enviado === "1" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Orden guardada y enviada por correo
          {saved?.emailDestino ? ` a ${saved.emailDestino}` : ""}.
        </p>
      ) : null}
      {guardado === "1" ? (
        <p className="mb-4 rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-muted)]">
          Planilla guardada y trabajo cerrado.
          {mail ? ` Correo: ${decodeURIComponent(mail)}` : ""}
          {!mailConfigured() ? (
            <>
              {" "}
              Configurá SMTP en <code className="text-white">.env</code> para
              enviar automáticamente.
            </>
          ) : null}
        </p>
      ) : null}

      {saved?.emailEnviadoEn ? (
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Último envío: {formatDate(saved.emailEnviadoEn)}
          {saved.emailDestino ? ` → ${saved.emailDestino}` : ""}
        </p>
      ) : null}

      <Panel className="max-w-3xl">
        <CubiscanPlanillaForm
          action={submit}
          defaults={defaults}
          emailDefault={emailDefault}
          readOnly={readOnly}
          firmaIngeniero={saved?.firmaIngeniero ?? ""}
          firmaCliente={saved?.firmaCliente ?? ""}
        />

        {readOnly ? (
          <div className="mt-6 space-y-5 border-t border-[var(--line)] pt-5">
            <div>
              <h3 className="mb-2 font-medium text-white">Descargar</h3>
              <a
                href={`/api/mantenimientos/${item.id}/planilla-cubiscan/pdf`}
                className="btn-primary inline-flex"
              >
                Descargar PDF de la orden
              </a>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-white">Reenviar por email</h3>
              <GuardedForm
                action={reenviar}
                className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
              >
                <Field label="Email del cliente">
                  <input
                    name="emailDestino"
                    type="email"
                    required
                    defaultValue={emailDefault}
                    className={inputClass}
                  />
                </Field>
                <SubmitButton pendingLabel="Enviando…">Reenviar</SubmitButton>
              </GuardedForm>
              {!mailConfigured() ? (
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  Falta configurar SMTP en el servidor (.env).
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

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
