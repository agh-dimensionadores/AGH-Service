"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, requireAdmin, requireCliente } from "@/lib/auth";
import {
  buildCubiscanOrdenHtml,
  emptyCubiscanPayload,
  type CubiscanOrdenPayload,
  type CubiscanRefaccion,
} from "@/lib/cubiscan-planilla";
import { mailConfigured, sendMail } from "@/lib/mail";
import { prismaPg } from "@/lib/prisma";
import {
  MAX_FOTO_MANTENIMIENTO_BYTES,
  MAX_FOTOS_MANTENIMIENTO,
  readUploadedImage,
} from "@/lib/uploads";
import { buildNumeroSerie } from "@/lib/utils";
import {
  checkSectionsFor,
  planillaFirmaLabel,
  planillaKind,
  planillaTitulo,
  type PlanillaKind,
} from "@/lib/planilla-template";
import type { Prisma } from "@prisma/client-pg";

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

function fileFrom(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
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

  const created = await prismaPg.cliente.create({
    data: {
      nombre,
      empresa,
      email,
      token,
      activo,
      fechaCreacion: new Date(),
    },
    select: { id: true },
  });

  // Mantener cliente_id alineado con id (columna legacy / otras apps)
  await prismaPg.cliente.update({
    where: { id: created.id },
    data: { clienteId: created.id },
  });

  touch("/clientes");
  redirect(`/clientes/${created.id}`);
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

/** Usuario AGH Service (PostgreSQL agh_usuarios) — un solo acceso por cliente */
export async function createAghUsuario(clienteId: number, formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const nombre = str(formData, "nombre") || "Cliente";

  if (!email || !email.includes("@")) {
    throw new Error("Ingresá un email válido");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const cliente = await prismaPg.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true, nombre: true },
  });
  if (!cliente) throw new Error("El cliente no existe");

  const yaTiene = await prismaPg.usuario.findFirst({
    where: { clienteId, rol: "cliente" },
    select: { id: true },
  });
  if (yaTiene) {
    throw new Error("Este cliente ya tiene un usuario de AGH Service");
  }

  const emailTaken = await prismaPg.usuario.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailTaken) {
    throw new Error("Ese email ya está en uso en AGH Service");
  }

  await prismaPg.usuario.create({
    data: {
      email,
      nombre,
      rol: "cliente",
      clienteId,
      passwordHash: await hashPassword(password),
    },
  });

  touch(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?aghUser=created`);
}

export async function resetAghUsuarioPassword(
  clienteId: number,
  formData: FormData
) {
  const password = str(formData, "password");
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const user = await prismaPg.usuario.findFirst({
    where: { clienteId, rol: "cliente" },
    select: { id: true },
  });
  if (!user) throw new Error("Este cliente no tiene usuario de AGH Service");

  await prismaPg.usuario.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });

  touch(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?aghUser=password`);
}

/** Admin: crear otro usuario administrador (sin cliente asociado). */
export async function createAdminUsuario(formData: FormData) {
  await requireAdmin();

  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const nombre = str(formData, "nombre") || "Administrador";

  if (!email || !email.includes("@")) {
    throw new Error("Ingresá un email válido");
  }
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const emailTaken = await prismaPg.usuario.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailTaken) {
    throw new Error("Ese email ya está en uso");
  }

  await prismaPg.usuario.create({
    data: {
      email,
      nombre,
      rol: "admin",
      clienteId: null,
      passwordHash: await hashPassword(password),
    },
  });

  touch("/configuracion");
  redirect("/configuracion?admin=created");
}

export async function resetAdminUsuarioPassword(formData: FormData) {
  const session = await requireAdmin();
  const password = str(formData, "password");
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  await prismaPg.usuario.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(password) },
  });

  touch("/configuracion");
  redirect("/configuracion?admin=password");
}

/** Modelos del catálogo que aparecen de base en /maquinas. */
export async function saveMaquinasFavoritas(formData: FormData) {
  await requireAdmin();

  const ids = formData
    .getAll("favorito")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  await prismaPg.$transaction([
    prismaPg.maquina.updateMany({ data: { favorito: false } }),
    ...(ids.length
      ? [
          prismaPg.maquina.updateMany({
            where: { idmachine: { in: ids } },
            data: { favorito: true },
          }),
        ]
      : []),
  ]);

  touch("/configuracion", "/maquinas");
  redirect("/configuracion?favoritos=ok");
}

