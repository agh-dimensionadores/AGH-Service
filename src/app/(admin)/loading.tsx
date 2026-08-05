export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-[rgba(255,255,255,0.06)]" />
      <div className="h-4 w-72 rounded bg-[rgba(255,255,255,0.04)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)]"
          />
        ))}
      </div>
      <div className="mt-4 h-64 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)]" />
    </div>
  );
}
