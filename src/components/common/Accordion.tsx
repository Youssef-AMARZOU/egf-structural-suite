import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

/** Collapsible parameter group with chevron + live count. */
export const Accordion: React.FC<AccordionProps> = ({
  title, icon, defaultOpen = true, count, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-500/5 transition"
        aria-expanded={open}
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="flex-1 text-left uppercase tracking-wider text-[11px]">{title}</span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-slate-400">{count}</span>
        )}
        <span className={`text-[11px] text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-3">{children}</div>}
    </div>
  );
};
