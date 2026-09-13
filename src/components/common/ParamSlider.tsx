import React, { useEffect, useRef, useState } from 'react';
import { MathBlock } from './MathBlock';

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
  /** KaTeX symbol shown next to the name (e.g. "h", "\\varphi"). */
  symbol?: string;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

const decimalsOf = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

/**
 * Precision control: name + symbol + live value / slider with ticks /
 * steppers + interval caption. Double-click the value for raw entry.
 */
export const ParamSlider: React.FC<ParamSliderProps> = ({
  label, unit, value, min, max, step = 1, onChange, accent, steppers = true, symbol,
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
  const tickCount = max > min && step > 0
    ? Math.min(11, Math.max(2, Math.round((max - min) / step)))
    : 0;
  // Free-typing draft: never reformats mid-keystroke; commit on blur/Enter.
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(null);
  }, [shown]);
  const commit = () => {
    setEditing(false);
    if (draft === null) return;
    if (draft.trim() === '') { setDraft(null); return; }
    const v = Number(draft.replace(/\s/g, '').replace(',', '.'));
    setDraft(null);
    // Typed values are accepted exactly — bounds belong to the calculation, not the keyboard.
    if (Number.isFinite(v)) onChange(v);
  };
  const acc = accent ?? 'var(--ws-acc, #4C8DFF)';
  const display = Number.isFinite(value) ? String(value) : '';
  return (
    <div className="block min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-slate-600 dark:text-slate-300 truncate">
          {label}
          {symbol && (
            <span className="ml-1.5 text-slate-400">
              <MathBlock math={symbol} />
            </span>
          )}
        </span>
        <span className="shrink-0 text-[12px] font-mono tabular-nums text-slate-800 dark:text-slate-100">
          {editing ? (
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={draft ?? display}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => { focused.current = true; }}
              onBlur={() => { focused.current = false; commit(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setDraft(null); setEditing(false); (e.target as HTMLInputElement).blur(); }
              }}
              className="w-24 rounded border border-sky-400 bg-white dark:bg-white/10 px-1 py-px text-right outline-none"
              aria-label={`${label}, valeur exacte`}
            />
          ) : (
            <span
              onDoubleClick={() => { setDraft(display); setEditing(true); }}
              title="Double-clic pour saisir"
              className="cursor-text"
            >
              {display} <span className="text-slate-500 text-[11px]">{unit}</span>
            </span>
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
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
        <div className="min-w-0 flex-1">
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
          {tickCount >= 2 && (
            <div className="flex justify-between px-[3px] mt-[3px]" aria-hidden>
              {Array.from({ length: tickCount }).map((_, i) => (
                <span key={i} className="block w-px h-[5px] bg-slate-400/40" />
              ))}
            </div>
          )}
        </div>
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
        className="mt-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis"
        title={`Plage standard : ${min} – ${max} ${unit}`}
      >
        {min}–{max} {unit}
      </div>
    </div>
  );
};
