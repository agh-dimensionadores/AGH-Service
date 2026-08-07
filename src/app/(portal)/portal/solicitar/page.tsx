import Link from "next/link";
import { solicitarMantenimientoCliente } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import { requireCliente } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";
import { TIPOS_MANTENIMIENTO, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalSolicitarPage({
  searchParams,
}: {
  searchParams: Promise<{ maquinaId?: string }>;
}) {
  const session = await requireCliente();
  const { maquinaId } = await searchParams;

  const unidades = await prismaPg.clienteMaquina.findMany({
    where: { idCliente: session.clienteId! },
    orderBy: { fechaCreacion: "desc" },
    include: {
      maquina: { select: { marca: true, modelo: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Solicitar arreglo"
        description="Pedí un mantenimiento o reparación. AGH lo verá como ticket abierto."
        action={<SecondaryLink href="/portal">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        {unidades.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            No tenés máquinas asignadas todavía.{" "}
            <Link href="/portal" className="text-[var(--accent)] underline">
              Volver al inicio
            </Link>
          </p>
        ) : (
          <GuardedForm
            action={solicitarMantenimientoCliente}
            className="grid gap-4"
          >
            <Field label="Máquina *">
              <select
                name="maquinaId"
                required
                defaultValue={maquinaId ?? ""}
                className={inputClass}
              >
                <option value="" disabled>
                  Seleccionar equipo...
                </option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {machineName(u)} ({u.numeroSerie})
                    {u.sitio ? ` · ${u.sitio}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo *">
              <select
                name="tipo"
                required
                className={inputClass}
                defaultValue="Correctivo"
              >
                {TIPOS_MANTENIMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descripción del problema *">
              <textarea
                name="descripcion"
                required
                rows={5}
                className={inputClass}
                placeholder="Contanos qué ocurre, desde cuándo y si hay mensajes de error..."
              />
            </Field>
            <SubmitButton className="btn-primary w-fit">
              Enviar solicitud
            </SubmitButton>
          </GuardedForm>
        )}
      </Panel>
    </div>
  );
}
