import React from 'react';

export type DiagramKind = 'moment' | 'shear' | 'deflection';

const COLORS: Record<DiagramKind, string> = {
  moment: '#3b82f6',
  shear: '#f59e0b',
  deflection: '#8b5cf6',
};

interface DiagramOverlayProps {
  type: DiagramKind;
  /** polyline points already mapped to px */
  points: [number, number][];
  strokeWidth?: number;
  fill?: boolean;
  color?: string;
  zeroY?: number;
  closeX?: [number, number];
}

/** Catmull-Rom → Bézier smoothing for polyline data. */
export function toPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Smooth spline overlay for moment / shear / deflection diagrams. */
export const DiagramOverlay: React.FC<DiagramOverlayProps> = ({
  type, points, strokeWidth = 2, fill = false, color, zeroY, closeX,
}) => {
  const c = color ?? COLORS[type];
  const d = toPath(points);
  if (!d) return null;
  const closed =
    fill && zeroY !== undefined && closeX !== undefined
      ? `${d} L ${closeX[1]} ${zeroY} L ${closeX[0]} ${zeroY} Z`
      : null;
  return (
    <g>
      {closed && <path d={closed} fill={c} opacity={0.15} stroke="none" />}
      <path d={d} fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </g>
  );
};
