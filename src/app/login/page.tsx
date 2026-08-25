import { loginAction } from "@/app/auth-actions";
import { BrandLogo } from "@/components/brand-logo";
import { GuardedForm, SubmitButton } from "@/components/form";

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
          <BrandLogo href="/login" size="login" />
          <p className="mt-7 text-sm text-[var(--ink-muted)]">
            Ingresá con tu cuenta de administrador o cliente
          </p>
        </div>

        <div className="card p-6">
          <GuardedForm action={loginAction} className="space-y-4">
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

            <SubmitButton className="btn-primary w-full" pendingLabel="Ingresando…">
              Ingresar
            </SubmitButton>
          </GuardedForm>
        </div>
      </div>
    </div>
  );
}
