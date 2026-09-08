import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { NavierInputs, NavierOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: NavierInputs = {
  h: 200, e: 30000, nu: 0.2,
  la: 6.0, lb: 5.0,
  q: 5.0, a1: 1.0, a2: 3.0, b1: 1.0, b2: 4.0,
  x: 3.0, y: 2.5, n_terms: 20,
};

export default function Module108() {
  const [inp, setInp] = useState<NavierInputs>(DEFAULT);
  const [res, setRes] = useState<NavierOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof NavierInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<NavierOutput>('calculate_navier_108', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">108 Navier <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
          <p className="text-[11px] text-slate-500">Série de Navier — dalle rectangulaire</p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={80} max={800} step={10} />
          <NumField label="E" unit="MPa" value={inp.e} onChange={S('e')} min={5000} max={50000} step={1000} />
          <NumField label="ν" unit="-" value={inp.nu} onChange={S('nu')} min={0} max={0.5} step={0.01} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="LA" unit="m" value={inp.la} onChange={S('la')} min={1} max={30} step={0.5} />
          <NumField label="LB" unit="m" value={inp.lb} onChange={S('lb')} min={1} max={30} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charge</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="q" unit="kPa" value={inp.q} onChange={S('q')} min={0} max={100} step={0.5} />
          <NumField label="A1" unit="m" value={inp.a1} onChange={S('a1')} min={0} max={30} step={0.1} />
          <NumField label="A2" unit="m" value={inp.a2} onChange={S('a2')} min={0} max={30} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="B1" unit="m" value={inp.b1} onChange={S('b1')} min={0} max={30} step={0.1} />
          <NumField label="B2" unit="m" value={inp.b2} onChange={S('b2')} min={0} max={30} step={0.1} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Point d'éval</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="X" unit="m" value={inp.x} onChange={S('x')} min={0} max={30} step={0.1} />
          <NumField label="Y" unit="m" value={inp.y} onChange={S('y')} min={0} max={30} step={0.1} />
          <NumField label="Termes" unit="-" value={inp.n_terms} onChange={S('n_terms')} min={5} max={50} step={1} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>Mx = <b>{res.mx.toFixed(2)}</b> kNm/m</div>
              <div>My = <b>{res.my.toFixed(2)}</b> kNm/m</div>
              <div>Mxy = <b>{res.mxy.toFixed(2)}</b> kNm/m</div>
              <div>w = <b>{res.w.toFixed(2)}</b> mm</div>
              <div>D = <b>{res.d_rig.toFixed(1)}</b> kNm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan (live SVG)</h2>
          <svg viewBox="0 0 300 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 30; const ox = 30, oy = 25;
              const la = inp.la * sc, lb = inp.lb * sc;
              const a1 = inp.a1 * sc, a2 = inp.a2 * sc, b1 = inp.b1 * sc, b2 = inp.b2 * sc;
              return (
                <g>
                  <rect x={ox} y={oy} width={la} height={lb} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
                  <rect x={ox + a1} y={oy + b1} width={a2 - a1} height={b2 - b1} fill="#dc2626" opacity={0.3} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 2" />
                  <circle cx={ox + inp.x * sc} cy={oy + inp.y * sc} r={4} fill="#2563eb" stroke="#fff" strokeWidth={1.5} />
                  <text x={ox + la / 2} y={oy - 5} textAnchor="middle" fontSize={8} fill="#64748b">LA={inp.la}m</text>
                  <text x={ox - 5} y={oy + lb / 2} textAnchor="middle" fontSize={8} fill="#64748b" transform={`rotate(-90 ${ox - 5} ${oy + lb / 2})`}>LB={inp.lb}m</text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.w < inp.h / 1000.0 * 500 ? 'text-green-600' : 'text-red-600'}>
              {res.w < inp.h / 1000.0 * 500 ? '✓ Flèche acceptable' : '✗ Flèche excessive'}
            </li>
            <li className="text-slate-500">• M_max = {res.m_max.toFixed(2)} kNm/m</li>
            <li className="text-slate-500">• D = {res.d_rig.toFixed(1)} kNm</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
