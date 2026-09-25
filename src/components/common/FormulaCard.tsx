import React, { useContext } from 'react';
import { PrintLightContext } from '../drafting/SectionCanvas';
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
  const light = useContext(PrintLightContext);

  const statusBorder = light
    ? {
        pass: 'border-emerald-400/60 bg-emerald-50',
        fail: 'border-rose-400/60 bg-rose-50',
        warn: 'border-amber-400/60 bg-amber-50',
        neutral: 'border-slate-300 bg-slate-50',
      }[status]
    : {
        pass: 'border-emerald-500/40 bg-emerald-950/10',
        fail: 'border-rose-500/40 bg-rose-950/10',
        warn: 'border-amber-500/40 bg-amber-950/10',
        neutral: 'border-slate-800 bg-slate-900/60',
      }[status];

  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm transition-all ${statusBorder}`}>
      <div className={`flex items-center justify-between pb-2 ${light ? 'border-slate-200' : 'border-slate-800/60'}`}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider ${light ? 'text-slate-500' : 'text-slate-400'}`}>{title}</h4>
        {status !== 'neutral' && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              status === 'pass'
                ? light ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                : status === 'warn'
                  ? light ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'
                  : light ? 'bg-rose-100 text-rose-700' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {status === 'pass' ? 'Vérifié' : status === 'warn' ? 'À vérifier' : 'Non Conforme'}
          </span>
        )}
      </div>

      <div className={`py-3 ${light ? 'text-slate-900' : 'text-slate-100'}`}>
        <MathBlock math={latex} display={true} />
      </div>

      {description && <p className={`text-xs italic mb-3 ${light ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>}

      {variables && variables.length > 0 && (
        <div className={`mt-2 grid grid-cols-1 gap-1.5 pt-2 text-xs ${light ? 'border-slate-200' : 'border-slate-800/40 border-t'}`}>
          {variables.map((v, idx) => (
            <div key={idx} className={`${light ? 'bg-slate-100' : 'bg-slate-950/40'} px-2.5 py-1.5 rounded-md min-w-0`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`shrink-0 font-mono ${light ? 'text-slate-700' : 'text-slate-300'}`}>
                  <MathBlock math={v.symbol} />
                </span>
                <span className={`${light ? 'text-slate-600' : 'text-slate-500'} truncate`}>{v.meaning}</span>
              </div>
              {v.value !== undefined && (
                <div className={`font-mono font-medium text-right text-[13px] mt-0.5 truncate ${light ? 'text-amber-600' : 'text-amber-400'}`}>
                  {v.value} <span className={`${light ? 'text-slate-500' : 'text-slate-500'} text-[10px]`}>{v.unit || ''}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
