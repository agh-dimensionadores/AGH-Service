import { createSoporteAction } from "@/app/auth-actions";
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
import { machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NuevoSoportePage({
  searchParams,
}: {
  searchParams: Promise<{ maquinaId?: string }>;
}) {
  const session = await requireCliente();
  const { maquinaId } = await searchParams;
  const unidades = await prismaPg.clienteMaquina.findMany({
    where: { idCliente: session.clienteId! },
    orderBy: { fechaCreacion: "desc" },
    include: { maquina: true },
  });

  return (
    <div>
      <PageHeader
        title="Solicitar soporte técnico"
        description="Contanos qué pasa con tu equipo y te contactamos."
        action={<SecondaryLink href="/portal/soporte">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        <GuardedForm action={createSoporteAction} className="grid gap-4">
          <Field label="Máquina (opcional)">
            <select
              name="maquinaId"
              defaultValue={maquinaId ?? ""}
              className={inputClass}
            >
              <option value="">General / sin máquina específica</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {machineName(u)} ({u.numeroSerie})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Asunto *">
            <input
              name="titulo"
              required
              className={inputClass}
              placeholder="Ej: Error de captura en ODC"
            />
          </Field>
          <Field label="Detalle *">
            <textarea
              name="mensaje"
              required
              rows={5}
              className={inputClass}
              placeholder="Describí el problema, desde cuándo ocurre y si hay mensajes de error..."
            />
          </Field>
          <SubmitButton className="btn-primary w-fit">
            Enviar solicitud
          </SubmitButton>
        </GuardedForm>
      </Panel>
    </div>
  );
}
