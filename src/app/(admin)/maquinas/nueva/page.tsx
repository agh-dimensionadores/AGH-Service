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
        description="Creá un modelo en el catálogo. En CubiScan, si el modelo es 100, 110, 150, 200 o 325 se usa la foto cubiscan de ese número."
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
              placeholder="100, 110, 150, ODC, PDC…"
              list="modelos-agh"
            />
            <datalist id="modelos-agh">
              <option value="100" />
              <option value="110" />
              <option value="150" />
              <option value="200" />
              <option value="325" />
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
              Opcional. CubiScan 100/110/150/200/325 ya tienen foto por modelo.
              Otras marcas: JPG, PNG, WEBP o GIF · máx. 5 MB.
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
