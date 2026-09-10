import React from 'react';
import { MathBlock } from './MathBlock';

interface FormulaCardProps {
  title: string;
  latex: string;
  description?: string;
  variables?: { symbol: string; meaning: string; value?: string | number; unit?: string }[];
  status?: 'pass' | 'fail' | 'warn' | 'neutral';
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  latex,
  description,
  variables,
  status = 'neutral',
}) => {
  const statusBorder = {
    pass: 'border-emerald-500/40 bg-emerald-950/10',
    fail: 'border-rose-500/40 bg-rose-950/10',
    warn: 'border-amber-500/40 bg-amber-950/10',
    neutral: 'border-slate-800 bg-slate-900/60',
  }[status];

  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm transition-all ${statusBorder}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
        {status !== 'neutral' && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              status === 'pass'
                ? 'bg-emerald-500/20 text-emerald-400'
                : status === 'warn'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {status === 'pass' ? 'Vérifié' : status === 'warn' ? 'À vérifier' : 'Non Conforme'}
          </span>
        )}
      </div>

      <div className="py-3 text-slate-100">
        <MathBlock math={latex} display={true} />
      </div>

      {description && <p className="text-xs text-slate-400 italic mb-3">{description}</p>}

      {variables && variables.length > 0 && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/40 text-xs">
          {variables.map((v, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-950/40 px-2.5 py-1.5 rounded-md">
              <span className="font-mono text-slate-300">
                <MathBlock math={v.symbol} />
                <span className="text-slate-500 ml-1.5">— {v.meaning}</span>
              </span>
              {v.value !== undefined && (
                <span className="font-mono font-medium text-amber-400">
                  {v.value} <span className="text-slate-500 text-[10px]">{v.unit || ''}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
