import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { CisaiRectInputs, CisaiRectOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: CisaiRectInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bw: 250, h: 500, d: 440, rho_l: 0.8,
  v_ed: [100, 200, 300, 250, 150],
  m_ed: [0, 150, 250, 200, 0],
  n_ed: 0,
  x_positions: [0, 2000, 4000, 6000, 8000],
  l_span: 8000, support_width: 250,
};

export default function Module139() {
  const [inp, setInp] = useState<CisaiRectInputs>(DEFAULT);
  const [res, setRes] = useState<CisaiRectOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof CisaiRectInputs) => (v: number | number[]) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<CisaiRectOutput>('calculate_cisai_rect_139', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">139 Cisaillement Rect <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Vérification cisaillement — EC2 §6.2</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutre</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={100} max={1000} step={10} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={1500} step={10} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={1400} step={5} />
          <NumField label="ρl" unit="%" value={inp.rho_l} onChange={S('rho_l')} min={0.1} max={5} step={0.1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="L travée" unit="mm" value={inp.l_span} onChange={S('l_span')} min={1000} max={20000} step={500} />
          <NumField label="t appui" unit="mm" value={inp.support_width} onChange={S('support_width')} min={100} max={1000} step={10} />
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={0} max={10000} step={10} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>VRd,c = <b>{res.v_rdc.toFixed(1)}</b> kN | VRd,max = <b>{res.v_rdc_max.toFixed(1)}</b> kN</div>
              <div>k = <b>{res.k_factor.toFixed(2)}</b> | β = <b>{res.beta_factor.toFixed(2)}</b></div>
              <div>σcd = <b>{res.sigma_cd.toFixed(1)}</b> MPa</div>
              <div>VEd,Max = <b>{res.v_ed_max.toFixed(1)}</b> kN</div>
              <div>Espace étriers = <b>{res.stirrup_spacing.toFixed(0)}</b> mm | α_sw,min = <b>{res.a_sw_min.toFixed(1)}</b> mm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Enveloppe de cisaillement</h2>
          <svg viewBox="0 0 400 150" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 340, h = 110;
              const maxV = Math.max(...res.v_envelope, res.v_rdc, 1);
              const sc = h / maxV;

              return (
                <g>
                  <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />

                  {res.v_envelope.map((v, i) => {
                    if (i === 0) return null;
                    const x1 = ox + (res.v_envelope_x[i - 1] / res.v_envelope_x[res.v_envelope_x.length - 1]) * w;
                    const y1 = oy + h - res.v_envelope[i - 1] * sc;
                    const x2 = ox + (res.v_envelope_x[i] / res.v_envelope_x[res.v_envelope_x.length - 1]) * w;
                    const y2 = oy + h - v * sc;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2563eb" strokeWidth={1.5} />;
                  })}

                  <line
                    x1={ox} y1={oy + h - res.v_rdc * sc}
                    x2={ox + w} y2={oy + h - res.v_rdc * sc}
                    stroke="#22c55e" strokeWidth={1} strokeDasharray="4,2"
                  />
                  <text x={ox + w + 4} y={oy + h - res.v_rdc * sc + 3} fontSize={5} fill="#22c55e">VRd,c</text>

                  <line
                    x1={ox} y1={oy + h - res.v_rdc_max * sc}
                    x2={ox + w} y2={oy + h - res.v_rdc_max * sc}
                    stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2"
                  />
                  <text x={ox + w + 4} y={oy + h - res.v_rdc_max * sc + 3} fontSize={5} fill="#ef4444">VRd,max</text>

                  <text x={ox + w / 2} y={oy + h + 14} textAnchor="middle" fontSize={5} fill="#64748b">
                    VEd,Max={res.v_ed_max.toFixed(0)}kN | VRd,c={res.v_rdc.toFixed(0)}kN
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <div className="space-y-2">
            {res.diag.map((d, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} VEd/VRd,c = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_v_max <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v_max <= 1.0 ? '✓' : '✗'} VEd/VRd,max = {(res.ratio_v_max * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• k = {res.k_factor.toFixed(2)}</li>
              <li className="text-slate-500">• β = {res.beta_factor.toFixed(2)}</li>
              <li className="text-slate-500">• σcd = {res.sigma_cd.toFixed(1)} MPa</li>
              <li className="text-slate-500">• ρl,min = {res.rho_min.toFixed(3)}%</li>
              <li className="text-slate-500">• Espacement étriers = {res.stirrup_spacing.toFixed(0)} mm</li>
              <li className="text-slate-500">• α_sw,min = {res.a_sw_min.toFixed(1)} mm²</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
