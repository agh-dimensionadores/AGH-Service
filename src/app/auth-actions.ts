"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  authenticate,
  createSessionToken,
  requireCliente,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const maquinaIdRaw = String(formData.get("maquinaId") || "").trim();
  const maquinaId = maquinaIdRaw || null;

  if (!titulo || !mensaje) {
    throw new Error("Título y mensaje son obligatorios");
  }

  if (maquinaId) {
    const maquina = await prisma.maquina.findFirst({
      where: { id: maquinaId, clienteId: session.clienteId! },
    });
    if (!maquina) throw new Error("Máquina no válida");
  }

  await prisma.soporte.create({
    data: {
      clienteId: session.clienteId!,
      maquinaId,
      titulo,
      mensaje,
      estado: "abierto",
    },
  });

  redirect("/portal/soporte?ok=1");
}
