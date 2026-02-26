"use client";

import { useMemo } from "react";
import type { GraphSpec } from "@/lib/graph-spec";

type GraphCardProps = {
  spec: GraphSpec;
};

const DEFAULT_COLORS = ["#FF6200", "#2563EB", "#059669", "#7C3AED"];

export function GraphCard({ spec }: GraphCardProps) {
  const isValidSpec =
    !!spec &&
    Array.isArray(spec.series) &&
    spec.series.length > 0 &&
    Number.isFinite(spec.xMin) &&
    Number.isFinite(spec.xMax) &&
    Number.isFinite(spec.yMin) &&
    Number.isFinite(spec.yMax) &&
    spec.xMax > spec.xMin &&
    spec.yMax > spec.yMin;

  const { pathData, gridLinesX, gridLinesY } = useMemo(() => {
    if (!isValidSpec) {
      return { pathData: [], gridLinesX: [], gridLinesY: [] };
    }

    const width = 640;
    const height = 360;
    const padLeft = 52;
    const padRight = 20;
    const padTop = 18;
    const padBottom = 44;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;

    const toSvgX = (x: number) => padLeft + ((x - spec.xMin) / (spec.xMax - spec.xMin)) * innerW;
    const toSvgY = (y: number) => padTop + (1 - (y - spec.yMin) / (spec.yMax - spec.yMin)) * innerH;

    const xTicks = 6;
    const yTicks = 6;
    const gridLinesX = Array.from({ length: xTicks + 1 }, (_, i) => {
      const t = i / xTicks;
      const xValue = spec.xMin + t * (spec.xMax - spec.xMin);
      return { x: padLeft + t * innerW, label: xValue };
    });
    const gridLinesY = Array.from({ length: yTicks + 1 }, (_, i) => {
      const t = i / yTicks;
      const yValue = spec.yMin + t * (spec.yMax - spec.yMin);
      return { y: padTop + (1 - t) * innerH, label: yValue };
    });

    const pathData = spec.series.map((series, idx) => {
      const d = series.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`)
        .join(" ");
      return {
        d,
        color: series.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        label: series.label || `Serie ${idx + 1}`,
      };
    }).filter((s) => s.d.length > 0);

    return { pathData, gridLinesX, gridLinesY };
  }, [spec, isValidSpec]);

  if (!isValidSpec || pathData.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-[#E5E7EB] bg-white/90 p-3 shadow-sm">
      {spec.title ? <p className="text-sm font-semibold text-[#111827]">{spec.title}</p> : null}
      {spec.subtitle ? <p className="mt-0.5 text-xs text-[#6B7280]">{spec.subtitle}</p> : null}

      <div className="mt-2 overflow-x-auto">
        <svg viewBox="0 0 640 360" className="h-auto min-w-[560px] w-full" role="img" aria-label={spec.title || "Grafico"}>
          <rect x="0" y="0" width="640" height="360" fill="#FFFFFF" />

          {gridLinesX.map((g, i) => (
            <g key={`gx-${i}`}>
              <line x1={g.x} y1={18} x2={g.x} y2={316} stroke="#EEF2F7" strokeWidth="1" />
              <text x={g.x} y={334} textAnchor="middle" fontSize="11" fill="#6B7280">
                {g.label.toFixed(2)}
              </text>
            </g>
          ))}

          {gridLinesY.map((g, i) => (
            <g key={`gy-${i}`}>
              <line x1={52} y1={g.y} x2={620} y2={g.y} stroke="#EEF2F7" strokeWidth="1" />
              <text x={44} y={g.y + 4} textAnchor="end" fontSize="11" fill="#6B7280">
                {g.label.toFixed(2)}
              </text>
            </g>
          ))}

          <line x1={52} y1={316} x2={620} y2={316} stroke="#CBD5E1" strokeWidth="1.25" />
          <line x1={52} y1={18} x2={52} y2={316} stroke="#CBD5E1" strokeWidth="1.25" />

          {pathData.map((p, idx) => (
            <path key={`p-${idx}`} d={p.d} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" />
          ))}

          {spec.xLabel ? (
            <text x={336} y={354} textAnchor="middle" fontSize="12" fill="#374151">
              {spec.xLabel}
            </text>
          ) : null}

          {spec.yLabel ? (
            <text x={16} y={167} textAnchor="middle" fontSize="12" fill="#374151" transform="rotate(-90 16 167)">
              {spec.yLabel}
            </text>
          ) : null}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        {pathData.map((p, idx) => (
          <div key={`legend-${idx}`} className="flex items-center gap-1.5 text-xs text-[#4B5563]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
