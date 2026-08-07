import Link from "next/link";
import { requireCliente } from "@/lib/auth";
import { getCliente, clienteLabel } from "@/lib/clientes";
import { prismaPg } from "@/lib/prisma";
import { catalogImageUrl } from "@/lib/uploads";
import {
  Badge,
  PageHeader,
  Panel,
  PrimaryLink,
  estadoTone,
} from "@/components/ui";
import {
  equipoEstado,
  formatDate,
  labelEstado,
  machineThumbStyle,
  machineName,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await requireCliente();
  const clienteId = session.clienteId!;

  const [cliente, unidades] = await Promise.all([
    getCliente(clienteId),
    prismaPg.clienteMaquina.findMany({
      where: { idCliente: clienteId },
      orderBy: { fechaCreacion: "desc" },
      include: {
        maquina: {
          select: {
            idmachine: true,
            marca: true,
            modelo: true,
            imagenMime: true,
            imagenUpdatedAt: true,
          },
        },
        mantenimientos: { select: { estado: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Hola, ${session.nombre}`}
        description="Tus equipos, tu información y solicitudes de arreglo."
        action={
          <PrimaryLink href="/portal/solicitar">Solicitar arreglo</PrimaryLink>
        }
      />

      <Panel className="mb-6">
        <h3 className="brand-font mb-3 text-lg font-semibold text-white">
          Tu información
        </h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--ink-muted)]">Empresa / cliente</dt>
            <dd className="mt-1 text-white">
              {cliente ? clienteLabel(cliente) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Contacto</dt>
            <dd className="mt-1 text-white">{cliente?.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Nombre</dt>
            <dd className="mt-1 text-white">{cliente?.nombre || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Cliente desde</dt>
            <dd className="mt-1 text-white">
              {formatDate(cliente?.fechaCreacion)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Los datos de contacto los administra AGH. Si necesitás cambiarlos,
          pedilos por un arreglo o a tu contacto técnico.
        </p>
      </Panel>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="brand-font text-lg font-semibold text-white">
          Mis máquinas
        </h3>
        <span className="text-sm text-[var(--ink-muted)]">
          {unidades.length} equipo{unidades.length === 1 ? "" : "s"}
        </span>
      </div>

      {unidades.length === 0 ? (
        <div className="card p-6 text-[var(--ink-muted)]">
          Todavía no hay máquinas asociadas a tu cuenta.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unidades.map((unidad) => {
            const estado = equipoEstado(unidad.mantenimientos);
            return (
              <Link
                key={unidad.id}
                href={`/portal/maquinas/${unidad.id}`}
                className="card overflow-hidden transition hover:border-[rgba(182,255,59,0.35)]"
              >
                {unidad.maquina.imagenMime ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={catalogImageUrl(
                      unidad.maquina.idmachine,
                      unidad.maquina.imagenUpdatedAt
                    )}
                    alt={machineName(unidad)}
                    className="machine-thumb rounded-none object-cover"
                  />
                ) : (
                  <div
                    className="machine-thumb rounded-none"
                    style={machineThumbStyle(
                      unidad.maquina.modelo ?? unidad.maquina.marca
                    )}
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">
                        {machineName(unidad)}
                      </p>
                      <p className="font-mono text-xs text-[var(--ink-muted)]">
                        {unidad.numeroSerie}
                      </p>
                    </div>
                    <Badge tone={estadoTone(estado)}>
                      {labelEstado(estado)}
                    </Badge>
                  </div>
                  {unidad.sitio ? (
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      {unidad.sitio}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
