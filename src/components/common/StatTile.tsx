import React from 'react';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  tone?: 'pass' | 'fail' | 'warn' | 'neutral';
}

const TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  pass: 'text-status-pass',
  fail: 'text-status-fail',
  warn: 'text-status-warn',
  neutral: 'text-ink-primary dark:text-ink-primary',
};

/** Hero/secondary metric tile: label on top, big tabular number, unit. */
export const StatTile: React.FC<StatTileProps> = ({ label, value, unit, tone = 'neutral' }) => (
  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 min-w-0">
    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{label}</div>
    <div className={`font-mono font-semibold truncate ${TONE[tone]}`} style={{ fontSize: 16 }}>
      {value}
      {unit && <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 ml-1">{unit}</span>}
    </div>
  </div>
);
