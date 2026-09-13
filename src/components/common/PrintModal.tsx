import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  eurocode?: string;
  status: Exclude<ModuleStatus, 'computing'>;
  statusLabel: string;
  verdict?: string;
  figures: PrintFigure[];
  annexLabel: string;
  appVersion: string;
}

/** Light cartouche print preview — the certified title block of the note. */
export const PrintModal: React.FC<PrintModalProps> = ({
  open, onClose, title, eurocode, status, statusLabel, verdict, figures, annexLabel, appVersion,
}) => {
  useEffect(() => {
    if (open) document.body.classList.add('print-modal');
    else document.body.classList.remove('print-modal');
    return () => document.body.classList.remove('print-modal');
  }, [open ]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  const bar = status === 'pass' ? '#10B981' : status === 'fail' ? '#EF4444' : '#F59E0B';
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div id="print-sheet" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-2 rounded-t-lg" style={{ background: bar }} />
        <div className="p-8">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-slate-500">EGF STRUCTURAL SUITE — NOTE DE CALCUL</div>
              <h2 className="text-[22px] font-bold mt-1">{title}</h2>
              <div className="text-[12px] text-slate-500 mt-1">
                {eurocode ?? 'Eurocode'} · {annexLabel} · éditée le {new Date().toLocaleDateString('fr-FR')} · v{appVersion}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold tracking-wider text-slate-500">STATUT</div>
              <div className="text-[15px] font-bold" style={{ color: bar }}>{statusLabel}</div>
            </div>
          </div>

          {verdict && (
            <p className="text-[13px] italic text-slate-600 my-4">{verdict}</p>
          )}

          <table className="w-full text-[13px] mt-2">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-300">
                <th className="py-1.5 pr-2">Grandeur</th>
                <th className="py-1.5 pr-2 text-right">Valeur</th>
                <th className="py-1.5 w-16">Unité</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {figures.map((f, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1.5 pr-2 font-sans">{f.label}</td>
                  <td className="py-1.5 pr-2 text-right font-semibold">{f.value}</td>
                  <td className="py-1.5 text-slate-500">{f.unit ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
            <span>D'après les programmes EGF © Henry Thonier</span>
            <span>Document généré par calcul — vérifier l'adéquation au projet</span>
          </div>

          <div className="screen-only mt-5 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="text-[13px] px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Fermer
            </button>
            <button
              onClick={() => window.print()}
              className="text-[13px] font-semibold px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
            >
              🖨 Imprimer / PDF
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
