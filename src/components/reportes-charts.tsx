import { labelEstado } from "@/lib/utils";
import type { RankItem, TrendPoint } from "@/lib/reportes";

const ESTADO_COLOR: Record<string, string> = {
  cerrado: "#b6ff3b",
  en_curso: "#f5c542",
  abierto: "#5ec8ff",
  cancelado: "#ff5c5c",
};

export function TrendChart({ series }: { series: TrendPoint[] }) {
  const width = 640;
  const height = 220;
  const padL = 28;
  const padB = 28;
  const padT = 16;
  const padR = 8;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(1, ...series.flatMap((s) => [s.abiertos, s.cerrados]));
  const group = series.length ? innerW / series.length : innerW;
  const bar = Math.min(10, group * 0.28);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img">
        {[0, 0.5, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#243028" />
              <text x={0} y={y + 4} fill="#8b978c" fontSize="11">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {series.map((point, i) => {
          const cx = padL + group * i + group / 2;
          const hA = (point.abiertos / max) * innerH;
          const hC = (point.cerrados / max) * innerH;
          return (
            <g key={`${point.label}-${i}`}>
              <rect
                x={cx - bar - 1}
                y={padT + innerH - hA}
                width={bar}
                height={hA}
                rx="2"
                fill="#5ec8ff"
              />
              <rect
                x={cx + 1}
                y={padT + innerH - hC}
                width={bar}
                height={hC}
                rx="2"
                fill="#b6ff3b"
              />
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                fill="#8b978c"
                fontSize="11"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-[var(--ink-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#5ec8ff]" /> Ingresados
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--accent)]" /> Cerrados
        </span>
      </div>
    </div>
  );
}

export function RankBars({
  items,
  empty,
}: {
  items: RankItem[];
  empty: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) {
    return <p className="text-sm text-[var(--ink-muted)]">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-white">{item.label}</span>
            <span className="shrink-0 text-[var(--ink-muted)]">{item.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EstadoSplit({
  items,
}: {
  items: { estado: string; value: number }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#243028" strokeWidth="14" />
          {total
            ? items.map((item) => {
                const dash = (item.value / total) * c;
                const el = (
                  <circle
                    key={item.estado}
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={ESTADO_COLOR[item.estado] || "#8b978c"}
                    strokeWidth="14"
                    strokeDasharray={`${dash} ${c - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return el;
              })
            : null}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="brand-font text-2xl font-semibold text-white">{total}</p>
            <p className="text-xs text-[var(--ink-muted)]">servicios</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.estado} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[var(--ink-muted)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ESTADO_COLOR[item.estado] || "#8b978c" }}
              />
              {labelEstado(item.estado)}
            </span>
            <span className="text-white">
              {item.value}
              {total ? ` · ${Math.round((item.value / total) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
