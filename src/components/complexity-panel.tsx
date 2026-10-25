"use client";
import { useId, useState } from "react";

type GrowthId =
  | "const"
  | "log"
  | "linear"
  | "nlogn"
  | "quad"
  | "cubic"
  | "exp"
  | "fact";

const growth: Record<GrowthId, { label: string; f: (n: number) => number }> = {
  const: { label: "O(1)", f: () => 1 },
  log: { label: "O(log n)", f: (n) => Math.log2(n) + 1 },
  linear: { label: "O(n)", f: (n) => n },
  nlogn: { label: "O(n log n)", f: (n) => n * (Math.log2(n) + 1) },
  quad: { label: "O(n²)", f: (n) => n * n },
  cubic: { label: "O(n³)", f: (n) => n ** 3 },
  exp: { label: "O(2ⁿ)", f: (n) => 2 ** n },
  fact: { label: "O(n!)", f: (n) => gamma(n) },
};
const order = Object.keys(growth) as GrowthId[];

function gamma(n: number) {
  let r = 1;
  for (let i = 2; i <= Math.floor(n); i++) r *= i;
  return r;
}

/** Map a free-form complexity string such as "O(n log n)" to the closest growth curve. */
export function classify(text: string): GrowthId {
  const t = text.toLowerCase();
  if (/!/.test(t)) return "fact";
  if (/2\s*\^|2ⁿ|\*\s*2\^/.test(t)) return "exp";
  if (/\^\s*3|n³|n\s*\*\s*n\s*\*\s*n/.test(t)) return "cubic";
  if (/\^\s*2|squared|²|n\s*\*\s*n(?!\s*\*)/.test(t)) return "quad";
  if (/n[^)]*log|log[^)]*n|d log/.test(t)) return "nlogn";
  if (/log/.test(t)) return "log";
  if (/^o\(\s*1\s*\)/.test(t.trim()) || /^\s*1\s*$/.test(t)) return "const";
  return "linear";
}

const W = 320,
  H = 170,
  PAD = 28,
  N_MAX = 10,
  Y_CAP = 60;

function point(n: number, v: number) {
  const x = PAD + ((n - 1) / (N_MAX - 1)) * (W - PAD - 8);
  const y = H - PAD - (Math.min(v, Y_CAP) / Y_CAP) * (H - PAD - 8);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function path(id: GrowthId) {
  const pts: string[] = [];
  for (let i = 0; i <= 90; i++) {
    const n = 1 + (i / 90) * (N_MAX - 1);
    pts.push(point(n, growth[id].f(n)));
  }
  return pts.join(" ");
}

function Chart({
  title,
  raw,
  size,
  color,
}: {
  title: string;
  raw: string;
  size: number;
  color: string;
}) {
  const id = classify(raw);
  const clip = useId();
  const [mx, my] = point(size, growth[id].f(size)).split(",");
  const steps = growth[id].f(size);
  return (
    <figure className="cx-chart">
      <figcaption>
        <span>{title}</span>
        <strong>{raw}</strong>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title} growth: ${raw}, drawn as ${growth[id].label}`}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PAD} y={0} width={W - PAD} height={H - PAD} />
          </clipPath>
        </defs>
        <line className="cx-axis" x1={PAD} y1={H - PAD} x2={W - 4} y2={H - PAD} />
        <line className="cx-axis" x1={PAD} y1={4} x2={PAD} y2={H - PAD} />
        <text className="cx-label" x={W - 4} y={H - 8} textAnchor="end">
          input size n →
        </text>
        <text className="cx-label" x={PAD + 4} y={14}>
          work ↑
        </text>
        <g clipPath={`url(#${clip})`}>
          {order
            .filter((k) => k !== id)
            .map((k) => (
              <polyline key={k} className="cx-ghost" points={path(k)} />
            ))}
          <polyline
            className="cx-line"
            style={{ stroke: color }}
            points={path(id)}
            pathLength={1}
          />
        </g>
        <circle cx={mx} cy={my} r={5} style={{ fill: color }} className="cx-dot" />
      </svg>
      <p className="cx-note">
        Grows like <strong>{growth[id].label}</strong>
        {" · "}at n = {size}: ≈ {steps >= 1e6 ? steps.toExponential(1) : Math.round(steps).toLocaleString()} steps
      </p>
    </figure>
  );
}

export function ComplexityPanel({
  time,
  space,
}: {
  time: string;
  space: string;
}) {
  const [size, setSize] = useState(6);
  const sliderId = useId();
  return (
    <div className="cx-panel">
      <div className="cx-grid">
        <Chart title="Time" raw={time} size={size} color="var(--accent)" />
        <Chart title="Extra space" raw={space} size={size} color="var(--accent-3)" />
      </div>
      <label htmlFor={sliderId} className="cx-slider">
        Input size n: <strong>{size}</strong>
        <input
          id={sliderId}
          type="range"
          min={1}
          max={N_MAX}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </label>
      <p className="cx-note">
        Faint lines are the other common growth rates. Drag n to see how fast
        the work grows. Based on the reference approach; other valid solutions
        may trade time for space.
      </p>
    </div>
  );
}
