export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(182,255,59,0.08)] px-3 py-1.5 text-sm text-[var(--accent)]">
        <span className="nav-loading-spinner" aria-hidden />
        Cargando…
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        <div className="h-4 w-64 rounded bg-[rgba(255,255,255,0.04)]" />
        <div className="mt-4 h-72 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)]" />
      </div>
    </div>
  );
}
