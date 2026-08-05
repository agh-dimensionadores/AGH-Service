"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prismaPg } from "@/lib/prisma";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(formData: FormData, key: string) {
  const value = str(formData, key);
  return value || null;
}

function optionalInt(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function requiredInt(formData: FormData, key: string) {
  const n = optionalInt(formData, key);
  if (n == null) throw new Error(`${key} es obligatorio`);
  return n;
}

function optionalDate(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  return new Date(value);
}

function newClientToken() {
  return randomBytes(24).toString("hex").slice(0, 100);
}

function touch(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function createCliente(formData: FormData) {
  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  const empresa = optionalStr(formData, "empresa");
  const email = optionalStr(formData, "email");
  const token = newClientToken();
  const activo = optionalInt(formData, "activo") ?? 1;

  // Un solo round-trip a Render: insert + set cliente_id = id
  const rows = await prismaPg.$queryRaw<{ id: number }[]>`
    WITH inserted AS (
      INSERT INTO clientes (nombre, empresa, email, token, activo, fecha_creacion)
      VALUES (${nombre}, ${empresa}, ${email}, ${token}, ${activo}, NOW())
      RETURNING id
    )
    UPDATE clientes AS c
    SET cliente_id = inserted.id
    FROM inserted
    WHERE c.id = inserted.id
    RETURNING c.id
  `;

  const id = rows[0]?.id;
  if (!id) throw new Error("No se pudo crear el cliente");

  touch("/clientes");
  redirect(`/clientes/${id}`);
}

export async function updateCliente(id: number, formData: FormData) {
  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prismaPg.cliente.update({
    where: { id },
    data: {
      nombre,
      empresa: optionalStr(formData, "empresa"),
      email: optionalStr(formData, "email"),
      activo: optionalInt(formData, "activo") ?? 1,
    },
  });

  touch(`/clientes/${id}`, "/clientes");
  redirect(`/clientes/${id}`);
}

export async function deleteCliente(id: number) {
  await prismaPg.cliente.delete({ where: { id } });
  touch("/clientes");
  redirect("/clientes");
}

export async function createCloudUser(clienteId: number, formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const fullName = optionalStr(formData, "fullName");

  if (!email || !email.includes("@")) {
    throw new Error("Ingresá un email válido para el usuario");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const cliente = await prismaPg.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });
  if (!cliente) throw new Error("El cliente no existe");

  const exists = await prismaPg.cloudUser.findUnique({
    where: { email },
    select: { id: true },
  });
  if (exists) throw new Error("Ya existe un usuario de Voxel Cloud con ese email");

  await prismaPg.cloudUser.create({
    data: {
      email,
      fullName,
      // Voxel Cloud actualmente valida hashes SHA-256 hexadecimales.
      passwordHash: createHash("sha256").update(password).digest("hex"),
      role: "viewer",
      clienteId,
      isActive: true,
      createdAt: new Date(),
    },
  });

  touch(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?cloudUser=created`);
}

/** Catálogo: tabla maquinas */
export async function createCatalogoMaquina(formData: FormData) {
  const marca = str(formData, "marca");
  const modelo = optionalStr(formData, "modelo");
  if (!marca) throw new Error("La marca es obligatoria");

  await prismaPg.maquina.create({
    data: { marca, modelo },
  });

  touch("/maquinas");
  redirect("/maquinas");
}

export async function deleteCatalogoMaquina(id: number) {
  const usadas = await prismaPg.clienteMaquina.count({
    where: { idMaquina: id },
  });
  if (usadas > 0) {
    throw new Error("No se puede eliminar: hay unidades asignadas de este modelo");
  }
  await prismaPg.maquina.delete({ where: { idmachine: id } });
  touch("/maquinas");
  redirect("/maquinas");
}

/** Asignar unidad: clientes_maquinas */
export async function asignarMaquina(formData: FormData) {
  const idCliente = requiredInt(formData, "clienteId");
  const idMaquina = requiredInt(formData, "catalogoId");
  const numeroSerie = str(formData, "numeroSerie");
  if (!numeroSerie) throw new Error("El nro. de serie es obligatorio");

  const unidad = await prismaPg.clienteMaquina.create({
    data: {
      idCliente,
      idMaquina,
      numeroSerie,
      sitio: optionalStr(formData, "ubicacion"),
      fechaCompra: optionalDate(formData, "fechaCompra"),
    },
  });

  touch("/maquinas", `/clientes/${idCliente}`);
  redirect(`/maquinas/${unidad.id}`);
}

export async function updateMaquina(id: number, formData: FormData) {
  const idCliente = requiredInt(formData, "clienteId");
  const idMaquina = requiredInt(formData, "catalogoId");
  const numeroSerie = str(formData, "numeroSerie");
  if (!numeroSerie) throw new Error("El nro. de serie es obligatorio");

  await prismaPg.clienteMaquina.update({
    where: { id },
    data: {
      idCliente,
      idMaquina,
      numeroSerie,
      sitio: optionalStr(formData, "ubicacion"),
      fechaCompra: optionalDate(formData, "fechaCompra"),
    },
  });

  touch(`/maquinas/${id}`, "/maquinas", `/clientes/${idCliente}`);
  redirect(`/maquinas/${id}`);
}

export async function deleteMaquina(id: number) {
  const unidad = await prismaPg.clienteMaquina.delete({ where: { id } });
  touch("/maquinas", `/clientes/${unidad.idCliente}`);
  redirect("/maquinas");
}

export async function createMantenimiento(formData: FormData) {
  const idClienteMaquina = requiredInt(formData, "maquinaId");
  const tipo = str(formData, "tipo");
  const descripcion = optionalStr(formData, "descripcion");
  if (!tipo) throw new Error("El tipo es obligatorio");

  await prismaPg.clienteMantenimiento.create({
    data: {
      idClienteMaquina,
      tipo,
      descripcion,
      estado: str(formData, "estado") || "abierto",
      solicitado: optionalDate(formData, "solicitado") ?? new Date(),
      arreglado: optionalDate(formData, "arreglado"),
    },
  });

  touch("/mantenimientos", `/maquinas/${idClienteMaquina}`);
  redirect(`/maquinas/${idClienteMaquina}`);
}

export async function updateMantenimiento(id: number, formData: FormData) {
  const idClienteMaquina = requiredInt(formData, "maquinaId");
  const tipo = str(formData, "tipo");
  if (!tipo) throw new Error("El tipo es obligatorio");

  await prismaPg.clienteMantenimiento.update({
    where: { id },
    data: {
      idClienteMaquina,
      tipo,
      descripcion: optionalStr(formData, "descripcion"),
      estado: str(formData, "estado") || "abierto",
      solicitado: optionalDate(formData, "solicitado") ?? new Date(),
      arreglado: optionalDate(formData, "arreglado"),
    },
  });

  touch(`/mantenimientos/${id}`, `/maquinas/${idClienteMaquina}`, "/mantenimientos");
  redirect(`/maquinas/${idClienteMaquina}`);
}

export async function deleteMantenimiento(id: number) {
  const item = await prismaPg.clienteMantenimiento.delete({ where: { id } });
  touch(`/maquinas/${item.idClienteMaquina}`, "/mantenimientos");
  redirect(`/maquinas/${item.idClienteMaquina}`);
}
