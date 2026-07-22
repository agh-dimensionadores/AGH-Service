import { loginAction } from "@/app/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-dim)] text-2xl font-bold text-[var(--accent)] shadow-[0_0_28px_var(--accent-glow)]">
            A
          </div>
          <h1 className="brand-font text-3xl font-semibold text-white">
            AGH <span className="text-[var(--accent)]">CENTRAL</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Ingresá con tu cuenta de administrador o cliente
          </p>
        </div>

        <div className="card p-6">
          <form action={loginAction} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#d8e0da]">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="field-input"
                placeholder="tu@empresa.com"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[#d8e0da]">
                Contraseña
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field-input"
              />
            </label>

            {error ? (
              <p className="rounded-lg bg-[var(--danger-dim)] px-3 py-2 text-sm text-[var(--danger)]">
                Email o contraseña incorrectos.
              </p>
            ) : null}

            <button type="submit" className="btn-primary w-full">
              Ingresar
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 text-xs text-[var(--ink-muted)]">
            <p className="font-medium text-[#d8e0da]">Cuentas de prueba</p>
            <p className="mt-2">Admin: micaela@agh.com / admin123</p>
            <p>Cliente: cliente@mercadolibre.com / cliente123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
