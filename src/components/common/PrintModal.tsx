import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PrintLightContext } from '../drafting/SectionCanvas';
import type { ModuleStatus } from './Workstation';

export interface PrintFigure {
  label: string;
  value: string;
  unit?: string;
}

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eurocode?: string;
  status: Exclude<ModuleStatus, 'computing'>;
  statusLabel: string;
  verdict?: string;
  figures: PrintFigure[];
  annexLabel: string;
  appVersion: string;
  sketch?: React.ReactNode;
  results?: React.ReactNode;
}

/** Professional calculation note print preview — full report with diagrams, formulas, and verdict. */
export const PrintModal: React.FC<PrintModalProps> = ({
  open, onClose, title, subtitle, eurocode, status, statusLabel, verdict,
  figures, annexLabel, appVersion, sketch, results,
}) => {
  useEffect(() => {
    if (open) document.body.classList.add('print-modal');
    else document.body.classList.remove('print-modal');
    return () => document.body.classList.remove('print-modal');
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  const bar = status === 'pass' ? '#10B981' : status === 'fail' ? '#EF4444' : '#F59E0B';
  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print-modal-overlay" onClick={onClose}>
      <div id="print-sheet" className="w-full max-w-[900px] max-h-[92vh] overflow-y-auto bg-white text-slate-900 rounded-lg shadow-2xl print-report" onClick={(e) => e.stopPropagation()}>

        {/* ── Header cartouche ── */}
        <div className="border-b-2 border-slate-900 px-8 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <span className="text-white font-bold text-[11px]">EGF</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Note de Calcul</div>
                  <div className="text-[10px] text-slate-400">EGF Structural Suite — {eurocode ?? 'Eurocode'}</div>
                </div>
              </div>
              <h2 className="text-[20px] font-extrabold text-slate-900 mt-2 leading-tight">{title}</h2>
              {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle} — by ©Youssef AMARZOU</p>}
            </div>
            <div className="text-right shrink-0 ml-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2" style={{ borderColor: bar, color: bar }}>
                <span className="text-[14px]">{status === 'pass' ? '✓' : status === 'fail' ? '✕' : '!'}</span>
                <span className="text-[13px] font-bold">{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-3 text-[10px] text-slate-500 border-t border-slate-200 pt-2">
            <span>Annexe : <strong>{annexLabel}</strong></span>
            <span>Éditée le <strong>{today}</strong></span>
            <span>Version <strong>{appVersion}</strong></span>
          </div>
        </div>

        {/* ── Verdict banner ── */}
        {verdict && (
          <div className="mx-8 mt-5 px-4 py-3 rounded-lg border-l-4" style={{ borderColor: bar, backgroundColor: `${bar}10` }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Conclusion</div>
            <p className="text-[13px] font-semibold" style={{ color: bar }}>{verdict}</p>
          </div>
        )}

        {/* ── Figures summary table ── */}
        {figures.length > 0 && (
          <div className="mx-8 mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Résultats principaux</h3>
            <table className="w-full text-[12px] border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3 font-semibold">Grandeur</th>
                  <th className="py-2 px-3 font-semibold text-right">Valeur</th>
                  <th className="py-2 px-3 font-semibold w-20">Unité</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {figures.map((f, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-1.5 px-3 font-sans text-slate-700">{f.label}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-slate-900">{f.value}</td>
                    <td className="py-1.5 px-3 text-slate-500">{f.unit ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Sketch / Diagrams section ── */}
        {sketch && (
          <div className="mx-8 mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-slate-300 inline-block" />
              Schémas & Diagrammes
            </h3>
            <div className="print-sketch-container">
              <PrintLightContext.Provider value={true}>
                {sketch}
              </PrintLightContext.Provider>
            </div>
          </div>
        )}

        {/* ── Formulas & detailed results ── */}
        {results && (
          <div className="mx-8 mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-slate-300 inline-block" />
              Formules & Détail du Calcul
            </h3>
            <div className="print-results-container">
              <PrintLightContext.Provider value={true}>
                {results}
              </PrintLightContext.Provider>
            </div>
          </div>
        )}

        {/* ── Diagnostics ── */}
        <div className="mx-8 mt-6 mb-4">
          <details open className="print-diag">
            <summary className="text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer">Diagnostics</summary>
            <div className="mt-2 text-[11px] font-mono text-slate-600 space-y-0.5 bg-slate-50 rounded-lg p-3 border border-slate-200">
              {/* Diagnostics are rendered inside the results node — this is a placeholder for the section header */}
            </div>
          </details>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-200 px-8 py-4 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50 rounded-b-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">EGF</span>
            </div>
            <span>D'après les programmes EGF © Henry Thonier — by ©Youssef AMARZOU</span>
          </div>
          <span>Document généré par calcul — vérifier l'adéquation au projet</span>
        </div>

        {/* ── Action buttons ── */}
        <div className="screen-only px-8 py-4 border-t border-slate-200 flex gap-3 justify-end bg-white rounded-b-lg">
          <button
            onClick={onClose}
            className="text-[13px] px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
          >
            Fermer
          </button>
          <button
            onClick={() => window.print()}
            className="text-[13px] font-semibold px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
          >
            🖨 Imprimer / Exporter PDF
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
