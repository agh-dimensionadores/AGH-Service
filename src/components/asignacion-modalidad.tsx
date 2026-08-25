"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui";

export function AsignacionModalidadFields({
  defaultModalidad = "venta",
}: {
  defaultModalidad?: "venta" | "alquiler";
}) {
  const [modalidad, setModalidad] = useState<"venta" | "alquiler">(
    defaultModalidad
  );

  return (
    <>
      <div className="sm:col-span-2">
        <Field label="Modalidad *">
          <select
            name="modalidad"
            required
            value={modalidad}
            onChange={(e) =>
              setModalidad(e.target.value === "alquiler" ? "alquiler" : "venta")
            }
            className={inputClass}
          >
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </Field>
      </div>

      {modalidad === "venta" ? (
        <Field label="Fecha de compra">
          <input name="fechaCompra" type="date" className={inputClass} />
        </Field>
      ) : (
        <>
          <Field label="Inicio del alquiler *">
            <input
              name="fechaInicioAlquiler"
              type="date"
              required
              className={inputClass}
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Fin del alquiler *">
            <input
              name="fechaFinAlquiler"
              type="date"
              required
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Comentario del alquiler">
              <textarea
                name="comentarioAlquiler"
                rows={3}
                className={inputClass}
                placeholder="Condiciones, observaciones, etc."
              />
            </Field>
          </div>
        </>
      )}
    </>
  );
}
