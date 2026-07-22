"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/lib/uploads";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(formData: FormData, key: string) {
  const value = str(formData, key);
  return value || null;
}

function optionalFloat(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function optionalDate(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  return new Date(value);
}

function fileFrom(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export async function createCliente(formData: FormData) {
  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      empresa: optionalStr(formData, "empresa"),
      email: optionalStr(formData, "email"),
      telefono: optionalStr(formData, "telefono"),
      direccion: optionalStr(formData, "direccion"),
      notas: optionalStr(formData, "notas"),
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/");
  redirect(`/clientes/${cliente.id}`);
}

export async function updateCliente(id: string, formData: FormData) {
  const nombre = str(formData, "nombre");
  if (!nombre) throw new Error("El nombre es obligatorio");

  await prisma.cliente.update({
    where: { id },
    data: {
      nombre,
      empresa: optionalStr(formData, "empresa"),
      email: optionalStr(formData, "email"),
      telefono: optionalStr(formData, "telefono"),
      direccion: optionalStr(formData, "direccion"),
      notas: optionalStr(formData, "notas"),
    },
  });

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

export async function deleteCliente(id: string) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  revalidatePath("/");
  redirect("/clientes");
}

export async function createCatalogoMaquina(formData: FormData) {
  const marca = str(formData, "marca");
  const nombre = str(formData, "nombre");
  if (!marca || !nombre) {
    throw new Error("Marca y nombre son obligatorios");
  }

  const imagen = await saveUploadedImage(fileFrom(formData, "imagen"));

  await prisma.catalogoMaquina.create({
    data: { marca, nombre, imagen },
  });

  revalidatePath("/maquinas");
  redirect("/maquinas");
}

export async function deleteCatalogoMaquina(id: string) {
  const usadas = await prisma.maquina.count({ where: { catalogoId: id } });
  if (usadas > 0) {
    throw new Error("No se puede eliminar: ya hay equipos asignados de este modelo");
  }
  await prisma.catalogoMaquina.delete({ where: { id } });
  revalidatePath("/maquinas");
  redirect("/maquinas");
}

export async function asignarMaquina(formData: FormData) {
  const catalogoId = str(formData, "catalogoId");
  const numeroSerie = str(formData, "numeroSerie");
  const clienteId = str(formData, "clienteId");

  if (!catalogoId || !numeroSerie || !clienteId) {
    throw new Error("Modelo, nro. de serie y cliente son obligatorios");
  }

  const maquina = await prisma.maquina.create({
    data: {
      catalogoId,
      numeroSerie,
      clienteId,
      descripcion: optionalStr(formData, "descripcion"),
      ubicacion: optionalStr(formData, "ubicacion"),
      estadoEquipo: str(formData, "estadoEquipo") || "operativa",
      fechaCompra: optionalDate(formData, "fechaCompra"),
    },
  });

  revalidatePath("/maquinas");
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/");
  redirect(`/maquinas/${maquina.id}`);
}

export async function updateMaquina(id: string, formData: FormData) {
  const catalogoId = str(formData, "catalogoId");
  const numeroSerie = str(formData, "numeroSerie");
  const clienteId = str(formData, "clienteId");

  if (!catalogoId || !numeroSerie || !clienteId) {
    throw new Error("Modelo, nro. de serie y cliente son obligatorios");
  }

  await prisma.maquina.update({
    where: { id },
    data: {
      catalogoId,
      numeroSerie,
      clienteId,
      descripcion: optionalStr(formData, "descripcion"),
      ubicacion: optionalStr(formData, "ubicacion"),
      estadoEquipo: str(formData, "estadoEquipo") || "operativa",
      fechaCompra: optionalDate(formData, "fechaCompra"),
    },
  });

  revalidatePath(`/maquinas/${id}`);
  revalidatePath("/maquinas");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/maquinas/${id}`);
}

export async function deleteMaquina(id: string) {
  const maquina = await prisma.maquina.delete({ where: { id } });
  revalidatePath("/maquinas");
  revalidatePath(`/clientes/${maquina.clienteId}`);
  revalidatePath("/");
  redirect("/maquinas");
}

export async function createMantenimiento(formData: FormData) {
  const maquinaId = str(formData, "maquinaId");
  const tipo = str(formData, "tipo");
  const titulo = str(formData, "titulo");
  const descripcion = str(formData, "descripcion");

  if (!maquinaId || !tipo || !titulo || !descripcion) {
    throw new Error("Máquina, tipo, título y descripción son obligatorios");
  }

  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      maquinaId,
      tipo,
      titulo,
      descripcion,
      tecnico: optionalStr(formData, "tecnico"),
      piezas: optionalStr(formData, "piezas"),
      costo: optionalFloat(formData, "costo"),
      estado: str(formData, "estado") || "completado",
      fecha: optionalDate(formData, "fecha") ?? new Date(),
      proximo: optionalDate(formData, "proximo"),
    },
    include: { maquina: true },
  });

  revalidatePath("/mantenimientos");
  revalidatePath(`/maquinas/${maquinaId}`);
  revalidatePath(`/clientes/${mantenimiento.maquina.clienteId}`);
  revalidatePath("/");
  redirect(`/maquinas/${maquinaId}`);
}

export async function updateMantenimiento(id: string, formData: FormData) {
  const maquinaId = str(formData, "maquinaId");
  const tipo = str(formData, "tipo");
  const titulo = str(formData, "titulo");
  const descripcion = str(formData, "descripcion");

  if (!maquinaId || !tipo || !titulo || !descripcion) {
    throw new Error("Máquina, tipo, título y descripción son obligatorios");
  }

  await prisma.mantenimiento.update({
    where: { id },
    data: {
      maquinaId,
      tipo,
      titulo,
      descripcion,
      tecnico: optionalStr(formData, "tecnico"),
      piezas: optionalStr(formData, "piezas"),
      costo: optionalFloat(formData, "costo"),
      estado: str(formData, "estado") || "completado",
      fecha: optionalDate(formData, "fecha") ?? new Date(),
      proximo: optionalDate(formData, "proximo"),
    },
  });

  revalidatePath(`/mantenimientos/${id}`);
  revalidatePath(`/maquinas/${maquinaId}`);
  revalidatePath("/mantenimientos");
  redirect(`/maquinas/${maquinaId}`);
}

export async function deleteMantenimiento(id: string) {
  const item = await prisma.mantenimiento.delete({
    where: { id },
    include: { maquina: true },
  });
  revalidatePath(`/maquinas/${item.maquinaId}`);
  revalidatePath("/mantenimientos");
  revalidatePath(`/clientes/${item.maquina.clienteId}`);
  redirect(`/maquinas/${item.maquinaId}`);
}
