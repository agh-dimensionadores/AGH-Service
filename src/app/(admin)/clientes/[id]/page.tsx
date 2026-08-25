import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createAghUsuario,
  createCloudUser,
  deleteCliente,
  resetAghUsuarioPassword,
  updateCliente,
} from "@/app/actions";
import { DangerButton, GuardedForm, SubmitButton } from "@/components/form";
import { prismaPg } from "@/lib/prisma";
import { getCliente } from "@/lib/clientes";
import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PrimaryLink,
  SecondaryLink,
  inputClass,
  estadoTone,
} from "@/components/ui";
import {
  formatDate,
  labelEstado,
  machineName,
  mantenimientoTitulo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cloudUser?: string; aghUser?: string }>;
}) {
  const { id: idParam } = await params;
  const { cloudUser, aghUser } = await searchParams;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const [unidades, cloudUsers, aghUsuario] = await Promise.all([
    prismaPg.clienteMaquina.findMany({
      where: { idCliente: id },
      orderBy: { fechaCreacion: "desc" },
      include: {
        maquina: true,
        mantenimientos: {
          orderBy: { solicitado: "desc" },
          take: 3,
        },
        _count: { select: { mantenimientos: true } },
      },
    }),
    prismaPg.cloudUser.findMany({
      where: { clienteId: id },
      orderBy: { createdAt: "desc" },
    }),
    prismaPg.usuario.findFirst({
      where: { clienteId: id, rol: "cliente" },
      select: { id: true, email: true, nombre: true, creadoEn: true },
    }),
  ]);

  const update = updateCliente.bind(null, cliente.id);
  const remove = deleteCliente.bind(null, cliente.id);
  const createVoxelUser = createCloudUser.bind(null, cliente.id);
  const createAghUser = createAghUsuario.bind(null, cliente.id);
  const resetAghPassword = resetAghUsuarioPassword.bind(null, cliente.id);

  return (
    <div>
      <PageHeader
        title={cliente.nombre}
        description={
          cliente.empresa
            ? `${cliente.empresa} · PostgreSQL · tabla clientes`
            : "PostgreSQL · tabla clientes"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryLink href="/clientes">Volver</SecondaryLink>
            <PrimaryLink href={`/maquinas/asignar?clienteId=${cliente.id}`}>
              Agregar equipo
            </PrimaryLink>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h3 className="brand-font mb-4 text-lg font-semibold text-white">
            Datos del cliente
          </h3>
          <GuardedForm action={update} className="grid gap-4">
            <Field label="Nombre *">
              <input
                name="nombre"
                required
                maxLength={100}
                defaultValue={cliente.nombre}
                className={inputClass}
              />
            </Field>
            <Field label="Empresa">
              <input
                name="empresa"
                maxLength={200}
                defaultValue={cliente.empresa ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                maxLength={200}
                defaultValue={cliente.email ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Activo">
              <select
                name="activo"
                defaultValue={String(cliente.activo ?? 1)}
                className={inputClass}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </Field>
            <div className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 text-sm sm:col-span-2">
              <div>
                <p className="text-[var(--ink-muted)]">ID</p>
                <p className="mt-1 font-mono text-white">{cliente.id}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Usalo en Voxel Cam como VOXEL_CLIENT_ID
                </p>
              </div>
              <p className="mt-3 text-[var(--ink-muted)]">Token</p>
              <p className="mt-1 break-all font-mono text-xs text-white">
                {cliente.token}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                Creado: {formatDate(cliente.fechaCreacion)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SubmitButton>Guardar cambios</SubmitButton>
              <DangerButton formAction={remove}>Eliminar cliente</DangerButton>
            </div>
          </GuardedForm>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="brand-font text-lg font-semibold text-white">
                Equipos del cliente
              </h3>
              <span className="text-sm text-[var(--ink-muted)]">
                {unidades.length} registrado{unidades.length === 1 ? "" : "s"}
              </span>
            </div>

            {unidades.length === 0 ? (
              <EmptyState
                title="Sin equipos"
                description="Este cliente todavía no tiene dimensionadores registrados."
                action={
                  <PrimaryLink href={`/maquinas/asignar?clienteId=${cliente.id}`}>
                    Registrar equipo
                  </PrimaryLink>
                }
              />
            ) : (
              <ul className="space-y-3">
                {unidades.map((unidad) => (
                  <li
                    key={unidad.id}
                    className="rounded-lg border border-[var(--line)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/maquinas/${unidad.id}`}
                          className="font-medium text-[var(--accent)] hover:underline"
                        >
                          {machineName(unidad)}
                        </Link>
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          Nro. serie: {unidad.numeroSerie}
                          {unidad.sitio ? ` · ${unidad.sitio}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-md border border-[var(--accent)] bg-[rgba(182,255,59,0.1)] px-2 py-1 font-mono text-[var(--accent)]">
                            Voxel Cam · clientes_maquinas.id = {unidad.id}
                          </span>
                        </div>
                      </div>
                      <Badge>
                        {unidad._count.mantenimientos} trabajo
                        {unidad._count.mantenimientos === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {unidad.mantenimientos[0] ? (
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">
                        Último: {mantenimientoTitulo(unidad.mantenimientos[0])} ·{" "}
                        {formatDate(unidad.mantenimientos[0].solicitado)} ·{" "}
                        <Badge
                          tone={estadoTone(unidad.mantenimientos[0].estado)}
                        >
                          {labelEstado(unidad.mantenimientos[0].estado)}
                        </Badge>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <div className="mb-4">
              <h3 className="brand-font text-lg font-semibold text-white">
                Acceso a AGH Service
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Un solo usuario por cliente para entrar al portal (máquinas,
                historial y solicitar arreglos).
              </p>
            </div>

            {aghUser === "created" ? (
              <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
                Usuario de AGH Service creado. Ya puede ingresar en /login.
              </p>
            ) : null}
            {aghUser === "password" ? (
              <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
                Contraseña actualizada.
              </p>
            ) : null}

            {aghUsuario ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--line)] p-3">
                  <p className="font-medium text-white">{aghUsuario.email}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {aghUsuario.nombre} · Creado{" "}
                    {formatDate(aghUsuario.creadoEn)}
                  </p>
                </div>
                <h4 className="font-medium text-white">Resetear contraseña</h4>
                <GuardedForm
                  action={resetAghPassword}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <Field label="Nueva contraseña *">
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      maxLength={100}
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-end">
                    <SubmitButton>Guardar contraseña</SubmitButton>
                  </div>
                </GuardedForm>
              </div>
            ) : (
              <GuardedForm
                action={createAghUser}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Email de acceso *">
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    defaultValue={cliente.email ?? ""}
                    autoComplete="off"
                    className={inputClass}
                  />
                </Field>
                <Field label="Nombre">
                  <input
                    name="nombre"
                    maxLength={100}
                    defaultValue={cliente.nombre}
                    className={inputClass}
                  />
                </Field>
                <Field label="Contraseña *">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={100}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>
                <div className="flex items-end">
                  <SubmitButton>Crear acceso AGH Service</SubmitButton>
                </div>
              </GuardedForm>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="brand-font text-lg font-semibold text-white">
                  Usuarios de Voxel Cloud
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Accesos asociados a este cliente en cloud_users (otra app).
                </p>
              </div>
              <Badge>{cloudUsers.length}</Badge>
            </div>

            {cloudUser === "created" ? (
              <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
                Usuario de Voxel Cloud creado correctamente.
              </p>
            ) : null}

            {cloudUsers.length > 0 ? (
              <ul className="mb-5 space-y-2">
                {cloudUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{user.email}</p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {user.fullName || "Sin nombre"} · Rol:{" "}
                        {user.role || "viewer"}
                        {user.lastLogin
                          ? ` · Último acceso: ${formatDate(user.lastLogin)}`
                          : " · Sin accesos"}
                      </p>
                    </div>
                    <Badge tone={user.isActive === false ? "danger" : "ok"}>
                      {user.isActive === false ? "Inactivo" : "Activo"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-5 text-sm text-[var(--ink-muted)]">
                Este cliente todavía no tiene usuarios en Voxel Cloud.
              </p>
            )}

            <h4 className="mb-3 font-medium text-white">Crear usuario Cloud</h4>
            <GuardedForm
              action={createVoxelUser}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="Usuario / email *">
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  defaultValue={cliente.email ?? ""}
                  autoComplete="off"
                  className={inputClass}
                />
              </Field>
              <Field label="Nombre">
                <input
                  name="fullName"
                  maxLength={150}
                  defaultValue={cliente.nombre}
                  className={inputClass}
                />
              </Field>
              <Field label="Contraseña *">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <SubmitButton>Crear acceso a Voxel Cloud</SubmitButton>
              </div>
            </GuardedForm>
          </Panel>
        </div>
      </div>
    </div>
  );
}
