import React, { useEffect, useRef, useState } from 'react';

interface SectionCanvasProps {
  title?: string;
  vbW?: number;
  vbH?: number;
  grid?: number;
  scaleLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/** Auto-scaling engineering viewport: grid background, wheel zoom + drag pan. */
export const SectionCanvas: React.FC<SectionCanvasProps> = ({
  title, vbW = 600, vbH = 400, grid = 20, scaleLabel, children, className = '',
}) => {
  const [vb, setVb] = useState({ x: 0, y: 0, w: vbW, h: vbH });
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const zoomBy = (f: number) => {
    setVb((v) => {
      const w = Math.min(vbW * 3, Math.max(vbW / 8, v.w * f));
      const h = Math.min(vbH * 3, Math.max(vbH / 8, v.h * f));
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  };

  // Non-passive wheel listener so pinch/scroll zoom never fights the page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vbW, vbH]);

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const kx = vb.w / r.width;
    const ky = vb.h / r.height;
    setVb((v) => ({
      ...v,
      x: (drag.current as { vx: number }).vx - (e.clientX - (drag.current as { sx: number }).sx) * kx,
      y: (drag.current as { vy: number }).vy - (e.clientY - (drag.current as { sy: number }).sy) * ky,
    }));
  };
  const up = () => { drag.current = null; };
  const reset = () => setVb({ x: 0, y: 0, w: vbW, h: vbH });

  const gid = React.useId().replace(/:/g, '');
  return (
    <div className={`relative ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-500">{title}</span>
          <button onClick={reset} className="text-[10px] font-mono text-blue-500 hover:underline">
            reset vue
          </button>
        </div>
      )}
      <svg
        ref={ref}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-grab active:cursor-grabbing"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      >
        <defs>
          <pattern id={`g-${gid}`} width={grid} height={grid} patternUnits="userSpaceOnUse">
            <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="currentColor" strokeWidth={0.4} className="text-slate-300 dark:text-white/10" />
          </pattern>
        </defs>
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#g-${gid})`} />
        {children}
      </svg>
      {scaleLabel && (
        <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-white/80 dark:bg-black/60 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
          {scaleLabel} · molette = zoom, glisser = pan
        </div>
      )}
    </div>
  );
};
