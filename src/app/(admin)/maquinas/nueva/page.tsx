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
        description="Creá un modelo en el catálogo PostgreSQL (tabla maquinas). Después lo asignás a clientes."
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
          <SubmitButton className="btn-primary w-fit">
            Guardar en catálogo
          </SubmitButton>
        </GuardedForm>
      </Panel>
    </div>
  );
}
