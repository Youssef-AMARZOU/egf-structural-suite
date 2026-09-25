import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

/** Context: when true, all nested SectionCanvas switch to print-light mode */
export const PrintLightContext = createContext<boolean>(false);

interface SectionCanvasProps {
  title?: string;
  vbW?: number;
  vbH?: number;
  grid?: number;
  /** minor grid step (major = grid); 0 disables minor */
  gridMinor?: number;
  scaleLabel?: string;
  children: React.ReactNode;
  className?: string;
  /** Print mode: white background, dark ink, no controls */
  printLight?: boolean;
}

/** Engineering viewport: CAD grid, hover probe, zoom controls, pan. */
export const SectionCanvas: React.FC<SectionCanvasProps> = ({
  title, vbW = 600, vbH = 400, grid = 20, gridMinor = 5,
  scaleLabel, children, className = '', printLight: printLightProp,
}) => {
  const printLightCtx = useContext(PrintLightContext);
  const printLight = printLightProp ?? printLightCtx;
  const [vb, setVb] = useState({ x: 0, y: 0, w: vbW, h: vbH });
  const [probe, setProbe] = useState<[number, number] | null>(null);
  const [space, setSpace] = useState(false);
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
  const reset = () => setVb({ x: 0, y: 0, w: vbW, h: vbH });

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

  // Ctrl+0 resets zoom on every mounted canvas; track Space for pan cursor.
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        reset();
      }
      if (e.code === 'Space') setSpace(true);
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpace(false);
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vbW, vbH]);

  const toLocal = (e: React.PointerEvent): [number, number] => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return [0, 0];
    return [
      vb.x + ((e.clientX - r.left) / r.width) * vb.w,
      vb.y + ((e.clientY - r.top) / r.height) * vb.h,
    ];
  };

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
  };
  const move = (e: React.PointerEvent) => {
    setProbe(toLocal(e));
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

  const gid = React.useId().replace(/:/g, '');
  const bgColor = printLight ? '#ffffff' : '#0B1020';
  const gridMajorColor = printLight ? '#94a3b8' : 'currentColor';
  const gridMajorClass = printLight ? '' : 'text-white/35';
  const gridMinorColor = printLight ? '#cbd5e1' : 'currentColor';
  const gridMinorClass = printLight ? '' : 'text-white/15';

  return (
    <div className={`relative ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold ${printLight ? 'text-slate-700' : 'text-slate-600 dark:text-slate-300'}`}>{title}</span>
          {!printLight && probe && (
            <span className="hud-chip">
              x {probe[0].toFixed(1)} · y {probe[1].toFixed(1)}
            </span>
          )}
        </div>
      )}
      <svg
        ref={ref}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className={`w-full rounded-lg border ${printLight ? 'border-slate-300 bg-white' : 'bg-cadwell border-slate-200 dark:border-white/10'} ${printLight ? '' : `${space ? 'cursor-grab' : 'cursor-crosshair'} active:cursor-grabbing`}`}
        onPointerDown={printLight ? undefined : down}
        onPointerMove={printLight ? undefined : move}
        onPointerUp={printLight ? undefined : up}
        onPointerLeave={printLight ? undefined : () => { up(); setProbe(null); }}
      >
        <defs>
          <pattern id={`g-${gid}`} width={grid} height={grid} patternUnits="userSpaceOnUse">
            <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke={gridMajorColor} strokeWidth={printLight ? 0.8 : 1.0} className={gridMajorClass} />
          </pattern>
          {gridMinor > 0 && (
            <pattern id={`gm-${gid}`} width={gridMinor} height={gridMinor} patternUnits="userSpaceOnUse">
              <path d={`M ${gridMinor} 0 L 0 0 0 ${gridMinor}`} fill="none" stroke={gridMinorColor} strokeWidth={printLight ? 0.4 : 0.5} className={gridMinorClass} />
            </pattern>
          )}
        </defs>
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={bgColor} />
        {gridMinor > 0 && (
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#gm-${gid})`} />
        )}
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#g-${gid})`} />
        {children}
        {!printLight && probe && (
          <g opacity={0.55} pointerEvents="none">
            <line x1={vb.x} y1={probe[1]} x2={vb.x + vb.w} y2={probe[1]} stroke="#38BDF8" strokeWidth={0.6} strokeDasharray="3 3" />
            <line x1={probe[0]} y1={vb.y} x2={probe[0]} y2={vb.y + vb.h} stroke="#38BDF8" strokeWidth={0.6} strokeDasharray="3 3" />
          </g>
        )}
      </svg>
      {!printLight && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {[
            { label: '+', title: 'Zoom avant', fn: () => zoomBy(1 / 1.25) },
            { label: '−', title: 'Zoom arrière', fn: () => zoomBy(1.25) },
            { label: '⟲', title: 'Recentrer (Ctrl+0)', fn: reset },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.fn}
              title={b.title}
              aria-label={b.title}
              className="w-7 h-7 rounded-md text-[13px] font-bold bg-black/60 text-slate-200 border border-white/15 hover:bg-black/80 active:scale-95 transition"
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      {!printLight && scaleLabel && (
        <div className="absolute bottom-2 left-2 hud-chip">
          {scaleLabel}
        </div>
      )}
    </div>
  );
};
