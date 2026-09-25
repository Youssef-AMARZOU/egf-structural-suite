import React, { useContext } from 'react';
import { PrintLightContext } from './SectionCanvas';

interface AxisTicksProps {
  /** start of axis in px (optional, for reference) */
  origin?: [number, number];
  /** end of axis in px (optional, for reference) */
  end?: [number, number];
  /** data values at tick positions */
  values: number[];
  /** map data→px for each value */
  map: (v: number) => [number, number];
  /** unit suffix on labels */
  unit?: string;
  /** font size */
  fontSize?: number;
  /** color */
  color?: string;
  /** side to put labels: 'below' for horizontal, 'left' for vertical */
  side?: 'below' | 'left' | 'right' | 'above';
  /** decimals */
  decimals?: number;
}

/** Reusable axis graduation lines + labels for SVG diagrams. */
export const AxisTicks: React.FC<AxisTicksProps> = ({
  values, map, unit = '', fontSize = 9, color = '#94A3B8', side = 'below', decimals = 0,
}) => {
  return (
    <g>
      {values.map((v, i) => {
        const [px, py] = map(v);
        const label = v.toFixed(decimals);
        let tx = px, ty = py;
        let anchor: 'middle' | 'start' | 'end' = 'middle';
        let dx = 0, dy = 0;
        if (side === 'below') { dy = fontSize + 4; anchor = 'middle'; }
        else if (side === 'above') { dy = -4; anchor = 'middle'; }
        else if (side === 'left') { dx = -(fontSize + 4); dy = fontSize / 3; anchor = 'end'; }
        else if (side === 'right') { dx = fontSize + 4; dy = fontSize / 3; anchor = 'start'; }
        tx += dx; ty += dy;
        return (
          <g key={i}>
            <line x1={px} y1={py - 2} x2={px} y2={py + 2} stroke={color} strokeWidth={1} />
            <text x={tx} y={ty} fontSize={fontSize} fill={color} textAnchor={anchor}>
              {label}{unit ? ` ${unit}` : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
};

interface LegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}

interface InlineLegendProps {
  items: LegendItem[];
  x: number;
  y: number;
  fontSize?: number;
}

/** Compact inline legend box for SVG diagrams. */
export const InlineLegend: React.FC<InlineLegendProps> = ({
  items, x, y, fontSize = 9,
}) => {
  const light = useContext(PrintLightContext);
  const lineH = fontSize + 3;
  const boxW = Math.max(...items.map((it) => it.label.length * fontSize * 0.55 + 22));
  const boxH = items.length * lineH + 8;

  const bg = light ? '#ffffff' : '#1E293B';
  const bgOpacity = light ? 1 : 0.85;
  const stroke = light ? '#CBD5E1' : '#334155';
  const textColor = light ? '#1E293B' : '#CBD5E1';

  return (
    <g>
      <rect x={x} y={y} width={boxW} height={boxH} rx={4}
        fill={bg} fillOpacity={bgOpacity} stroke={stroke} strokeWidth={light ? 0.8 : 0.5} />
      {items.map((it, i) => {
        const cy = y + 6 + i * lineH + lineH / 2;
        return (
          <g key={i}>
            <line x1={x + 6} y1={cy} x2={x + 20} y2={cy}
              stroke={it.color} strokeWidth={2} strokeLinecap="round"
              strokeDasharray={it.dashed ? '4 2' : undefined} />
            <text x={x + 24} y={cy + fontSize / 3} fontSize={fontSize} fontWeight={600} fill={textColor}>
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
