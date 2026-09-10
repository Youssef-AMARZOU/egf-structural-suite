import React from 'react';

export type ModuleStatus = 'pass' | 'fail' | 'warn' | 'neutral' | 'computing';

/** Heuristic verdict → compliance status used by all workstation panels. */
export function verdictStatus(v: string | undefined | null): ModuleStatus {
  if (!v) return 'computing';
  if (/non[\s_-]?v[eé]rifi[eé]|non[\s_-]?conforme|d[eé]pass|attention|insuffisant|échec|fail/i.test(v)) return 'fail';
  if (/\bok\b|v[eé]rifi[eé]|conforme|admissible|suffisant/i.test(v)) return 'pass';
  if (/proche|limite|équilibre|équilibre/i.test(v)) return 'warn';
  return 'neutral';
}

const BADGE: Record<ModuleStatus, { label: string; cls: string; dot: string }> = {
  pass: { label: 'Conforme', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  fail: { label: 'Non conforme', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
  warn: { label: 'À vérifier', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  neutral: { label: 'Info', cls: 'bg-slate-500/15 text-slate-500', dot: 'bg-slate-400' },
  computing: { label: 'Calcul…', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
};

export const StatusBadge: React.FC<{ status: ModuleStatus }> = ({ status }) => {
  const b = BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${b.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
      {b.label}
    </span>
  );
};

interface WorkstationProps {
  title: string;
  subtitle?: string;
  eurocode?: string;
  status?: ModuleStatus;
  live?: boolean;
  params: React.ReactNode;
  sketch: React.ReactNode;
  results: React.ReactNode;
}

/** Standard three-column engineering workstation: Parameters | Sketch | Proof. */
export const Workstation: React.FC<WorkstationProps> = ({
  title, subtitle, eurocode, status = 'neutral', live = false, params, sketch, results,
}) => (
  <div className="space-y-3">
    <div className="ws-print-head">
      <h1>{title}</h1>
      <p>
        Note de calcul — EGF Structural Suite
        {eurocode ? ` · ${eurocode}` : ''} · édité le{' '}
        {new Date().toLocaleDateString('fr-FR')} · Statut : {BADGE[status].label}
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] px-4 py-2.5">
      <div>
        <h2 className="text-sm font-bold">
          {title}
          {live && <span className="ml-2 font-mono text-[10px] text-blue-500 animate-pulse">● live</span>}
        </h2>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="screen-only text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10"
          title="Imprimer la note de calcul (choisir « Enregistrer au format PDF »)"
        >
          🖨 Note PDF
        </button>
        {eurocode && (
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
            {eurocode}
          </span>
        )}
        <StatusBadge status={status} />
      </div>
    </div>

    <div className="ws-grid grid grid-cols-12 gap-4">
      <div className="ws-params col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Paramètres
        </div>
        {params}
      </div>
      <div className="col-span-5 space-y-4">{sketch}</div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Résultats & preuve
        </div>
        {results}
      </div>
    </div>
  </div>
);
