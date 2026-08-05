"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  authenticate,
  createSessionToken,
  requireCliente,
} from "@/lib/auth";
import { prisma, prismaPg } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const user = await authenticate(email, password);
  if (!user) {
    redirect("/login?error=1");
  }

  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(user.rol === "admin" ? "/" : "/portal");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createSoporteAction(formData: FormData) {
  const session = await requireCliente();
  const titulo = String(formData.get("titulo") || "").trim();
  const mensaje = String(formData.get("mensaje") || "").trim();
  const raw = String(formData.get("maquinaId") || "").trim();
  const idClienteMaquina = raw ? Number(raw) : null;

  if (!titulo || !mensaje) {
    throw new Error("Título y mensaje son obligatorios");
  }

  if (idClienteMaquina != null && Number.isInteger(idClienteMaquina)) {
    const unidad = await prismaPg.clienteMaquina.findFirst({
      where: { id: idClienteMaquina, idCliente: session.clienteId! },
    });
    if (!unidad) throw new Error("Máquina no válida");
  }

  await prisma.soporte.create({
    data: {
      clienteId: session.clienteId!,
      idClienteMaquina:
        idClienteMaquina != null && Number.isInteger(idClienteMaquina)
          ? idClienteMaquina
          : null,
      titulo,
      mensaje,
      estado: "abierto",
    },
  });

  redirect("/portal/soporte?ok=1");
}
