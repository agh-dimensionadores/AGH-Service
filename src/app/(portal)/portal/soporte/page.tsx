import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, PageHeader, PrimaryLink } from "@/components/ui";
import {formatDateTime, machineName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function labelSoporte(estado: string) {
  const map: Record<string, string> = {
    abierto: "Abierto",
    en_curso: "En curso",
    cerrado: "Cerrado",
  };
  return map[estado] ?? estado;
}

export default async function PortalSoportePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const session = await requireCliente();
  const { ok } = await searchParams;
  const tickets = await prisma.soporte.findMany({
    where: { clienteId: session.clienteId! },
    orderBy: { creadoEn: "desc" },
    include: { maquina: { include: { catalogo: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Soporte técnico"
        description="Pedí asistencia para tus equipos y seguí el estado de tus solicitudes."
        action={<PrimaryLink href="/portal/soporte/nuevo">Nueva solicitud</PrimaryLink>}
      />

      {ok ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Solicitud enviada. El equipo técnico de AGH la va a revisar.
        </p>
      ) : null}

      {tickets.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          No tenés solicitudes todavía.{" "}
          <Link href="/portal/soporte/nuevo" className="text-[var(--accent)] underline">
            Crear una
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{ticket.titulo}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {ticket.maquina
                      ? `${machineName(ticket.maquina)}`
                      : "Sin máquina específica"}{" "}
                    · {formatDateTime(ticket.creadoEn)}
                  </p>
                </div>
                <Badge
                  tone={
                    ticket.estado === "cerrado"
                      ? "ok"
                      : ticket.estado === "en_curso"
                        ? "warn"
                        : "danger"
                  }
                >
                  {labelSoporte(ticket.estado)}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#d8e0da]">
                {ticket.mensaje}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
