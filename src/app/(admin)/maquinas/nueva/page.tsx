import { createCatalogoMaquina } from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import {
  Field,
  PageHeader,
  Panel,
  SecondaryLink,
  inputClass,
} from "@/components/ui";

export default function NuevaMaquinaPage() {
  return (
    <div>
      <PageHeader
        title="Agregar máquina"
        description="Creá un modelo en el catálogo PostgreSQL (tabla maquinas). La foto se guarda en la base (BYTEA)."
        action={<SecondaryLink href="/maquinas">Volver</SecondaryLink>}
      />
      <Panel className="max-w-xl">
        <GuardedForm action={createCatalogoMaquina} className="grid gap-4">
          <Field label="Marca *">
            <input name="marca" required defaultValue="AGH" className={inputClass} />
          </Field>
          <Field label="Modelo">
            <input
              name="modelo"
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
          <Field label="Imagen">
            <input
              name="imagen"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              JPG, PNG, WEBP o GIF · máx. 5 MB · se guarda en PostgreSQL
            </p>
          </Field>
          <SubmitButton className="btn-primary w-fit">
            Guardar en catálogo
          </SubmitButton>
        </GuardedForm>
      </Panel>
    </div>
  );
}
