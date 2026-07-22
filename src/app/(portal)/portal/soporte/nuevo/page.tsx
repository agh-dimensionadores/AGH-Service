import { createSoporteAction } from "@/app/auth-actions";
import { requireCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const maquinas = await prisma.maquina.findMany({
    where: { clienteId: session.clienteId! },
    orderBy: { creadoEn: "desc" },
    include: { catalogo: true },
  });

  return (
    <div>
      <PageHeader
        title="Solicitar soporte técnico"
        description="Contanos qué pasa con tu equipo y te contactamos."
        action={<SecondaryLink href="/portal/soporte">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        <form action={createSoporteAction} className="grid gap-4">
          <Field label="Máquina (opcional)">
            <select
              name="maquinaId"
              defaultValue={maquinaId ?? ""}
              className={inputClass}
            >
              <option value="">General / sin máquina específica</option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.id}>
                  {machineName(m)} ({m.numeroSerie})
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
          <button type="submit" className="btn-primary w-fit">
            Enviar solicitud
          </button>
        </form>
      </Panel>
    </div>
  );
}
