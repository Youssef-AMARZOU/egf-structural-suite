import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { CorbeauInputs, CorbeauOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: CorbeauInputs = {
  phi: 16, phi_t: 8, fctd: 1.8, fyd: 435,
  bar_type: 0, s: 150, c_nom: 30, welded: 0, ga: 800,
};

export default function Module113() {
  const [inp, setInp] = useState<CorbeauInputs>(DEFAULT);
  const [res, setRes] = useState<CorbeauOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof CorbeauInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<CorbeauOutput>('calculate_corbeau_113', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">113 Corbeau <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
          <p className="text-[11px] text-slate-500">Ancrage corbeau — EC2</p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Barreau</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
          <NumField label="φt" unit="mm" value={inp.phi_t} onChange={S('phi_t')} min={4} max={16} step={1} />
          <NumField label="s" unit="mm" value={inp.s} onChange={S('s')} min={50} max={500} step={10} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fctd" unit="MPa" value={inp.fctd} onChange={S('fctd')} min={0.5} max={5} step={0.1} />
          <NumField label="fyd" unit="MPa" value={inp.fyd} onChange={S('fyd')} min={200} max={500} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Config</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Type</label>
            <select value={inp.bar_type} onChange={(e) => setInp((p) => ({ ...p, bar_type: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Droit</option><option value={1}>Coudé</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Soudé</label>
            <select value={inp.welded} onChange={(e) => setInp((p) => ({ ...p, welded: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Non</option><option value={1}>Oui</option>
            </select>
          </div>
          <NumField label="cnom" unit="mm" value={inp.c_nom} onChange={S('c_nom')} min={10} max={100} step={5} />
        </div>
        <NumField label="GA" unit="mm" value={inp.ga} onChange={S('ga')} min={200} max={3000} step={50} />
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats ancrage</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,d0 = <b>{res.lb_d0.toFixed(0)}</b> mm</div>
              <div>α₁={res.alpha1} α₂={res.alpha2.toFixed(2)} α₃={res.alpha3} α₄={res.alpha4}</div>
              <div>Lb,d = <b>{res.lb_d.toFixed(0)}</b> mm</div>
              <div>Lbar = <b>{res.bar_length.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.lb_d <= res.bar_length ? 'text-green-600' : 'text-red-600'}>
              {res.lb_d <= res.bar_length
                ? `✓ Ancrage: ${res.lb_d.toFixed(0)}mm ≤ ${res.bar_length.toFixed(0)}mm`
                : `✗ Ancrage: ${res.lb_d.toFixed(0)}mm > ${res.bar_length.toFixed(0)}mm`}
            </li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
