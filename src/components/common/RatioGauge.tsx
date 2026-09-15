import React from 'react';

interface RatioGaugeProps {
  eta: number;
  size?: number;
  label?: string;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${(a1 - a0) > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** Radial working-ratio gauge: emerald → amber (≥0.90) → crimson (>1.0). */
export const RatioGauge: React.FC<RatioGaugeProps> = ({ eta, size = 148, label = 'η' }) => {
  const max = Math.max(1.25, (Number.isFinite(eta) ? eta : 0) * 1.12);
  const frac = Math.min(1, Math.max(0, (Number.isFinite(eta) ? eta : 0) / max));
  const A0 = -120;
  const A1 = 120;
  const zone = eta > 1 ? '#F87171' : eta >= 0.9 ? '#FBBF24' : '#34D399';
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = size / 2 - 14;
  const vA = A0 + (A1 - A0) * frac;
  // zone ticks at 0.9 and 1.0
  const t09 = A0 + (A1 - A0) * Math.min(1, 0.9 / max);
  const t10 = A0 + (A1 - A0) * Math.min(1, 1.0 / max);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${label} = ${eta}`}>
      <path d={arc(cx, cy, r, A0, A1)} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth={10} strokeLinecap="round" />
      <path d={arc(cx, cy, r, t09, Math.min(A1, t10 + (A1 - A0) * 0.001))} fill="none" stroke="#FBBF24" strokeWidth={10} opacity={0.45} />
      {frac > 0 && (
        <path d={arc(cx, cy, r, A0, Math.max(A0 + 0.5, vA))} fill="none" stroke={zone} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${zone}55)` }} />
      )}
      {[t09, t10].map((a, i) => {
        const [x0, y0] = polar(cx, cy, r - 9, a);
        const [x1, y1] = polar(cx, cy, r + 9, a);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#93A0B8" strokeWidth={1.4} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={24} fontWeight={700} fill="#F1F4FA" fontFamily="'JetBrains Mono',monospace">
        {Number.isFinite(eta) ? eta.toFixed(2) : '—'}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill="#93A0B8" fontFamily="'JetBrains Mono',monospace">
        {label}
      </text>
    </svg>
  );
};
