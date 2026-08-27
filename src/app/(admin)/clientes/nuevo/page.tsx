import { createCliente } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";

export default function NuevoClientePage() {
  return (
    <div>
      <PageHeader
        title="Nuevo cliente"
        description="Se guarda en tu base PostgreSQL (tabla clientes)."
        action={<SecondaryLink href="/clientes">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        <GuardedForm action={createCliente} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <input name="nombre" required maxLength={100} className={inputClass} />
          </Field>
          <Field label="Empresa">
            <input name="empresa" maxLength={200} className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" maxLength={200} className={inputClass} />
          </Field>
          <Field label="Activo">
            <select name="activo" defaultValue="1" className={inputClass}>
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </Field>
          <div className="sm:col-span-2 text-sm text-[var(--ink-muted)]">
            El <strong>ID</strong> y el <strong>token</strong> se generan
            automáticamente al guardar.
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Guardar cliente</SubmitButton>
          </div>
        </GuardedForm>
      </Panel>
    </div>
  );
}