/** Cliente portal: solicitar mantenimiento / arreglo */
export async function solicitarMantenimientoCliente(formData: FormData) {
  const session = await requireCliente();
  const idClienteMaquina = requiredInt(formData, "maquinaId");
  const tipo = str(formData, "tipo") || "Correctivo";
  const descripcion = str(formData, "descripcion");
  if (!descripcion) throw new Error("La descripción es obligatoria");

  const unidad = await prismaPg.clienteMaquina.findFirst({
    where: { id: idClienteMaquina, idCliente: session.clienteId! },
    select: { id: true },
  });
  if (!unidad) throw new Error("Máquina no válida");

  await prismaPg.clienteMantenimiento.create({
    data: {
      idClienteMaquina,
      tipo,
      descripcion,
      estado: "abierto",
      solicitado: new Date(),
    },
  });

  touch(
    "/portal",
    "/portal/historial",
    `/portal/maquinas/${idClienteMaquina}`,
    "/mantenimientos"
  );
  redirect("/portal/historial?ok=1");
}

/** Catálogo: tabla maquinas */
export async function createCatalogoMaquina(formData: FormData) {
  const marca = str(formData, "marca");
  const modelo = optionalStr(formData, "modelo");
  if (!marca) throw new Error("La marca es obligatoria");

  const image = await readUploadedImage(fileFrom(formData, "imagen"));

  if (image) {
    // Raw SQL: Prisma a veces no reemplaza bien BYTEA en updates; en create también usamos lo mismo.
    await prismaPg.$executeRaw`
      INSERT INTO maquinas (marca, modelo, imagen, imagen_mime, imagen_updated_at)
      VALUES (${marca}, ${modelo}, ${image.bytes}, ${image.mime}, NOW())
    `;
  } else {
    await prismaPg.maquina.create({
      data: { marca, modelo },
    });
  }

  touch("/maquinas");
  redirect("/maquinas");
}

export async function updateCatalogoMaquina(id: number, formData: FormData) {
  const marca = str(formData, "marca");
  const modelo = optionalStr(formData, "modelo");
  if (!marca) throw new Error("La marca es obligatoria");

  const existing = await prismaPg.maquina.findUnique({
    where: { idmachine: id },
    select: { idmachine: true },
  });
  if (!existing) throw new Error("El modelo no existe");

  const image = await readUploadedImage(fileFrom(formData, "imagen"));
  const quitarImagen = str(formData, "quitarImagen") === "1";

  if (image) {
    await prismaPg.$executeRaw`
      UPDATE maquinas
      SET
        marca = ${marca},
        modelo = ${modelo},
        imagen = ${image.bytes},
        imagen_mime = ${image.mime},
        imagen_updated_at = NOW()
      WHERE idmachine = ${id}
    `;
  } else if (quitarImagen) {
    await prismaPg.$executeRaw`
      UPDATE maquinas
      SET
        marca = ${marca},
        modelo = ${modelo},
        imagen = NULL,
        imagen_mime = NULL,
        imagen_updated_at = NOW()
      WHERE idmachine = ${id}
    `;
  } else {
    await prismaPg.maquina.update({
      where: { idmachine: id },
      data: { marca, modelo },
    });
  }

  touch("/maquinas", `/maquinas/catalogo/${id}`);
  redirect(`/maquinas/catalogo/${id}?ok=1`);
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
  const digitos =
    str(formData, "numeroSerieDigitos") || str(formData, "numeroSerie");

  const catalogo = await prismaPg.maquina.findUnique({
    where: { idmachine: idMaquina },
    select: { modelo: true },
  });
  if (!catalogo) throw new Error("Modelo de catálogo no encontrado");

  const numeroSerie = buildNumeroSerie(catalogo.modelo, digitos);

  const modalidadRaw = str(formData, "modalidad") || "venta";
  const modalidad = modalidadRaw === "alquiler" ? "alquiler" : "venta";

  let fechaInicioAlquiler: Date | null = null;
  let fechaFinAlquiler: Date | null = null;
  let comentarioAlquiler: string | null = null;

  if (modalidad === "alquiler") {
    fechaInicioAlquiler = optionalDate(formData, "fechaInicioAlquiler");
    fechaFinAlquiler = optionalDate(formData, "fechaFinAlquiler");
    comentarioAlquiler = optionalStr(formData, "comentarioAlquiler");
    if (!fechaInicioAlquiler || !fechaFinAlquiler) {
      throw new Error("En alquiler son obligatorias fecha de inicio y fin");
    }
    if (fechaFinAlquiler < fechaInicioAlquiler) {
      throw new Error("La fecha de fin no puede ser anterior al inicio");
    }
  }

  const unidad = await prismaPg.clienteMaquina.create({
    data: {
      idCliente,
      idMaquina,
      numeroSerie,
      sitio: optionalStr(formData, "ubicacion"),
      modalidad,
      fechaCompra:
        modalidad === "venta" ? optionalDate(formData, "fechaCompra") : null,
      fechaFabricacion: optionalDate(formData, "fechaFabricacion"),
    },
  });

  if (
    modalidad === "alquiler" &&
    fechaInicioAlquiler &&
    fechaFinAlquiler
  ) {
    await prismaPg.maquinaAlquiler.create({
      data: {
        idClienteMaquina: unidad.id,
        idCliente,
        fechaInicio: fechaInicioAlquiler,
        fechaFin: fechaFinAlquiler,
        comentario: comentarioAlquiler,
      },
    });
  }

  touch("/maquinas", `/clientes/${idCliente}`);
  redirect(`/maquinas/${unidad.id}`);
}

