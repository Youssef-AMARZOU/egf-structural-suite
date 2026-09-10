import React from 'react';

export type ModuleStatus = 'pass' | 'fail' | 'warn' | 'neutral' | 'computing';
export type CategoryKey = 'Poteaux' | 'Dalles' | 'Poutres' | 'Fondations';

export const CATEGORY_ACCENT: Record<CategoryKey, string> = {
  Poteaux: '#4C8DFF',
  Dalles: '#2DD4BF',
  Poutres: '#A78BFA',
  Fondations: '#F5A524',
};

/** Heuristic verdict → compliance status used by all workstation panels. */
export function verdictStatus(v: string | undefined | null): ModuleStatus {
  if (!v) return 'computing';
  if (/non[\s_-]?v[eé]rifi[eé]|non[\s_-]?conforme|d[eé]pass|attention|insuffisant|échec|fail/i.test(v)) return 'fail';
  if (/\bok\b|v[eé]rifi[eé]|conforme|admissible|suffisant/i.test(v)) return 'pass';
  if (/proche|limite|équilibre|équilibre/i.test(v)) return 'warn';
  return 'neutral';
}

const BADGE: Record<ModuleStatus, { label: string; icon: string; cls: string }> = {
  pass: { label: 'Conforme', icon: '✓', cls: 'bg-status-pass/15 text-status-pass shadow-glow-pass' },
  fail: { label: 'Non conforme', icon: '✕', cls: 'bg-status-fail/15 text-status-fail shadow-glow-fail' },
  warn: { label: 'À vérifier', icon: '!', cls: 'bg-status-warn/15 text-status-warn shadow-glow-warn' },
  neutral: { label: 'Info', icon: '•', cls: 'bg-slate-500/15 text-slate-400' },
  computing: { label: 'Calcul…', icon: '◌', cls: 'bg-cat-poteaux/15 text-cat-poteaux' },
};

export const StatusBadge: React.FC<{ status: ModuleStatus }> = ({ status }) => {
  const b = BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-full ${b.cls}`}>
      <span className="text-[12px] leading-none">{b.icon}</span>
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
  category?: CategoryKey;
  params: React.ReactNode;
  sketch: React.ReactNode;
  results: React.ReactNode;
}

/** Cockpit shell: breadcrumb header, 3-column glass workspace, print report. */
export const Workstation: React.FC<WorkstationProps> = ({
  title, subtitle, eurocode, status = 'neutral', live = false,
  category = 'Poutres', params, sketch, results,
}) => {
  const acc = CATEGORY_ACCENT[category];
  return (
    <div className="space-y-4" style={{ '--ws-acc': acc } as React.CSSProperties}>
      <div className="ws-print-head">
        <h1>{title}</h1>
        <p>
          Note de calcul — EGF Structural Suite
          {eurocode ? ` · ${eurocode}` : ''} · édité le{' '}
          {new Date().toLocaleDateString('fr-FR')} · Statut : {BADGE[status].label}
        </p>
      </div>

      <div className="glass rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-slate-500 dark:text-slate-400">
            <span style={{ color: acc }} className="font-semibold">{category}</span>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="font-mono">{title}</span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {eurocode && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300">
              {eurocode}
            </span>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="screen-only text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            title="Exporter la note de calcul (choisir « Enregistrer au format PDF »)"
          >
            🖨 Export PDF
          </button>
          <StatusBadge status={status} />
          {live && (
            <span className="text-[10px] font-mono text-cat-poteaux animate-pulse">● live</span>
          )}
        </div>
      </div>

      <div className="ws-grid grid grid-cols-12 gap-4">
        <div className="ws-params glass rounded-2xl col-span-3 p-5 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {params}
        </div>
        <div className="col-span-5 space-y-4 min-w-0">{sketch}</div>
        <div className="glass rounded-2xl col-span-4 p-5 space-y-4 min-w-0">
          {results}
        </div>
      </div>
    </div>
  );
};
