import React from 'react';

interface TogglePillsProps<T extends string | number> {
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  accent?: string;
}

/** Compact single-choice pill group (cement class, rebar grade, mode). */
export function TogglePills<T extends string | number>({
  options, value, onChange, accent,
}: TogglePillsProps<T>) {
  const acc = accent ?? 'var(--ws-acc, #4C8DFF)';
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title ?? o.label}
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition active:scale-95 ${
              active
                ? 'text-white border-transparent'
                : 'border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:bg-slate-500/10'
            }`}
            style={active ? { background: acc } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
