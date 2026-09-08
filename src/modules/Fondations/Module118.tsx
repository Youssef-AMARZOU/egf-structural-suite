import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { TirantInputs, TirantOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: TirantInputs = {
  phi: 20, fctm: 2.9, gc: 1.5, ssd: 360, cnom: 30, phit: 8, esp: 150,
  fyk: 500, gs: 1.15, euk: 0.02, fck: 30, duration: 50, binder: 0,
};

export default function Module118() {
  const [inp, setInp] = useState<TirantInputs>(DEFAULT);
  const [res, setRes] = useState<TirantOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof TirantInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<TirantOutput>('calculate_tirant_118', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">118 Tirant <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Barreau</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
          <NumField label="φt" unit="mm" value={inp.phit} onChange={S('phit')} min={4} max={16} step={1} />
          <NumField label="esp" unit="mm" value={inp.esp} onChange={S('esp')} min={50} max={500} step={10} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fctm" unit="MPa" value={inp.fctm} onChange={S('fctm')} min={1} max={6} step={0.1} />
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="σsd" unit="MPa" value={inp.ssd} onChange={S('ssd')} min={100} max={500} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Environnement</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="cnom" unit="mm" value={inp.cnom} onChange={S('cnom')} min={10} max={100} step={5} />
          <NumField label="Durée" unit="ans" value={inp.duration} onChange={S('duration')} min={1} max={200} step={10} />
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Liant</label>
            <select value={inp.binder} onChange={(e) => setInp((p) => ({ ...p, binder: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Normal</option><option value={1}>Bas chaleur</option>
            </select>
          </div>
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats ancrage</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,rqd = <b>{res.lb_rqd.toFixed(0)}</b> mm</div>
              <div>L₀ = <b>{res.l0.toFixed(0)}</b> mm</div>
              <div>Exposition: <b>{res.exposure_class}</b> (idx={res.exposure_index})</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ L₀ = {res.l0.toFixed(0)}mm</li>
            <li className="text-slate-500">• Exposition: {res.exposure_class}</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
