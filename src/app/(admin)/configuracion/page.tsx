import {
  createAdminUsuario,
  resetAdminUsuarioPassword,
  saveMaquinasFavoritas,
  updateMiPerfil,
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
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string; favoritos?: string }>;
}) {
  const session = await getSession();
  const { admin, favoritos } = await searchParams;

  const [admins, catalogo] = await Promise.all([
    prismaPg.usuario.findMany({
      where: { rol: "admin" },
      orderBy: { creadoEn: "asc" },
      select: {
        id: true,
        email: true,
        nombre: true,
        genero: true,
        creadoEn: true,
      },
    }),
    prismaPg.maquina.findMany({
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
      select: {
        idmachine: true,
        marca: true,
        modelo: true,
        favorito: true,
      },
    }),
  ]);

  const yo = admins.find((u) => u.id === session?.id);

  const favoritosCount = catalogo.filter((m) => m.favorito).length;

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
      {admin === "perfil" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Perfil actualizado. El saludo del inicio usa Bienvenido / Bienvenida.
        </p>
      ) : null}
      {favoritos === "ok" ? (
        <p className="mb-4 rounded-xl bg-[var(--accent-dim)] px-4 py-3 text-sm text-[var(--accent)]">
          Favoritos del catálogo guardados. Se muestran de base en{" "}
          <Link href="/maquinas" className="underline">
            Máquinas
          </Link>
          .
        </p>
      ) : null}

      <div className="mb-6">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="brand-font text-lg font-semibold text-white">
                Máquinas favoritas
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Modelos que aparecen de base en Máquinas (los que más usás).
              </p>
            </div>
            <Badge>{favoritosCount}</Badge>
          </div>

          {catalogo.length === 0 ? (
            <EmptyState
              title="Sin modelos en el catálogo"
              description="Primero agregá máquinas en el catálogo."
            />
          ) : (
            <GuardedForm action={saveMaquinasFavoritas}>
              <ul className="mb-4 max-h-[28rem] space-y-2 overflow-y-auto">
                {catalogo.map((item) => (
                  <li key={item.idmachine}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 hover:border-[rgba(182,255,59,0.35)]">
                      <input
                        type="checkbox"
                        name="favorito"
                        value={item.idmachine}
                        defaultChecked={item.favorito}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="text-sm text-white">
                        {item.marca} {item.modelo}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <SubmitButton pendingLabel="Guardando…">
                Guardar favoritos
              </SubmitButton>
            </GuardedForm>
          )}
        </Panel>
      </div>

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
                      <div className="mt-4 space-y-4 border-t border-[var(--line)] pt-3">
                        <GuardedForm
                          action={updateMiPerfil}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          <Field label="Tu nombre">
                            <input
                              name="nombre"
                              maxLength={150}
                              defaultValue={yo?.nombre ?? user.nombre}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Género *">
                            <select
                              name="genero"
                              required
                              defaultValue={yo?.genero === "f" ? "f" : "m"}
                              className={inputClass}
                            >
                              <option value="m">Hombre (Bienvenido)</option>
                              <option value="f">Mujer (Bienvenida)</option>
                            </select>
                          </Field>
                          <div className="sm:col-span-2">
                            <SubmitButton pendingLabel="Guardando…">
                              Guardar perfil
                            </SubmitButton>
                          </div>
                        </GuardedForm>
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
            <Field label="Género *">
              <select name="genero" required defaultValue="m" className={inputClass}>
                <option value="m">Hombre</option>
                <option value="f">Mujer</option>
              </select>
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
