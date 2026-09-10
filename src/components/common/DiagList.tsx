import React from 'react';

export interface DiagItem {
  severity: 'ok' | 'warn' | 'fail' | 'info';
  message: React.ReactNode;
}

const SEV: Record<DiagItem['severity'], { icon: string; border: string; bg: string; fg: string }> = {
  ok: { icon: '✓', border: 'border-status-pass', bg: 'bg-status-pass/10', fg: 'text-status-pass' },
  warn: { icon: '!', border: 'border-status-warn', bg: 'bg-status-warn/10', fg: 'text-status-warn' },
  fail: { icon: '✕', border: 'border-status-fail', bg: 'bg-status-fail/10', fg: 'text-status-fail' },
  info: { icon: '•', border: 'border-slate-400', bg: 'bg-slate-500/10', fg: 'text-slate-500 dark:text-slate-400' },
};

/** Structured diagnostics: severity icon + colored rail + hanging indent. */
export const DiagList: React.FC<{ items: DiagItem[] }> = ({ items }) => (
  <ul className="space-y-2 text-[13px] leading-snug">
    {items.map((d, i) => {
      const s = SEV[d.severity];
      return (
        <li key={i} className={`flex gap-2 rounded-r-lg border-l-2 ${s.border} ${s.bg} pl-2.5 pr-2 py-1.5`}>
          <span className={`shrink-0 font-bold ${s.fg}`}>{s.icon}</span>
          <span className="text-slate-600 dark:text-slate-300">{d.message}</span>
        </li>
      );
    })}
  </ul>
);
