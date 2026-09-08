import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { RotplastAbaqueInputs, RotplastAbaqueOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: RotplastAbaqueInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15, ecm: 33000, fctm: 2.9,
  b: 300, h: 600, bw: 200, hf: 0, d: 540, dp: 60,
  aci: 6.28, acs: 6.28, m_ed: 150, n_ed: 0,
  l_eff: 6.0, es: 200000, euk: 10.0, kacier: 1.15,
  beta: 0.4, ksc: 1.0,
};

export default function Module127() {
  const [inp, setInp] = useState<RotplastAbaqueInputs>(DEFAULT);
  const [res, setRes] = useState<RotplastAbaqueOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof RotplastAbaqueInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<RotplastAbaqueOutput>('calculate_rotplast_abaque_127', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">127 Rotplast Abaque <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Rotation plastique — courbure Walraven</p>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={10} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
          <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={100} max={1000} step={10} />
          <NumField label="hf" unit="mm" value={inp.hf} onChange={S('hf')} min={0} max={500} step={10} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />
          <NumField label="dp" unit="mm" value={inp.dp} onChange={S('dp')} min={20} max={200} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Aciers</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Aci" unit="cm²" value={inp.aci} onChange={S('aci')} min={0} max={50} step={0.5} />
          <NumField label="Acs" unit="cm²" value={inp.acs} onChange={S('acs')} min={0} max={50} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="Ecm" unit="MPa" value={inp.ecm} onChange={S('ecm')} min={10000} max={50000} step={500} />
          <NumField label="fctm" unit="MPa" value={inp.fctm} onChange={S('fctm')} min={1} max={10} step={0.1} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="MEd" unit="kN·m" value={inp.m_ed} onChange={S('m_ed')} min={0} max={2000} step={5} />
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={-2000} max={2000} step={10} />
          <NumField label="Leff" unit="m" value={inp.l_eff} onChange={S('l_eff')} min={1} max={20} step={0.5} />
          <NumField label="β" unit="-" value={inp.beta} onChange={S('beta')} min={0} max={1} step={0.05} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>MCr = <b>{res.m_cr.toFixed(1)}</b> kN·m</div>
              <div>χyd = <b>{res.chi_yd.toExponential(2)}</b> 1/mm</div>
              <div>χud = <b>{res.chi_ud.toExponential(2)}</b> 1/mm</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>θel = <b>{(res.theta_el * 1000).toFixed(2)}</b> mrad</div>
              <div>θpl = <b>{(res.theta_pl * 1000).toFixed(2)}</b> mrad</div>
              <div>θtotal = <b>{(res.theta_total * 1000).toFixed(2)}</b> mrad</div>
              <div>k = <b>{res.k_factor.toFixed(2)}</b> | χud/χyd = <b>{res.curvature_ratio.toFixed(1)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme Moment-Courbure</h2>
          <svg viewBox="0 0 300 160" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (
              <g>
                <line x1={40} y1={140} x2={280} y2={140} stroke="#94a3b8" strokeWidth={0.5} />
                <line x1={40} y1={10} x2={40} y2={140} stroke="#94a3b8" strokeWidth={0.5} />
                <text x={160} y={155} textAnchor="middle" fontSize={7} fill="#64748b">χ (1/mm)</text>
                <text x={10} y={80} textAnchor="middle" fontSize={7} fill="#64748b" transform="rotate(-90,10,80)">M (kN·m)</text>
                {(() => {
                  const maxChi = res.chi_ud * 1.2;
                  const maxM = Math.max(inp.m_ed, res.m_cr) * 1.3;
                  const xScale = 230 / maxChi;
                  const yScale = 120 / maxM;
                  const x0 = 40, y0 = 140;
                  const pts = [
                    `${x0},${y0}`,
                    `${x0 + res.chi_yd * xScale},${y0 - res.m_cr * 0.7 * yScale}`,
                    `${x0 + res.chi_ud * 0.5 * xScale},${y0 - res.m_cr * yScale}`,
                    `${x0 + res.chi_ud * xScale},${y0 - inp.m_ed * yScale}`,
                  ].join(' ');
                  return (
                    <g>
                      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={1.5} />
                      <circle cx={x0 + res.chi_yd * xScale} cy={y0 - res.m_cr * 0.7 * yScale} r={3} fill="#f59e0b" />
                      <circle cx={x0 + res.chi_ud * xScale} cy={y0 - inp.m_ed * yScale} r={3} fill="#ef4444" />
                      <text x={x0 + res.chi_yd * xScale + 5} y={y0 - res.m_cr * 0.7 * yScale - 5} fontSize={6} fill="#f59e0b">χyd</text>
                      <text x={x0 + res.chi_ud * xScale + 5} y={y0 - inp.m_ed * yScale - 5} fontSize={6} fill="#ef4444">χud</text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.k_factor < 2.0 ? 'text-green-600' : 'text-red-600'}>
              {res.k_factor < 2.0 ? '✓' : '✗'} k = {res.k_factor.toFixed(2)} {res.k_factor < 2.0 ? '< 2.0' : '> 2.0'}
            </li>
            <li className={res.curvature_ratio < 5.0 ? 'text-green-600' : 'text-yellow-600'}>
              {res.curvature_ratio < 5.0 ? '✓' : '⚠'} χud/χyd = {res.curvature_ratio.toFixed(1)}
            </li>
            <li className="text-slate-500">• MCr = {res.m_cr.toFixed(1)} kN·m</li>
            <li className="text-slate-500">• θtotal = {(res.theta_total * 1000).toFixed(2)} mrad</li>
            <li className="text-slate-500">• Section: {inp.b}×{inp.h}mm</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