export async function updateMaquina(id: number, formData: FormData) {
  const existing = await prismaPg.clienteMaquina.findUnique({
    where: { id },
    select: { id: true, modalidad: true },
  });
  if (!existing) throw new Error("Equipo no encontrado");

  const idCliente = requiredInt(formData, "clienteId");
  const idMaquina = requiredInt(formData, "catalogoId");
  const digitos =
    str(formData, "numeroSerieDigitos") || str(formData, "numeroSerie");

  const catalogo = await prismaPg.maquina.findUnique({
    where: { idmachine: idMaquina },
    select: { modelo: true },
  });
  if (!catalogo) throw new Error("Modelo de catálogo no encontrado");
  const numeroSerie = buildNumeroSerie(catalogo.modelo, digitos);

  await prismaPg.clienteMaquina.update({
    where: { id },
    data: {
      idCliente,
      idMaquina,
      numeroSerie,
      sitio: optionalStr(formData, "ubicacion"),
      // modalidad no se cambia acá
      modalidad: existing.modalidad,
      fechaCompra:
        existing.modalidad === "venta"
          ? optionalDate(formData, "fechaCompra")
          : null,
      fechaFabricacion: optionalDate(formData, "fechaFabricacion"),
    },
  });

  touch(`/maquinas/${id}`, "/maquinas", `/clientes/${idCliente}`);
  redirect(`/maquinas/${id}`);
}

/** Solo permite cambiar fecha de fin (y comentario) del alquiler activo. */
export async function updateAlquilerFin(alquilerId: number, formData: FormData) {
  const alquiler = await prismaPg.maquinaAlquiler.findUnique({
    where: { id: alquilerId },
  });
  if (!alquiler) throw new Error("Alquiler no encontrado");

  const fechaFin = optionalDate(formData, "fechaFin");
  if (!fechaFin) throw new Error("La fecha de fin es obligatoria");
  if (fechaFin < alquiler.fechaInicio) {
    throw new Error("La fecha de fin no puede ser anterior al inicio");
  }

  await prismaPg.maquinaAlquiler.update({
    where: { id: alquilerId },
    data: {
      fechaFin,
      comentario: optionalStr(formData, "comentario"),
      // fechaInicio e idCliente no se tocan
    },
  });

  touch(`/maquinas/${alquiler.idClienteMaquina}`);
  redirect(`/maquinas/${alquiler.idClienteMaquina}?alquiler=ok`);
}

