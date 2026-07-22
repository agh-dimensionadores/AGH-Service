import { createCliente } from "@/app/actions";
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
        description="Datos de la empresa u operación logística."
        action={<SecondaryLink href="/clientes">Volver</SecondaryLink>}
      />
      <Panel className="max-w-2xl">
        <form action={createCliente} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <input name="nombre" required className={inputClass} />
          </Field>
          <Field label="Empresa">
            <input name="empresa" className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" className={inputClass} />
          </Field>
          <Field label="Teléfono">
            <input name="telefono" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dirección">
              <input name="direccion" className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notas">
              <textarea name="notas" rows={3} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar cliente
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
