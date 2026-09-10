import React from 'react';

interface ParamSliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

/** Two-way control: slider + stepper buttons + synced numeric readout. */
export const ParamSlider: React.FC<ParamSliderProps> = ({
  label, unit, value, min, max, step = 1, onChange,
}) => {
  const shown = clamp(value, min, max);
  const set = (v: number) => onChange(clamp(Math.round(v / step) * step, min, max));
  return (
    <div className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase text-slate-500">
          {label} <span className="text-slate-400">({unit})</span>
        </span>
        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
          {shown}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => set(shown - step)}
          className="shrink-0 w-6 h-6 rounded-md border border-slate-300 dark:border-white/15 text-sm leading-none hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          value={shown}
          min={min}
          max={max}
          step={step}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full accent-blue-600"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => set(shown + step)}
          className="shrink-0 w-6 h-6 rounded-md border border-slate-300 dark:border-white/15 text-sm leading-none hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label={`increase ${label}`}
        >
          +
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
          className="w-20 shrink-0 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1.5 py-1 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  );
};
