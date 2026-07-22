export function DonutChart({
  operativa,
  proximo,
  fuera,
}: {
  operativa: number;
  proximo: number;
  fuera: number;
}) {
  const total = Math.max(operativa + proximo + fuera, 1);
  const r = 54;
  const c = 2 * Math.PI * r;
  const pOp = operativa / total;
  const pPr = proximo / total;
  const pFu = fuera / total;

  const dashOp = pOp * c;
  const dashPr = pPr * c;
  const dashFu = pFu * c;

  return (
    <div className="relative mx-auto h-48 w-48">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#243028"
          strokeWidth="16"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#b6ff3b"
          strokeWidth="16"
          strokeDasharray={`${dashOp} ${c - dashOp}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#f5c542"
          strokeWidth="16"
          strokeDasharray={`${dashPr} ${c - dashPr}`}
          strokeDashoffset={-dashOp}
          strokeLinecap="butt"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#ff5c5c"
          strokeWidth="16"
          strokeDasharray={`${dashFu} ${c - dashFu}`}
          strokeDashoffset={-(dashOp + dashPr)}
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="brand-font text-3xl font-semibold text-white">
            {Math.round((operativa / total) * 100)}%
          </p>
          <p className="text-xs text-[var(--ink-muted)]">operativas</p>
        </div>
      </div>
    </div>
  );
}
