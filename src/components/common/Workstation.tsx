import React, { useEffect, useState } from 'react';
import { ANNEXES, useAnnex } from './AnnexContext';
import { PrintModal, type PrintFigure } from './PrintModal';

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

export interface Preset {
  label: string;
  apply: () => void;
}

interface WorkstationProps {
  title: string;
  subtitle?: string;
  eurocode?: string;
  status?: ModuleStatus;
  live?: boolean;
  /** IPC round-trip of the last settled calculation, ms. */
  liveMs?: number | null;
  category?: CategoryKey;
  presets?: Preset[];
  /** Working ratio η — tints accents ≥0.90, rings the sketch in crimson >1.0. */
  eta?: number;
  verdict?: string;
  figures?: PrintFigure[];
  params: React.ReactNode;
  sketch: React.ReactNode;
  results: React.ReactNode;
}

/** Cockpit shell: 52px header bar, 3-column glass workspace, print report. */
export const Workstation: React.FC<WorkstationProps> = ({
  title, subtitle, eurocode, status = 'neutral', live = false, liveMs = null,
  category = 'Poutres', presets, eta, verdict, figures = [], params, sketch, results,
}) => {
  const acc = CATEGORY_ACCENT[category];
  const { annex, setAnnex } = useAnnex();
  const [printOpen, setPrintOpen] = useState(false);
  const etaHot = eta !== undefined && Number.isFinite(eta) && eta >= 0.9;
  const etaFail = eta !== undefined && Number.isFinite(eta) && eta > 1.0;
  const wsAcc = etaFail ? '#F87171' : etaHot ? '#FBBF24' : acc;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P') && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        setPrintOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="space-y-4" style={{ '--ws-acc': wsAcc } as React.CSSProperties}>
      <div className="ws-print-head">
        <h1>{title}</h1>
        <p>
          Note de calcul — EGF Structural Suite
          {eurocode ? ` · ${eurocode}` : ''} · édité le{' '}
          {new Date().toLocaleDateString('fr-FR')} · Statut : {BADGE[status].label}
        </p>
      </div>

      <div className="glass rounded-2xl px-5 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ minHeight: 52 }}>
        <div className="min-w-0 mr-auto">
          <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">[EC2]</span>{' '}
            <span style={{ color: acc }} className="font-semibold">{category}</span>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="font-mono text-slate-200">{title}</span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 mt-px truncate">{subtitle}</p>}
        </div>

        {presets && presets.length > 0 && (
          <div className="flex gap-1.5" role="group" aria-label="Configurations types">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.apply}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-300 hover:bg-slate-500/10 active:scale-95 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${live ? 'text-status-warn' : 'text-status-pass'}`}
            title="État de synchronisation du calcul"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-status-warn animate-pulse' : 'bg-status-pass'}`} />
            {live ? '● calcul…' : `● Synchronisé${liveMs !== null ? ` (${liveMs} ms)` : ''}`}
          </span>
          {eurocode && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300">
              {eurocode}
            </span>
          )}
          <select
            value={annex.id}
            onChange={(e) => setAnnex(e.target.value)}
            title={annex.hint}
            aria-label="Annexe nationale"
            className="text-[11px] font-mono px-2 py-1 rounded-lg border border-slate-300 dark:border-white/15 bg-transparent text-slate-500 dark:text-slate-300 outline-none cursor-pointer"
          >
            {ANNEXES.map((a) => (
              <option key={a.id} value={a.id} className="text-slate-900">{a.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPrintOpen(true)}
            className="screen-only text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            title="Aperçu avant impression (Ctrl+P)"
          >
            🖨 Note de Calcul <kbd className="kbd ml-1">Ctrl+P</kbd>
          </button>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="ws-grid grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="ws-params glass rounded-2xl xl:col-span-3 p-5 space-y-4 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto">
          {params}
        </div>
        <div className={`xl:col-span-5 space-y-4 min-w-0 rounded-2xl ${etaFail ? 'ring-1 ring-status-fail shadow-glow-fail' : ''}`}>
          {sketch}
        </div>
        <div className="glass rounded-2xl xl:col-span-4 p-5 space-y-4 min-w-0">
          {results}
        </div>
      </div>

      <PrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        title={title}
        eurocode={eurocode}
        status={status === 'computing' ? 'neutral' : status}
        statusLabel={BADGE[status].label}
        verdict={verdict}
        figures={figures}
        annexLabel={annex.label}
        appVersion={typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''}
      />
    </div>
  );
};

// Re-export for module convenience (single import point).
export { PrintModal };
export type { PrintFigure };
