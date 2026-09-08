import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { VouteDechargeInputs, VouteDechargeOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: VouteDechargeInputs = {
  p: 500, l: 10, leff: 9.6, a: 0.3, b: 0.4, d: 0.35, h: 0.45,
  mu: 0.4, c: 0.1, fctd: 1.8, fcd: 20, fck: 30, fyd: 435,
  gg: 0.025, rhoa: 1800, l5: 2.0, sbl: 10, p3: 0,
};

export default function Module117() {
  const [inp, setInp] = useState<VouteDechargeInputs>(DEFAULT);
  const [res, setRes] = useState<VouteDechargeOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof VouteDechargeInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<VouteDechargeOutput>('calculate_voute_decharge_117', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">117 Voûte Décharge <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="P" unit="kN" value={inp.p} onChange={S('p')} min={10} max={5000} step={50} />
          <NumField label="L" unit="m" value={inp.l} onChange={S('l')} min={1} max={30} step={0.5} />
          <NumField label="Leff" unit="m" value={inp.leff} onChange={S('leff')} min={1} max={30} step={0.1} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="a" unit="m" value={inp.a} onChange={S('a')} min={0.05} max={2} step={0.05} />
          <NumField label="b" unit="m" value={inp.b} onChange={S('b')} min={0.1} max={2} step={0.05} />
          <NumField label="d" unit="m" value={inp.d} onChange={S('d')} min={0.1} max={2} step={0.05} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="h" unit="m" value={inp.h} onChange={S('h')} min={0.1} max={2} step={0.05} />
          <NumField label="sbl" unit="MPa" value={inp.sbl} onChange={S('sbl')} min={1} max={30} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyd" unit="MPa" value={inp.fyd} onChange={S('fyd')} min={200} max={500} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Remblai</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="ρa" unit="kg/m³" value={inp.rhoa} onChange={S('rhoa')} min={1000} max={2500} step={50} />
          <NumField label="L5" unit="m" value={inp.l5} onChange={S('l5')} min={0} max={10} step={0.25} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>L₂ = <b>{res.l2.toFixed(2)}</b> m | α = <b>{res.arch_angle_deg.toFixed(1)}</b>°</div>
              <div>cotα = <b>{res.cot_alpha.toFixed(2)}</b></div>
              <div>T = <b>{res.thrust.toFixed(1)}</b> kN</div>
              <div>Ast = <b>{res.ast_req.toFixed(1)}</b> cm²</div>
              <div>σ_n = <b>{res.s_n.toFixed(2)}</b> MPa | σ_b = <b>{res.s_b.toFixed(2)}</b> MPa</div>
              <div>VEd = <b>{res.v_ed.toFixed(3)}</b> MN | VRdmax = <b>{res.v_rdmax.toFixed(3)}</b> MN</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.v_ed < res.v_rdmax ? 'text-green-600' : 'text-red-600'}>
              {res.v_ed < res.v_rdmax ? '✓ Cisaillement OK' : '✗ Cisaillement dépassé'}
            </li>
            <li className="text-slate-500">• Poussée T = {res.thrust.toFixed(1)} kN</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
