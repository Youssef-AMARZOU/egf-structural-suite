export default function NumField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 0.01,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase text-slate-500">
        {label} <span className="text-slate-400">({unit})</span>
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </label>
  );
}
