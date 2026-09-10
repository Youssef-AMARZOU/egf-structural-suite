import React from 'react';
import type { UpdateInfo } from '../../hooks/useAppUpdater';

interface UpdateDialogProps {
  open: boolean;
  info: UpdateInfo | null;
  progress: number | null;
  downloading: boolean;
  checking: boolean;
  error: string | null;
  upToDate: boolean;
  onClose: () => void;
  onInstall: () => void;
  onCheck: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  open, info, progress, downloading, checking, error, upToDate,
  onClose, onInstall, onCheck,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Mise à jour de l'application</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {info ? (
          <>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10">v{info.currentVersion}</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                v{info.version}
              </span>
              {info.date && (
                <span className="text-[11px] text-slate-400">
                  {new Date(info.date).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>

            {info.body && (
              <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto rounded bg-slate-50 dark:bg-white/5 p-3 text-slate-600 dark:text-slate-300">
                {info.body}
              </pre>
            )}

            {progress !== null && (
              <div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  {downloading ? `Téléchargement… ${progress}%` : 'Vérification terminée'}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded p-2">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onInstall}
                disabled={downloading}
                className="flex-1 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {downloading ? 'Installation en cours…' : 'Télécharger & Redémarrer'}
              </button>
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Plus tard
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              {checking
                ? 'Recherche de mises à jour…'
                : upToDate
                  ? 'Vous utilisez déjà la dernière version.'
                  : error ?? 'Aucune information de mise à jour.'}
            </p>
            {error && (
              <p className="text-xs text-rose-500 bg-rose-500/10 rounded p-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onCheck}
                disabled={checking}
                className="flex-1 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {checking ? 'Vérification…' : 'Vérifier maintenant'}
              </button>
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