/** Nuevo período de alquiler sobre la misma unidad. */
export async function crearPeriodoAlquiler(
  idClienteMaquina: number,
  formData: FormData
) {
  const unidad = await prismaPg.clienteMaquina.findUnique({
    where: { id: idClienteMaquina },
    select: { id: true, idCliente: true, modalidad: true },
  });
  if (!unidad) throw new Error("Equipo no encontrado");
  if (unidad.modalidad !== "alquiler") {
    throw new Error("Este equipo no está en modalidad alquiler");
  }

  const fechaInicio = optionalDate(formData, "fechaInicio");
  const fechaFin = optionalDate(formData, "fechaFin");
  if (!fechaInicio || !fechaFin) {
    throw new Error("Inicio y fin son obligatorios");
  }
  if (fechaFin < fechaInicio) {
    throw new Error("La fecha de fin no puede ser anterior al inicio");
  }

  await prismaPg.maquinaAlquiler.create({
    data: {
      idClienteMaquina,
      idCliente: unidad.idCliente,
      fechaInicio,
      fechaFin,
      comentario: optionalStr(formData, "comentario"),
    },
  });

  touch(`/maquinas/${idClienteMaquina}`);
  redirect(`/maquinas/${idClienteMaquina}?alquiler=nuevo`);
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
      estado: "abierto",
      solicitado: optionalDate(formData, "solicitado") ?? new Date(),
      programado: optionalDateTimeLocal(formData, "programado"),
      asignadoA: optionalStr(formData, "asignadoA"),
    },
  });

  touch("/mantenimientos", "/calendario", `/maquinas/${idClienteMaquina}`);
  redirect(`/maquinas/${idClienteMaquina}`);
}

export async function updateMantenimiento(id: number, formData: FormData) {
  const existing = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    select: {
      id: true,
      tipo: true,
      descripcion: true,
      solicitado: true,
      estado: true,
      arreglado: true,
      idClienteMaquina: true,
    },
  });
  if (!existing) throw new Error("Mantenimiento no encontrado");

  await prismaPg.clienteMantenimiento.update({
    where: { id },
    data: {
      // Equipo / pedido del cliente: no se puede cambiar
      idClienteMaquina: existing.idClienteMaquina,
      tipo: existing.tipo,
      descripcion: existing.descripcion,
      solicitado: existing.solicitado,
      // El estado solo cambia con "Cerrar trabajo"
      estado: existing.estado,
      arreglado: existing.arreglado,
      programado: optionalDateTimeLocal(formData, "programado"),
      asignadoA: optionalStr(formData, "asignadoA"),
      comentarioArreglo: optionalStr(formData, "comentarioArreglo"),
    },
  });

  touch(
    `/mantenimientos/${id}`,
    `/maquinas/${existing.idClienteMaquina}`,
    "/mantenimientos",
    "/calendario"
  );
  redirect(`/mantenimientos/${id}`);
}

export async function cerrarMantenimiento(id: number, formData: FormData) {
  const existing = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    select: {
      id: true,
      tipo: true,
      descripcion: true,
      solicitado: true,
      idClienteMaquina: true,
      estado: true,
      instalacion: { select: { maquina: { select: { marca: true, modelo: true } } } },
    },
  });
  if (!existing) throw new Error("Mantenimiento no encontrado");
  const kind = planillaKind(
    existing.instalacion.maquina.marca,
    existing.instalacion.maquina.modelo
  );
  const tienePlanilla = Boolean(kind);
  if (existing.estado === "cerrado") {
    redirect(
      tienePlanilla
        ? `/mantenimientos/${id}/planilla-cubiscan`
        : `/mantenimientos/${id}`
    );
  }

  const comentarioArreglo =
    optionalStr(formData, "comentarioArreglo") ||
    (kind === "agh"
      ? "Cerrado con planilla AGH Dimensionadores"
      : kind === "cubiscan"
        ? "Cerrado con planilla CubiScan"
        : null);
  const arreglado = optionalDate(formData, "arreglado") ?? new Date();

  await prismaPg.clienteMantenimiento.update({
    where: { id },
    data: {
      tipo: existing.tipo,
      descripcion: existing.descripcion,
      solicitado: existing.solicitado,
      estado: "cerrado",
      arreglado,
      comentarioArreglo,
      programado: optionalDateTimeLocal(formData, "programado"),
      asignadoA: optionalStr(formData, "asignadoA"),
    },
  });

  touch(
    `/mantenimientos/${id}`,
    `/mantenimientos/${id}/planilla-cubiscan`,
    `/maquinas/${existing.idClienteMaquina}`,
    "/mantenimientos",
    "/calendario"
  );
  redirect(
    tienePlanilla
      ? `/mantenimientos/${id}/planilla-cubiscan`
      : `/mantenimientos/${id}?cerrado=1`
  );
}

