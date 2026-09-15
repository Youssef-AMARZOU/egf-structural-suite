import { useState } from 'react';
import type { RotplastAbaqueInputs, RotplastAbaqueOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: RotplastAbaqueInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15, ecm: 33000, fctm: 2.9,
  b: 300, h: 600, bw: 200, hf: 0, d: 540, dp: 60,
  aci: 6.28, acs: 6.28, m_ed: 150, n_ed: 0,
  l_eff: 6.0, es: 200000, euk: 10.0, kacier: 1.15,
  beta: 0.4, ksc: 1.0,
};


export default function Module127() {
  const [inp, setInp] = useState<RotplastAbaqueInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<RotplastAbaqueInputs, RotplastAbaqueOutput>(
    'calculate_rotplast_abaque_127', inp,
  );
  const S = (k: keyof RotplastAbaqueInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof RotplastAbaqueInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="127 Rotplast Abaque"
      subtitle="Rotation plastique — courbure Walraven"
      eurocode="EC2 §5.6"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b', 'b', 'mm', 100, 2000, 10)}
          {slider('h', 'h', 'mm', 100, 2000, 10)}
          {slider('bw', 'bw', 'mm', 100, 1000, 10)}
          {slider('hf', 'hf', 'mm', 0, 500, 10)}
          {slider('d', 'd', 'mm', 50, 2000, 5)}
          {slider('dp', 'dp', 'mm', 20, 200, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Aciers</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('aci', 'Aci', 'cm²', 0, 50, 0.5)}
          {slider('acs', 'Acs', 'cm²', 0, 50, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('ecm', 'Ecm', 'MPa', 10000, 50000, 500)}
          {slider('fctm', 'fctm', 'MPa', 1, 10, 0.1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('m_ed', 'MEd', 'kN·m', 0, 2000, 5)}
          {slider('n_ed', 'NEd', 'kN', -2000, 2000, 10)}
          {slider('l_eff', 'Leff', 'm', 1, 20, 0.5)}
          {slider('beta', 'β', '-', 0, 1, 0.05)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Diagramme Moment-Courbure" vbW={300} vbH={160}>
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
          </SectionCanvas>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
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
              <FormulaCard
                title="Rotation plastique (EC2 §5.6)"
                latex={String.raw`\theta_{Ed} \le \theta_{pl,d}`}
                description="Capacité de rotation, abaques Walraven"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`\theta_{Ed}`, meaning: 'Rotation exigée', value: res.m_cr.toFixed(1) },
                    { symbol: String.raw`\theta_{pl,d}`, meaning: 'Rotation admissible', value: res.k_factor.toFixed(2) },
                ]}
              />
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
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
