import { getCurrentWindow } from '@tauri-apps/api/window';

export function TitleBar() {
  const win = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between px-2 bg-[#0a0f1a] dark:bg-[#0a0f1a] select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-1" data-tauri-drag-region>
        <img src="/icon.png" alt="" className="w-4 h-4 rounded-sm" data-tauri-drag-region />
        <span className="text-[11px] font-semibold text-slate-400 tracking-wide" data-tauri-drag-region>EGF Structural Suite</span>
      </div>

      <div className="flex items-center gap-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => win.minimize()}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Réduire"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1"/></svg>
        </button>
        <button
          onClick={() => win.toggleMaximize()}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition"
          aria-label="Agrandir"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="9" height="9" rx="1"/></svg>
        </button>
        <button
          onClick={() => win.close()}
          className="w-11 h-8 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition rounded-tr-lg"
          aria-label="Fermer"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
        </button>
      </div>
    </div>
  );
}
