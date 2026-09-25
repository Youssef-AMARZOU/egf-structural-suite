import React, { useContext } from 'react';
import { PrintLightContext } from '../drafting/SectionCanvas';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  tone?: 'pass' | 'fail' | 'warn' | 'neutral';
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, unit, tone = 'neutral' }) => {
  const light = useContext(PrintLightContext);

  const valueColor = light
    ? {
        pass: 'text-emerald-700',
        fail: 'text-rose-600',
        warn: 'text-amber-700',
        neutral: 'text-slate-900',
      }[tone]
    : {
        pass: 'text-status-pass',
        fail: 'text-status-fail',
        warn: 'text-status-warn',
        neutral: 'text-ink-primary',
      }[tone];

  return (
    <div className={`rounded-lg border px-3 py-2 min-w-0 ${light ? 'border-slate-200 bg-slate-50' : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5'}`}>
      <div className={`text-[11px] truncate ${light ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{label}</div>
      <div className={`font-mono font-semibold truncate ${valueColor}`} style={{ fontSize: 16 }}>
        {value}
        {unit && <span className={`text-[11px] font-normal ml-1 ${light ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{unit}</span>}
      </div>
    </div>
  );
};