function planillaMailOpts(
  kind: PlanillaKind,
  payload: CubiscanOrdenPayload,
  firmaIngeniero?: string | null,
  firmaCliente?: string | null
) {
  return {
    html: buildCubiscanOrdenHtml({
      payload,
      firmaIngeniero,
      firmaCliente,
      sections: checkSectionsFor(kind),
      titulo: planillaTitulo(kind),
      firmaLabel: planillaFirmaLabel(kind),
    }),
    subject: `${planillaTitulo(kind)} · ${payload.modelo} · ${payload.numeroSerie}`,
    filename:
      kind === "agh"
        ? `orden-agh-${payload.numeroSerie || "orden"}.html`
        : `orden-cubiscan-${payload.numeroSerie || "orden"}.html`,
  };
}

function parseCubiscanPayload(formData: FormData): CubiscanOrdenPayload {
  const checks: Record<string, string | boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("check_") || typeof value !== "string") continue;
    const checkId = key.slice("check_".length);
    if (value === "true" || value === "on") checks[checkId] = true;
    else if (value === "si" || value === "no") checks[checkId] = value;
    else if (value) checks[checkId] = value;
  }

  const cantidades = formData.getAll("ref_cantidad").map((v) => String(v));
  const numeros = formData.getAll("ref_numero").map((v) => String(v));
  const descripciones = formData.getAll("ref_descripcion").map((v) => String(v));
  const estados = formData.getAll("ref_estado").map((v) => String(v));
  const n = Math.max(
    cantidades.length,
    numeros.length,
    descripciones.length,
    estados.length
  );
  const refacciones: CubiscanRefaccion[] = Array.from({ length: n }, (_, i) => {
    const est = (estados[i] ?? "").trim();
    return {
      cantidad: (cantidades[i] ?? "").trim(),
      numeroParte: (numeros[i] ?? "").trim(),
      descripcion: (descripciones[i] ?? "").trim(),
      estado: est === "nueva" ? "nueva" : "reemplazada",
    };
  });

  const fallo = str(formData, "falloResuelto");
  const velocidad = str(formData, "velocidadServicio");
  const trato = str(formData, "tratoIngeniero");
  const instalacion = str(formData, "instalacion");
  const mantTipo = str(formData, "mantenimientoTipo");

  return emptyCubiscanPayload({
    modelo: str(formData, "modelo"),
    ingenieros: str(formData, "ingenieros"),
    horaLlegada: str(formData, "horaLlegada"),
    ubicacion: str(formData, "ubicacion"),
    contacto: str(formData, "contacto"),
    nroOrden: str(formData, "nroOrden"),
    fecha: str(formData, "fecha"),
    cliente: str(formData, "cliente"),
    numeroSerie: str(formData, "numeroSerie"),
    embalaje: formData.get("embalaje") === "on" || formData.get("embalaje") === "true",
    instalacion:
      instalacion === "venta" || instalacion === "renta" ? instalacion : "",
    mantenimientoTipo:
      mantTipo === "preventivo" || mantTipo === "correctivo" ? mantTipo : "",
    checks,
    comentarios: str(formData, "comentarios"),
    refacciones,
    falloResuelto:
      fallo === "si" || fallo === "no" || fallo === "en_proceso" ? fallo : "",
    velocidadServicio:
      velocidad === "rapido" || velocidad === "normal" || velocidad === "lento"
        ? velocidad
        : "",
    tratoIngeniero:
      trato === "amable" || trato === "descortes" ? trato : "",
    tiempoReparacion: str(formData, "tiempoReparacion"),
    fechaCalificacion: str(formData, "fechaCalificacion"),
    horarioCalificacion: str(formData, "horarioCalificacion"),
    sugerencias: str(formData, "sugerencias"),
    representanteCliente: str(formData, "representanteCliente"),
    representanteCubiscan: str(formData, "representanteCubiscan"),
  });
}

