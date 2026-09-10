import React from 'react';

interface StressStrainBlockProps {
  /** left edge x of the concrete section (px) */
  x: number;
  /** top of section (px) */
  yTop: number;
  /** total section height (px) */
  hPx: number;
  /** neutral-axis depth from top, in same units as hPx (may exceed hPx) */
  xNa: number;
  /** max diagram width (px) */
  wPx?: number;
  fill?: string;
  showNaLabel?: boolean;
}

/** Parabola-rectangle concrete stress block (EC2 §3.1.7, fck ≤ 50 MPa). */
export const StressStrainBlock: React.FC<StressStrainBlockProps> = ({
  x, yTop, hPx, xNa, wPx = 60, fill = '#6366f1', showNaLabel = true,
}) => {
  const xClamped = Math.max(1, xNa);
  const hc = Math.min(xClamped, hPx); // compressed height actually drawn
  const naY = yTop + xClamped;
  // rectangular part = top 1 - ec2/ecu2 = 42.9% of compressed depth
  const yRect = yTop + hc * 0.429;
  const yNaDraw = yTop + hc;
  // quadratic: vertical tangent at NA, horizontal at top of parabola zone
  const d = `M ${x} ${yNaDraw} Q ${x} ${yRect} ${x - wPx} ${yRect} L ${x - wPx} ${yTop} L ${x} ${yTop} Z`;
  return (
    <g>
      <path d={d} fill={fill} opacity={0.35} stroke={fill} strokeWidth={1.2} />
      {xClamped <= hPx * 1.5 && (
        <>
          <line
            x1={x - wPx - 14} y1={naY} x2={x + 30} y2={naY}
            stroke="#ef4444" strokeWidth={1.4} strokeDasharray="5 3"
          />
          {showNaLabel && (
            <text x={x + 34} y={naY + 3} fontSize={9} fill="#ef4444" fontWeight="bold">
              NA
            </text>
          )}
        </>
      )}
    </g>
  );
};
