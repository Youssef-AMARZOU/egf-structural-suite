import React from 'react';

export interface RebarPos { x: number; y: number; phi: number; }

interface RebarGroupProps {
  bars: RebarPos[];
  /** pixels per mm */
  pxPerMm: number;
  fill?: string;
  stroke?: string;
  showLabels?: boolean;
}

/** High-visibility rebar cross-sections with diameter tooltips. */
export const RebarGroup: React.FC<RebarGroupProps> = ({
  bars, pxPerMm, fill = '#22c55e', stroke = '#15803d', showLabels = false,
}) => (
  <g>
    {bars.map((b, i) => {
      const r = Math.max(2, (b.phi / 2) * pxPerMm);
      return (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={r} fill={fill} stroke={stroke} strokeWidth={1}>
            <title>{`φ${b.phi} mm`}</title>
          </circle>
          <circle cx={b.x - r * 0.25} cy={b.y - r * 0.25} r={r * 0.28} fill="#ffffff" opacity={0.55} />
          {showLabels && (
            <text x={b.x + r + 2} y={b.y + 3} fontSize={8} fill={fill}>
              {`φ${b.phi}`}
            </text>
          )}
        </g>
      );
    })}
  </g>
);

/** Evenly distribute `count` bars of diameter phi along a horizontal row. */
export function rowBars(
  count: number, x0: number, x1: number, y: number, phi: number,
): RebarPos[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: (x0 + x1) / 2, y, phi }];
  return Array.from({ length: count }, (_, i) => ({
    x: x0 + ((x1 - x0) * i) / (count - 1),
    y,
    phi,
  }));
}
