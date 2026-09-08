import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ExcentrPieuInputs, ExcentrPieuOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: ExcentrPieuInputs = {
  alp1: 1.0, alp2: 1.0, b1: 0.3, b2: 0.3, dp1: 0.45, dp2: 0.45,
  e1: 30000, l1: 6, l2: 6, k3: 100, bei: 50, m0: 0.5,
  fcd: 20, fyd: 435, ned: 5.0, etol: 0.001,
};

export default function Module115() {
  const [inp, setInp] = useState<ExcentrPieuInputs>(DEFAULT);
  const [res, setRes] = useState<ExcentrPieuOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof ExcentrPieuInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<ExcentrPieuOutput>('calculate_excentr_pieu_115', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">115 Excentr. Pieu <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutres</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="α₁" unit="-" value={inp.alp1} onChange={S('alp1')} min={0.5} max={2} step={0.1} />
          <NumField label="α₂" unit="-" value={inp.alp2} onChange={S('alp2')} min={0.5} max={2} step={0.1} />
          <NumField label="E₁" unit="GPa" value={inp.e1} onChange={S('e1')} min={10000} max={50000} step={1000} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="b₁" unit="m" value={inp.b1} onChange={S('b1')} min={0.1} max={2} step={0.05} />
          <NumField label="b₂" unit="m" value={inp.b2} onChange={S('b2')} min={0.1} max={2} step={0.05} />
          <NumField label="L₁" unit="m" value={inp.l1} onChange={S('l1')} min={1} max={20} step={0.5} />
          <NumField label="L₂" unit="m" value={inp.l2} onChange={S('l2')} min={1} max={20} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="M₀" unit="MNm" value={inp.m0} onChange={S('m0')} min={0} max={50} step={0.25} />
          <NumField label="NEd" unit="MN" value={inp.ned} onChange={S('ned')} min={0.1} max={100} step={0.5} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>h = <b>{(res.h * 1000).toFixed(0)}</b> mm</div>
              <div>C₁ = <b>{res.c1.toFixed(3)}</b> MNm | C₂ = <b>{res.c2.toFixed(3)}</b> MNm</div>
              <div>C₃ = <b>{res.c3.toFixed(3)}</b> MNm | C_pieu = <b>{res.c_pieu.toFixed(3)}</b> MNm</div>
              <div>As₁ = <b>{res.ac1.toFixed(1)}</b> cm² | As₂ = <b>{res.ac2.toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ h = {(res.h * 1000).toFixed(0)}mm</li>
            <li className="text-slate-500">• K₁={res.k1.toFixed(1)} K₂={res.k2.toFixed(1)} MNm/rad</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
