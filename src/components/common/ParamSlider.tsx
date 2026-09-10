import React, { useEffect, useRef, useState } from 'react';

interface ParamSliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  accent?: string;
  /** Hide the −/+ steppers (slider + field only). Default true. */
  steppers?: boolean;
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
  label, unit, value, min, max, step = 1, onChange, accent, steppers = true,
}) => {
  const dec = decimalsOf(step);
  const shown = Number(clamp(value, min, max).toFixed(dec));
  const set = (v: number) => {
    if (!Number.isFinite(v)) return;
    onChange(clamp(Number((Math.round(v / step) * step).toFixed(dec)), min, max));
  };
  const pct = max > min ? ((shown - min) / (max - min)) * 100 : 0;
  const atMin = shown <= min;
  const atMax = shown >= max;
  // Free-typing draft: the field never reformats mid-keystroke; commit on blur/Enter.
  const [draft, setDraft] = useState<string | null>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(null);
  }, [shown]);
  const commit = () => {
    if (draft === null) return;
    if (draft.trim() === '') { setDraft(null); return; }
    const v = Number(draft.replace(/\s/g, '').replace(',', '.'));
    setDraft(null);
    // Typed values are accepted exactly — bounds belong to the calculation, not the keyboard.
    if (Number.isFinite(v)) onChange(v);
  };
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
          {steppers && (
          <button
            type="button"
            onClick={() => set(value - step)}
            disabled={atMin}
            className="shrink-0 w-7 h-7 rounded-md border border-slate-300 dark:border-white/15 text-base leading-none hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
            aria-label={`Diminuer ${label}`}
            title={atMin ? `Minimum standard : ${min} ${unit}` : `Diminuer ${label}`}
          >
            −
          </button>
          )}
          <input
            type="text"
            inputMode="decimal"
            value={draft ?? (Number.isFinite(value) ? String(value) : '')}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => { focused.current = true; }}
            onBlur={() => { focused.current = false; commit(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); }
            }}
            className="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1.5 py-1 text-[13px] font-mono text-right focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label={`${label}, valeur exacte`}
          />
          {steppers && (
          <button
            type="button"
            onClick={() => set(value + step)}
            disabled={atMax}
            className="shrink-0 w-7 h-7 rounded-md border border-slate-300 dark:border-white/15 text-base leading-none hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
            aria-label={`Augmenter ${label}`}
            title={atMax ? `Maximum standard : ${max} ${unit}` : `Augmenter ${label}`}
          >
            +
          </button>
          )}
        </div>
        <div
          className="text-[10px] font-mono text-slate-500 dark:text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis"
          title={`Plage standard : ${min} – ${max} ${unit}`}
        >
          {min}–{max} {unit}
        </div>
      </div>
    </div>
  );
};
