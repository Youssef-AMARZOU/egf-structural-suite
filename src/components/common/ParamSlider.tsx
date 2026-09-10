import React from 'react';

interface ParamSliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  accent?: string;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

const decimalsOf = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/** Single-affordance control: label + unit → slider → stepper input. */
export const ParamSlider: React.FC<ParamSliderProps> = ({
  label, unit, value, min, max, step = 1, onChange, accent,
}) => {
  const dec = decimalsOf(step);
  const shown = Number(clamp(value, min, max).toFixed(dec));
  const set = (v: number) => {
    if (!Number.isFinite(v)) return;
    onChange(clamp(Number((Math.round(v / step) * step).toFixed(dec)), min, max));
  };
  const pct = max > min ? ((shown - min) / (max - min)) * 100 : 0;
  const acc = accent ?? 'var(--ws-acc, #4C8DFF)';
  return (
    <div className="block min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-slate-600 dark:text-slate-300 truncate">{label}</span>
        <span className="shrink-0 text-[10px] font-mono px-1.5 py-px rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
          {unit}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        <input
          type="range"
          value={clamp(value, min, max)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => set(Number(e.target.value))}
          className="param-range block w-full"
          style={{ background: `linear-gradient(90deg, ${acc} ${pct}%, rgba(148,163,184,0.25) ${pct}%)` }}
          aria-label={label}
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => set(value - step)}
            className="shrink-0 w-7 h-7 rounded-md border border-slate-300 dark:border-white/15 text-base leading-none hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition"
            aria-label={`Diminuer ${label}`}
          >
            −
          </button>
          <input
            type="number"
            value={shown}
            min={min}
            max={max}
            step={step}
            onChange={(e) => set(Number(e.target.value))}
            className="min-w-[56px] flex-1 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1.5 py-1 text-[13px] font-mono text-right focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label={`${label}, valeur exacte`}
          />
          <button
            type="button"
            onClick={() => set(value + step)}
            className="shrink-0 w-7 h-7 rounded-md border border-slate-300 dark:border-white/15 text-base leading-none hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition"
            aria-label={`Augmenter ${label}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
