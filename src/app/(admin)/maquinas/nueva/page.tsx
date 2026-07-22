import { createCatalogoMaquina } from "@/app/actions";
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
        description="Creá un modelo en el catálogo: marca, nombre e imagen. Después lo vas a poder asignar a clientes."
        action={<SecondaryLink href="/maquinas">Volver</SecondaryLink>}
      />
      <Panel className="max-w-xl">
        <form action={createCatalogoMaquina} className="grid gap-4">
          <Field label="Marca *">
            <input name="marca" required defaultValue="AGH" className={inputClass} />
          </Field>
          <Field label="Nombre *">
            <input
              name="nombre"
              required
              className={inputClass}
              placeholder="ODC, PDC, LS1000..."
              list="modelos-agh"
            />
            <datalist id="modelos-agh">
              <option value="ODC" />
              <option value="PDC" />
              <option value="LS1000" />
            </datalist>
          </Field>
          <Field label="Imagen">
            <input
              name="imagen"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={inputClass}
            />
          </Field>
          <button type="submit" className="btn-primary w-fit">
            Guardar en catálogo
          </button>
        </form>
      </Panel>
    </div>
  );
}
