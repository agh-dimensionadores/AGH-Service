import {
  createAdminUsuario,
  resetAdminUsuarioPassword,
} from "@/app/actions";
import { GuardedForm, SubmitButton } from "@/components/form";
import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  inputClass,
} from "@/components/ui";
import { getSession } from "@/lib/auth";
import { prismaPg } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const session = await getSession();
  const { admin } = await searchParams;

  const admins = await prismaPg.usuario.findMany({
    where: { rol: "admin" },
    orderBy: { creadoEn: "asc" },
    select: {
      id: true,
      email: true,
      nombre: true,
      creadoEn: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Preferencias del panel y accesos de administración."
      />

      {admin === "created" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Administrador creado. Ya puede ingresar en /login.
        </p>
      ) : null}
      {admin === "password" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Tu contraseña fue actualizada.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="brand-font text-lg font-semibold text-white">
                Usuarios administradores
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Accesos al panel AGH (no son clientes del portal).
              </p>
            </div>
            <Badge>{admins.length}</Badge>
          </div>

          {admins.length === 0 ? (
            <EmptyState
              title="Sin administradores"
              description="Creá el primero con el formulario de la derecha."
            />
          ) : (
            <ul className="space-y-3">
              {admins.map((user) => {
                const isMe = session?.id === user.id;
                return (
                  <li
                    key={user.id}
                    className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{user.email}</p>
                        <p className="text-sm text-[var(--ink-muted)]">
                          {user.nombre}
                          {isMe ? " · Vos" : ""} · Creado{" "}
                          {formatDate(user.creadoEn)}
                        </p>
                      </div>
                      <Badge tone="ok">Admin</Badge>
                    </div>

                    {isMe ? (
                      <div className="mt-4 border-t border-[var(--line)] pt-3">
                        <GuardedForm
                          action={resetAdminUsuarioPassword}
                          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
                        >
                          <Field label="Cambiar mi contraseña">
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
                          <SubmitButton pendingLabel="Cargando…">
                            Guardar
                          </SubmitButton>
                        </GuardedForm>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="brand-font mb-1 text-lg font-semibold text-white">
            Crear administrador
          </h3>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Solo acceso al panel. No queda vinculado a un cliente.
          </p>

          <GuardedForm action={createAdminUsuario} className="grid gap-4">
            <Field label="Email *">
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="off"
                className={inputClass}
              />
            </Field>
            <Field label="Nombre">
              <input
                name="nombre"
                maxLength={150}
                placeholder="Nombre visible"
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
            <SubmitButton pendingLabel="Cargando…">
              Crear administrador
            </SubmitButton>
          </GuardedForm>
        </Panel>
      </div>
    </div>
  );
}
