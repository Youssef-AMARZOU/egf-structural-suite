import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

export interface RatioItem {
  name: string;
  value: number;
  unit?: string;
  formula?: string;
}

interface RatioBarProps {
  items: RatioItem[];
  threshold?: number;
  height?: number;
  decimals?: number;
}

/** Compliance bar chart: labeled threshold, value labels, units, tooltips. */
export const RatioBar: React.FC<RatioBarProps> = ({
  items, threshold = 1, height = 220, decimals = 2,
}) => {
  if (items.length === 0) {
    return <div className="skel rounded-lg" style={{ height }} />;
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 22, right: 8, bottom: 0, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: unknown, _name: unknown, entry: unknown) => {
              const p = (entry as { payload?: RatioItem } | undefined)?.payload;
              const val = typeof v === 'number' ? v.toFixed(decimals) : String(v ?? '');
              return [`${val}${p?.unit ? ` ${p.unit}` : ''}${p?.formula ? ` — ${p.formula}` : ''}`, p?.name ?? ''];
            }}
          />
          <ReferenceLine
            y={threshold}
            stroke="#F87171"
            strokeDasharray="5 4"
            label={{ value: `Seuil = ${threshold}`, fontSize: 11, fill: '#F87171', position: 'insideTopRight' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {items.map((b, i) => (
              <Cell key={i} fill={b.value <= threshold ? '#34D399' : '#F87171'} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: unknown) =>
                typeof v === 'number' ? v.toFixed(decimals) : ''
              }
              style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fill: '#93A0B8' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
