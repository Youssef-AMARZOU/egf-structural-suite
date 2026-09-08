import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BaelFaesselInputs, BaelFaesselOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: BaelFaesselInputs = {
  h: 500, bh: 1.0, fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  rho: 1.0, delta: 0.1, lam: 30, lel: 3000, ec1: 2.0,
  eh01: 3.5, eh02: 0.0, eb1: -3.5, eb2: 0.0, llim: 6000, eim: 20,
};

export default function Module109() {
  const [inp, setInp] = useState<BaelFaesselInputs>(DEFAULT);
  const [res, setRes] = useState<BaelFaesselOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof BaelFaesselInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<BaelFaesselOutput>('calculate_bael_faessel_109', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">109 Bâton BAEL <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Interaction N-M — BAEL B.8.4.1 + Faessel</p>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={50} />
          <NumField label="bh" unit="-" value={inp.bh} onChange={S('bh')} min={0.3} max={3} step={0.1} />
          <NumField label="δ" unit="-" value={inp.delta} onChange={S('delta')} min={0.05} max={0.5} step={0.01} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="ρ" unit="%" value={inp.rho} onChange={S('rho')} min={0.1} max={10} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={1.5} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Flambement</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="λ" unit="-" value={inp.lam} onChange={S('lam')} min={5} max={100} step={1} />
          <NumField label="Lel" unit="mm" value={inp.lel} onChange={S('lel')} min={500} max={15000} step={100} />
          <NumField label="Llim" unit="mm" value={inp.llim} onChange={S('llim')} min={1000} max={20000} step={100} />
          <NumField label="eim" unit="mm" value={inp.eim} onChange={S('eim')} min={0} max={200} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Recherche</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="εc1" unit="‰" value={inp.ec1} onChange={S('ec1')} min={1} max={4} step={0.1} />
          <NumField label="eh0₁" unit="‰" value={inp.eh01} onChange={S('eh01')} min={0} max={5} step={0.1} />
          <NumField label="eh0₂" unit="‰" value={inp.eh02} onChange={S('eh02')} min={-5} max={0} step={0.1} />
          <NumField label="eb₁" unit="‰" value={inp.eb1} onChange={S('eb1')} min={-5} max={0} step={0.1} />
          <NumField label="eb₂" unit="‰" value={inp.eb2} onChange={S('eb2')} min={0} max={5} step={0.1} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>NR = <b>{res.nr.toFixed(1)}</b> kN</div>
              <div>MR = <b>{res.mr.toFixed(1)}</b> kN·m</div>
              <div>NC = <b>{res.nc.toFixed(1)}</b> kN</div>
              <div>eh = <b>{res.eh_opt.toFixed(2)}</b> ‰ | eb = <b>{res.eb_opt.toFixed(2)}</b> ‰</div>
              <div>e₁ = <b>{res.e1.toFixed(1)}</b> mm | e₂ = <b>{res.e2.toFixed(1)}</b> mm</div>
              <div>σs₁ = <b>{res.sigma_s1.toFixed(0)}</b> MPa | σs₂ = <b>{res.sigma_s2.toFixed(0)}</b> MPa</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>NBaels = <b>{res.n_baels.toFixed(1)}</b> kN</div>
              <div>α (flambement) = <b>{res.alpha.toFixed(3)}</b></div>
              <div>Δe = <b>{res.de.toFixed(3)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section (SVG)</h2>
          <svg viewBox="0 0 200 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 0.3; const ox = 100, oy = 40;
              const w = inp.bh * inp.h * sc, hh = inp.h * sc;
              const d1 = inp.delta * hh;
              return (
                <g>
                  <rect x={ox - w / 2} y={oy} width={w} height={hh} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} rx={2} />
                  <rect x={ox - w / 2 + 5} y={oy + 5} width={10} height={10} fill="#2563eb" rx={1} />
                  <rect x={ox + w / 2 - 15} y={oy + hh - 15} width={10} height={10} fill="#2563eb" rx={1} />
                  <text x={ox - w / 2 - 5} y={oy + hh / 2} textAnchor="end" fontSize={7} fill="#64748b">h={inp.h}</text>
                  <text x={ox} y={oy + hh + 12} textAnchor="middle" fontSize={7} fill="#64748b">B={(inp.bh * inp.h).toFixed(0)}</text>
                  {res && (
                    <>
                      <text x={ox} y={oy + hh + 25} textAnchor="middle" fontSize={8} fill="#2563eb" fontWeight="bold">
                        NR={res.nr.toFixed(0)}kN
                      </text>
                      <text x={ox} y={oy + hh + 35} textAnchor="middle" fontSize={8} fill="#059669">
                        NBaels={res.n_baels.toFixed(0)}kN
                      </text>
                    </>
                  )}
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
            <li className={res.nr > 0 ? 'text-green-600' : 'text-red-600'}>
              {res.nr > 0 ? `✓ NR = ${res.nr.toFixed(1)} kN` : '✗ Pas de solution'}
            </li>
            <li className={inp.lam < 70 ? 'text-green-600' : 'text-red-600'}>
              {inp.lam < 70 ? `✓ λ = ${inp.lam} < 70` : `✗ λ = ${inp.lam} > 70 — BAEL interdit`}
            </li>
            <li className="text-slate-500">• ρ = {inp.rho}% | α = {res.alpha.toFixed(3)}</li>
            <li className="text-slate-500">• e₁ = {res.e1.toFixed(1)}mm | e₂ = {res.e2.toFixed(1)}mm</li>
            <li className="text-slate-500">• σs₁ = {res.sigma_s1.toFixed(0)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
