import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "agh_session";

export type SessionUser = {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "cliente";
  clienteId: number | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    clienteId: user.clienteId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function readSessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.nombre !== "string" ||
      (payload.rol !== "admin" && payload.rol !== "cliente")
    ) {
      return null;
    }
    const clienteId =
      typeof payload.clienteId === "number"
        ? payload.clienteId
        : typeof payload.clienteId === "string" && payload.clienteId !== ""
          ? Number(payload.clienteId)
          : null;

    return {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      clienteId:
        clienteId != null && Number.isFinite(clienteId) ? clienteId : null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.rol !== "admin") {
    redirect("/login");
  }
  return session;
}

export async function requireCliente() {
  const session = await getSession();
  if (!session || session.rol !== "cliente" || session.clienteId == null) {
    redirect("/login");
  }
  return session;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol as "admin" | "cliente",
    clienteId: user.clienteId,
  } satisfies SessionUser;
}
