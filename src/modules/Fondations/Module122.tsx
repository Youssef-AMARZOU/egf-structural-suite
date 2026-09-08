import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Sem2PieuxInputs, Sem2PieuxOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: Sem2PieuxInputs = {
  d1: 1.0, d2: 1.0, b_col: 0.4, gd: 0.5, deb: 0.2,
  ned: 3.0, med0: 0.5, hed: 0.1, d_eff: 0.5,
  go: 1.35, gg: 0.025, bp: 0.4, gb_pc: 1.5,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, cnom: 50, phi: 16,
};

export default function Module122() {
  const [inp, setInp] = useState<Sem2PieuxInputs>(DEFAULT);
  const [res, setRes] = useState<Sem2PieuxOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof Sem2PieuxInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<Sem2PieuxOutput>('calculate_sem2_pieux_122', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">122 Sem2 Pieux <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="d₁" unit="m" value={inp.d1} onChange={S('d1')} min={0.2} max={5} step={0.1} />
          <NumField label="d₂" unit="m" value={inp.d2} onChange={S('d2')} min={0.2} max={5} step={0.1} />
          <NumField label="b_col" unit="m" value={inp.b_col} onChange={S('b_col')} min={0.1} max={3} step={0.05} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="GD" unit="m" value={inp.gd} onChange={S('gd')} min={0.1} max={2} step={0.05} />
          <NumField label="déb" unit="m" value={inp.deb} onChange={S('deb')} min={0.05} max={1} step={0.05} />
          <NumField label="d" unit="m" value={inp.d_eff} onChange={S('d_eff')} min={0.1} max={3} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="MN" value={inp.ned} onChange={S('ned')} min={0.1} max={50} step={0.5} />
          <NumField label="MEd₀" unit="MNm" value={inp.med0} onChange={S('med0')} min={0} max={20} step={0.25} />
          <NumField label="HEd" unit="MN" value={inp.hed} onChange={S('hed')} min={0} max={5} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Semelle</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="GB" unit="m" value={inp.gb_pc} onChange={S('gb_pc')} min={0.5} max={5} step={0.1} />
          <NumField label="bp" unit="m" value={inp.bp} onChange={S('bp')} min={0.1} max={3} step={0.05} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>Med = <b>{res.med.toFixed(3)}</b> MNm</div>
              <div>p₁ = <b>{res.p1.toFixed(3)}</b> MPa | p₂ = <b>{res.p2.toFixed(3)}</b> MPa</div>
              <div>R_gauche = <b>{res.r_left.toFixed(3)}</b> MN | R_droit = <b>{res.r_right.toFixed(3)}</b> MN</div>
              <div>M_max = <b>{res.m_max.toFixed(3)}</b> MNm</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div>Asw = <b>{(res.asw_req * 10000).toFixed(1)}</b> cm²/m</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ Semelle sur pieux calculée</li>
            <li className="text-slate-500">• cotθ = {res.cot_theta.toFixed(2)}</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
