import { prismaPg } from "@/lib/prisma";

export type ClienteRow = {
  id: number;
  nombre: string;
  empresa: string | null;
  email: string | null;
  token: string;
  activo: number | null;
  fechaCreacion: Date | null;
  clienteId: number | null;
};

export async function listClientes() {
  return prismaPg.cliente.findMany({ orderBy: { nombre: "asc" } });
}

export async function getCliente(id: number) {
  return prismaPg.cliente.findUnique({ where: { id } });
}

export async function getClientesMap(ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isInteger(id)))];
  if (unique.length === 0) return new Map<number, ClienteRow>();

  const rows = await prismaPg.cliente.findMany({
    where: { id: { in: unique } },
  });

  return new Map(rows.map((c) => [c.id, c]));
}

export function clienteLabel(
  c?: { nombre: string; empresa: string | null } | null
) {
  if (!c) return "—";
  return c.empresa || c.nombre;
}
