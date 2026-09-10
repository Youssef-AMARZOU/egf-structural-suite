import { useState } from 'react';
import type { CisaiCircInputs, CisaiCircOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: CisaiCircInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  phi: 400, d: 340, rho_l: 0.5,
  n_bars: 8, d_bar: 20, cover: 40,
  v_ed: [100, 200, 300, 250, 150],
  m_ed: [0, 150, 250, 200, 0],
  n_ed: 0,
  x_positions: [0, 2000, 4000, 6000, 8000],
  l_span: 8000, support_width: 250,
};


export default function Module140() {
  const [inp, setInp] = useState<CisaiCircInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<CisaiCircInputs, CisaiCircOutput>(
    'calculate_cisai_circ_140', inp,
  );
  const S = (k: keyof CisaiCircInputs) => (v: number | number[]) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof CisaiCircInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="140 Cisaillement Circ"
      subtitle="Cisaillement section circulaire — EC2 §6.2"
      eurocode="EC2 §6.2"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('phi', 'φ', 'mm', 100, 2000, 10)}
          {slider('d', 'd', 'mm', 50, 1900, 5)}
          {slider('rho_l', 'ρl', '%', 0.1, 5, 0.1)}
          {slider('n_bars', 'Nb barres', '-', 4, 32, 1)}
          {slider('d_bar', 'φ barre', 'mm', 6, 50, 2)}
          {slider('cover', 'Couverture', 'mm', 15, 100, 5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie poutre</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('l_span', 'L travée', 'mm', 1000, 20000, 500)}
          {slider('support_width', 't appui', 'mm', 100, 1000, 10)}
          {slider('n_ed', 'NEd', 'kN', 0, 10000, 10)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Enveloppe de cisaillement" vbW={400} vbH={150}>
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
              <div>VRd,c = <b>{res.v_rdc.toFixed(1)}</b> kN | VRd,max = <b>{res.v_rdc_max.toFixed(1)}</b> kN</div>
              <div>k = <b>{res.k_factor.toFixed(2)}</b> | β = <b>{res.beta_factor.toFixed(2)}</b></div>
              <div>σcd = <b>{res.sigma_cd.toFixed(1)}</b> MPa</div>
              <div>VEd,Max = <b>{res.v_ed_max.toFixed(1)}</b> kN</div>
              <div>u₁ = <b>{res.perimeter_u1.toFixed(0)}</b> mm | Ac = <b>{res.area_concrete.toFixed(0)}</b> mm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Cisaillement circ. (EC2 §6.2)"
                latex={String.raw`V_{Rd,c} = C_{Rd,c} k (100\rho_l f_{ck})^{1/3} b_w d`}
                description="Section circulaire équivalente"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort tranchant', value: res.v_ed_max.toFixed(1) },
                    { symbol: String.raw`V_{Rd,c}`, meaning: 'Résistance béton', value: res.v_rdc.toFixed(1) },
                ]}
              />
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
              <li className="text-slate-500">• u₁ = {res.perimeter_u1.toFixed(0)} mm</li>
              <li className="text-slate-500">• Ac = {res.area_concrete.toFixed(0)} mm²</li>
            </ul>
          </div>
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
