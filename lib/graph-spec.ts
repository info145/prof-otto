export type GraphPoint = {
  x: number;
  y: number;
};

export type GraphSeries = {
  label?: string;
  color?: string;
  points: GraphPoint[];
};

export type GraphSpec = {
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  series: GraphSeries[];
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function sanitizeGraphSpec(input: unknown): GraphSpec | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const xMin = asFiniteNumber(raw.xMin);
  const xMax = asFiniteNumber(raw.xMax);
  const yMin = asFiniteNumber(raw.yMin);
  const yMax = asFiniteNumber(raw.yMax);
  if (xMin === null || xMax === null || yMin === null || yMax === null) return null;
  if (xMax <= xMin || yMax <= yMin) return null;

  const rawSeries = Array.isArray(raw.series) ? raw.series : [];
  const series: GraphSeries[] = rawSeries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const s = entry as Record<string, unknown>;
      const points = (Array.isArray(s.points) ? s.points : [])
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const r = p as Record<string, unknown>;
          const x = asFiniteNumber(r.x);
          const y = asFiniteNumber(r.y);
          if (x === null || y === null) return null;
          return { x, y };
        })
        .filter((p): p is GraphPoint => p !== null)
        .slice(0, 400);
      if (points.length < 2) return null;
      return {
        label: typeof s.label === "string" ? s.label.slice(0, 60) : undefined,
        color: typeof s.color === "string" ? s.color.slice(0, 20) : undefined,
        points,
      };
    })
    .filter((s): s is GraphSeries => s !== null)
    .slice(0, 4);

  if (series.length === 0) return null;

  return {
    title: typeof raw.title === "string" ? raw.title.slice(0, 120) : undefined,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle.slice(0, 180) : undefined,
    xLabel: typeof raw.xLabel === "string" ? raw.xLabel.slice(0, 40) : undefined,
    yLabel: typeof raw.yLabel === "string" ? raw.yLabel.slice(0, 40) : undefined,
    xMin,
    xMax,
    yMin,
    yMax,
    series,
  };
}