async function loadCubiscanMantenimiento(id: number) {
  const item = await prismaPg.clienteMantenimiento.findUnique({
    where: { id },
    include: {
      instalacion: { include: { maquina: true } },
      ordenCubiscan: { include: { fotos: { select: { id: true, orden: true } } } },
    },
  });
  if (!item) throw new Error("Mantenimiento no encontrado");
  const kind = planillaKind(
    item.instalacion.maquina.marca,
    item.instalacion.maquina.modelo
  );
  if (!kind) {
    throw new Error("Esta planilla solo aplica a equipos CubiScan, ODC o PDC");
  }
  return item;
}

function resolveFirmas(
  formData: FormData,
  saved: { firmaIngeniero: string | null; firmaCliente: string | null } | null
) {
  const fromFormIng = str(formData, "firmaIngeniero");
  const fromFormCli = str(formData, "firmaCliente");
  const firmaIngeniero = fromFormIng.startsWith("data:image/")
    ? fromFormIng
    : saved?.firmaIngeniero || "";
  const firmaCliente = fromFormCli.startsWith("data:image/")
    ? fromFormCli
    : saved?.firmaCliente || "";
  return { firmaIngeniero, firmaCliente };
}

async function ensureCubiscanFotosTable() {
  await prismaPg.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cubiscan_orden_fotos (
      id SERIAL PRIMARY KEY,
      id_orden INTEGER NOT NULL
        REFERENCES cubiscan_ordenes_servicio(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime VARCHAR(50) NOT NULL,
      orden INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function saveCubiscanFotos(idMantenimiento: number, formData: FormData) {
  await ensureCubiscanFotosTable();
  const orden = await prismaPg.cubiscanOrdenServicio.findUnique({
    where: { idMantenimiento },
    select: { id: true },
  });
  if (!orden) return;

  const quitar = formData
    .getAll("quitarFoto")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (quitar.length) {
    await prismaPg.cubiscanOrdenFoto.deleteMany({
      where: { id: { in: quitar }, idOrden: orden.id },
    });
  }

  const remaining = await prismaPg.cubiscanOrdenFoto.count({
    where: { idOrden: orden.id },
  });
  const slots = Math.max(0, MAX_FOTOS_MANTENIMIENTO - remaining);
  const files = formData
    .getAll("fotos")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, slots);

  let ordenN = remaining;
  for (const file of files) {
    const image = await readUploadedImage(file, MAX_FOTO_MANTENIMIENTO_BYTES);
    if (!image) continue;
    await prismaPg.cubiscanOrdenFoto.create({
      data: {
        idOrden: orden.id,
        imagen: Buffer.from(image.bytes),
        imagenMime: image.mime,
        orden: ordenN,
      },
    });
    ordenN += 1;
  }
}

async function upsertCubiscanOrden(
  id: number,
  item: Awaited<ReturnType<typeof loadCubiscanMantenimiento>>,
  formData: FormData,
  extra: {
    emailDestino?: string | null;
    requireFirmas?: boolean;
  }
) {
  if (item.ordenCubiscan?.emailEnviadoEn) {
    throw new Error("La orden ya se envió y no se puede editar");
  }

  const payload = parseCubiscanPayload(formData);
  if (
    !payload.modelo ||
    !payload.ingenieros ||
    !payload.cliente ||
    !payload.numeroSerie
  ) {
    throw new Error("Completá modelo, ingeniero(s), cliente y nro. de serie");
  }

  const { firmaIngeniero, firmaCliente } = resolveFirmas(
    formData,
    item.ordenCubiscan
  );
  if (
    extra.requireFirmas &&
    (!firmaIngeniero.startsWith("data:image/") ||
      !firmaCliente.startsWith("data:image/"))
  ) {
    throw new Error("Se requieren ambas firmas digitales para enviar");
  }

  const arreglado = payload.fecha
    ? new Date(`${payload.fecha}T12:00:00`)
    : new Date();

  const emailDestino =
    extra.emailDestino !== undefined
      ? extra.emailDestino
      : item.ordenCubiscan?.emailDestino ?? null;

  await prismaPg.$transaction([
    prismaPg.clienteMantenimiento.update({
      where: { id },
      data: {
        estado: "cerrado",
        arreglado,
        comentarioArreglo:
          payload.comentarios ||
          item.comentarioArreglo ||
          "Cerrado con planilla CubiScan",
        asignadoA: payload.ingenieros || item.asignadoA,
      },
    }),
    prismaPg.cubiscanOrdenServicio.upsert({
      where: { idMantenimiento: id },
      create: {
        idMantenimiento: id,
        payload: payload as unknown as Prisma.InputJsonValue,
        firmaIngeniero: firmaIngeniero || null,
        firmaCliente: firmaCliente || null,
        emailDestino,
      },
      update: {
        payload: payload as unknown as Prisma.InputJsonValue,
        firmaIngeniero: firmaIngeniero || null,
        firmaCliente: firmaCliente || null,
        emailDestino,
      },
    }),
  ]);

  await saveCubiscanFotos(id, formData);

  return { payload, firmaIngeniero, firmaCliente };
}

/** Una sola acción de formulario: guardar o enviar según `intent`. */
export async function submitPlanillaCubiscan(
  id: number,
  formData: FormData
) {
  if (str(formData, "intent") === "enviar") {
    await enviarPlanillaCubiscan(id, formData);
    return;
  }
  await guardarPlanillaCubiscan(id, formData);
}

/** Guarda la planilla CubiScan sin enviar (sigue editable). */
export async function guardarPlanillaCubiscan(
  id: number,
  formData: FormData
) {
  await requireAdmin();
  const item = await loadCubiscanMantenimiento(id);
  await upsertCubiscanOrden(id, item, formData, {
    emailDestino: optionalStr(formData, "emailDestino")?.toLowerCase() ?? null,
  });

  touch(
    `/mantenimientos/${id}`,
    `/mantenimientos/${id}/planilla-cubiscan`,
    `/maquinas/${item.idClienteMaquina}`,
    "/mantenimientos",
    "/calendario"
  );
  redirect(`/mantenimientos/${id}/planilla-cubiscan?guardado=1`);
}

/** Guarda, envía el mail y bloquea la edición. */
export async function enviarPlanillaCubiscan(
  id: number,
  formData: FormData
) {
  await requireAdmin();
  const item = await loadCubiscanMantenimiento(id);
  if (item.ordenCubiscan?.emailEnviadoEn) {
    redirect(`/mantenimientos/${id}/planilla-cubiscan`);
  }

  const emailDestino = str(formData, "emailDestino").toLowerCase();
  if (!emailDestino.includes("@")) {
    throw new Error("Ingresá un email de cliente válido");
  }
  if (!mailConfigured()) {
    throw new Error(
      "SMTP no configurado. Definí SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en .env"
    );
  }

  const { payload, firmaIngeniero, firmaCliente } = await upsertCubiscanOrden(
    id,
    item,
    formData,
    { emailDestino, requireFirmas: true }
  );

  const kind =
    planillaKind(
      item.instalacion.maquina.marca,
      item.instalacion.maquina.modelo
    ) ?? "cubiscan";
  const mail = planillaMailOpts(kind, payload, firmaIngeniero, firmaCliente);

  try {
    await sendMail({
      to: emailDestino,
      subject: mail.subject,
      html: mail.html,
      attachments: [
        {
          filename: mail.filename,
          content: mail.html,
          contentType: "text/html; charset=utf-8",
        },
      ],
    });
  } catch (err) {
    await prismaPg.cubiscanOrdenServicio.update({
      where: { idMantenimiento: id },
      data: {
        emailError:
          err instanceof Error ? err.message : "No se pudo enviar el correo",
      },
    });
    throw new Error(
      err instanceof Error ? err.message : "No se pudo enviar el correo"
    );
  }

  await prismaPg.cubiscanOrdenServicio.update({
    where: { idMantenimiento: id },
    data: {
      emailDestino,
      emailEnviadoEn: new Date(),
      emailError: null,
    },
  });

  touch(
    `/mantenimientos/${id}`,
    `/mantenimientos/${id}/planilla-cubiscan`,
    `/maquinas/${item.idClienteMaquina}`,
    "/mantenimientos",
    "/calendario"
  );
  redirect(`/mantenimientos/${id}/planilla-cubiscan?enviado=1`);
}

/** Reenvía la orden CubiScan ya guardada. */
export async function reenviarPlanillaCubiscan(
  id: number,
  formData: FormData
) {
  await requireAdmin();
  const orden = await prismaPg.cubiscanOrdenServicio.findUnique({
    where: { idMantenimiento: id },
    include: {
      mantenimiento: {
        include: { instalacion: { include: { maquina: true } } },
      },
    },
  });
  if (!orden) throw new Error("No hay planilla para este trabajo");

  const emailDestino =
    str(formData, "emailDestino").toLowerCase() ||
    orden.emailDestino ||
    "";
  if (!emailDestino.includes("@")) {
    throw new Error("Ingresá un email válido");
  }

  const payload = emptyCubiscanPayload(
    orden.payload as unknown as Partial<CubiscanOrdenPayload>
  );
  const kind =
    planillaKind(
      orden.mantenimiento.instalacion.maquina.marca,
      orden.mantenimiento.instalacion.maquina.modelo
    ) ?? "cubiscan";
  const mail = planillaMailOpts(
    kind,
    payload,
    orden.firmaIngeniero,
    orden.firmaCliente
  );

  if (!mailConfigured()) {
    throw new Error(
      "SMTP no configurado. Definí SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en .env"
    );
  }

  await sendMail({
    to: emailDestino,
    subject: mail.subject,
    html: mail.html,
    attachments: [
      {
        filename: mail.filename,
        content: mail.html,
        contentType: "text/html; charset=utf-8",
      },
    ],
  });

  await prismaPg.cubiscanOrdenServicio.update({
    where: { id: orden.id },
    data: {
      emailDestino,
      emailEnviadoEn: new Date(),
      emailError: null,
    },
  });

  touch(`/mantenimientos/${id}/planilla-cubiscan`);
  redirect(`/mantenimientos/${id}/planilla-cubiscan?enviado=1`);
}

export async function deleteMantenimiento(_id: number) {
  throw new Error("Los trabajos de mantenimiento no se pueden eliminar");
}

/** Agenda: asignar un pendiente a un día (hora y quién opcionales). */
export async function programarMantenimiento(formData: FormData) {
  const id = requiredInt(formData, "mantenimientoId");
  const fecha = str(formData, "fecha");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("Fecha inválida");
  }
  const hora = optionalStr(formData, "hora");
  const asignadoA = optionalStr(formData, "asignadoA");
  const programado = combineFechaHora(fecha, hora);

  const item = await prismaPg.clienteMantenimiento.update({
    where: { id },
    data: { programado, asignadoA },
  });

  touch(
    "/calendario",
    "/mantenimientos",
    `/mantenimientos/${id}`,
    `/maquinas/${item.idClienteMaquina}`
  );
  redirect(`/calendario?mes=${fecha.slice(0, 7)}&dia=${fecha}`);
}

export async function desprogramarMantenimiento(id: number, formData: FormData) {
  const item = await prismaPg.clienteMantenimiento.update({
    where: { id },
    data: { programado: null, asignadoA: null },
  });

  const mes = optionalStr(formData, "mes") || new Date().toISOString().slice(0, 7);
  const dia = optionalStr(formData, "dia");

  touch(
    "/calendario",
    "/mantenimientos",
    `/mantenimientos/${id}`,
    `/maquinas/${item.idClienteMaquina}`
  );
  redirect(dia ? `/calendario?mes=${mes}&dia=${dia}` : `/calendario?mes=${mes}`);
}

function optionalDateTimeLocal(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  // datetime-local: YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return combineFechaHora(value, null);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function combineFechaHora(fecha: string, hora: string | null) {
  const time =
    hora && /^\d{1,2}:\d{2}$/.test(hora)
      ? hora.padStart(5, "0")
      : "00:00";
  return new Date(`${fecha}T${time}:00`);
}
