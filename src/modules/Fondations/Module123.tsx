import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { OuverPoutInputs, OuverPoutOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: OuverPoutInputs = {
  ned: 0.5, b: 0.3, d: 0.5, fcd: 20, m1: 0.2, fyd: 435,
  mu0: 0.4, es0: 0.002175, k: 1.08, euk: 0.02, ecu: 0.0035,
  v_ed: 0.1, sigma_max: 5.0, q_angle: 45,
};

export default function Module123() {
  const [inp, setInp] = useState<OuverPoutInputs>(DEFAULT);
  const [res, setRes] = useState<OuverPoutOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof OuverPoutInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<OuverPoutOutput>('calculate_ouver_pout_123', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">123 Ouver. Poutre <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="b" unit="m" value={inp.b} onChange={S('b')} min={0.1} max={2} step={0.05} />
          <NumField label="d" unit="m" value={inp.d} onChange={S('d')} min={0.1} max={3} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="MN" value={inp.ned} onChange={S('ned')} min={0} max={50} step={0.1} />
          <NumField label="M₁" unit="MNm" value={inp.m1} onChange={S('m1')} min={0} max={20} step={0.05} />
          <NumField label="VEd" unit="MN" value={inp.v_ed} onChange={S('v_ed')} min={0} max={10} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fcd" unit="MPa" value={inp.fcd} onChange={S('fcd')} min={5} max={60} step={1} />
          <NumField label="fyd" unit="MPa" value={inp.fyd} onChange={S('fyd')} min={200} max={500} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Acier</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="μ₀" unit="-" value={inp.mu0} onChange={S('mu0')} min={0.1} max={0.5} step={0.01} />
          <NumField label="k" unit="-" value={inp.k} onChange={S('k')} min={1.0} max={1.15} step={0.01} />
          <NumField label="θ" unit="°" value={inp.q_angle} onChange={S('q_angle')} min={20} max={70} step={5} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>μ = <b>{res.mu.toFixed(3)}</b></div>
              <div>ξ = <b>{res.xi.toFixed(3)}</b> | x = <b>{res.x.toFixed(0)}</b> mm</div>
              <div>z = <b>{res.z.toFixed(0)}</b> mm</div>
              <div>εs = <b>{(res.eps_s * 1000).toFixed(2)}</b> ‰ | σs = <b>{res.sigma_s.toFixed(0)}</b> MPa</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div>Asw,diag = <b>{(res.asw_diag * 10000).toFixed(1)}</b> cm²</div>
              <div>αcw = <b>{res.alpha_cw.toFixed(2)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.mu < res.alpha_cw * 0.5 ? 'text-green-600' : 'text-red-600'}>
              {res.mu < res.alpha_cw * 0.5 ? '✓ Section sous-armée' : '✗ Section sur-armée'}
            </li>
            <li className="text-slate-500">• σs = {res.sigma_s.toFixed(0)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
