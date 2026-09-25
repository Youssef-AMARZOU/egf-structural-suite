import { useState } from 'react';
import type { EffTrReprBetonInputs, EffTrReprBetonOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: EffTrReprBetonInputs = {
  fck: 30, gc: 1.5, b: 300, bw: 200, h: 600, hf: 120,
  d: 540, dp: 60, m_ed: 150, v_ed: 120,
  asw: 1.0, as_min: 0.25, n_zones: 3,
  zone_lengths: [0.5, 2.0, 1.0],
  zone_asw_req: [0.8, 0.4, 0.6],
};


export default function Module128() {
  const [inp, setInp] = useState<EffTrReprBetonInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<EffTrReprBetonInputs, EffTrReprBetonOutput>(
    'calculate_eff_tr_repr_beton_128', inp,
  );
  const S = (k: keyof EffTrReprBetonInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof EffTrReprBetonInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="128 Eff. Tranchants"
      subtitle="Cadres shear — k, β, espacement étriers"
      eurocode="EC2 §6.2"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b', 'Largeur b', 'mm', 100, 2000, 10)}
          {slider('bw', 'Largeur âme bw', 'mm', 100, 1000, 10)}
          {slider('h', 'Hauteur h', 'mm', 100, 2000, 10)}
          {slider('hf', 'Épaisseur dalle hf', 'mm', 0, 500, 10)}
          {slider('d', 'Hauteur utile d', 'mm', 50, 2000, 5)}
          {slider('dp', 'Enrobage dp', 'mm', 20, 200, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('m_ed', 'Moment MEd', 'kN·m', -500, 2000, 5)}
          {slider('v_ed', 'Tranchant VEd', 'kN', 0, 1000, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Étriers</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('asw', 'Armature transv. Asw', 'cm²', 0.1, 5, 0.1)}
          {slider('as_min', 'Armature min. As,min', 'cm²/m', 0.1, 2, 0.05)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe (SVG)" vbW={300} vbH={200}>
            {(() => {
              const ox = 100, oy = 20;
              const sc = 0.25;
              const w = inp.b * sc;
              const hh = inp.h * sc;
              const wWeb = inp.bw * sc;
              const hfSc = inp.hf * sc;
              return (
                <g>
                  <rect x={ox - w / 2} y={oy} width={w} height={hfSc} fill="#93c5fd" stroke="#3b82f6" strokeWidth={0.5} />
                  <rect x={ox - wWeb / 2} y={oy + hfSc} width={wWeb} height={hh - hfSc} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.5} />
                  {[0.2, 0.4, 0.6, 0.8].map((frac, i) => (
                    <line key={i} x1={ox - wWeb / 2 + 2} y1={oy + hfSc + frac * (hh - hfSc)} x2={ox + wWeb / 2 - 2} y2={oy + hfSc + frac * (hh - hfSc)} stroke="#2563eb" strokeWidth={0.5} strokeDasharray="2,1" />
                  ))}
                  {res && (
                    <>
                      <line x1={ox} y1={oy} x2={ox} y2={oy + res.x_neutral * sc} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,2" />
                      <text x={ox + w / 2 + 5} y={oy + res.x_neutral * sc / 2} fontSize={7} fill="#ef4444">x={res.x_neutral.toFixed(0)}</text>
                    </>
                  )}
                  <text x={ox} y={oy + hh + 15} textAnchor="middle" fontSize={7} fill="#64748b">k={res?.k_factor.toFixed(2) || '-'} β={res?.beta.toFixed(2) || '-'}</text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Étriers (barres)</h2>
          {res && res.n_stirrups.length > 0 && (
            <div className="h-32">
              <SectionCanvas title="Étriers (barres)" vbW={300} vbH={80}>
                {(() => {
                  const maxN = Math.max(...res.n_stirrups, 1);
                  const barH = 50;
                  return res.n_stirrups.map((n, i) => {
                    if (n <= 0) return null;
                    const h = (n / maxN) * barH;
                    const x = (i / res.n_stirrups.length) * 300;
                    const w = 300 / res.n_stirrups.length - 2;
                    const s = res.s_stirrups[i];
                    return (
                      <g key={i}>
                        <rect x={x + 1} y={70 - h} width={w} height={h} fill="#2563eb" rx={2} opacity={0.8} />
                        <text x={x + w / 2 + 1} y={75} textAnchor="middle" fontSize={5} fill="#64748b">{s.toFixed(0)}</text>
                        <text x={x + w / 2 + 1} y={65 - h} textAnchor="middle" fontSize={5} fill="#1e293b">{n.toFixed(0)}</text>
                      </g>
                    );
                  });
                })()}
              </SectionCanvas>
            </div>
          )}
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
              <div>ξ = <b>{res.ksi.toFixed(3)}</b> | x = <b>{res.x_neutral.toFixed(1)}</b> mm</div>
              <div>k = <b>{res.k_factor.toFixed(3)}</b> | β = <b>{res.beta.toFixed(3)}</b></div>
              <div>μ = <b>{res.mu.toFixed(4)}</b></div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>VRd,max = <b>{res.v_rd_max.toFixed(1)}</b> kN</div>
              <div>s,max = <b>{res.s_max.toFixed(0)}</b> mm</div>
              <div>Longueur totale = <b>{res.total_length.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Cisaillement (EC2 §6.2)"
                latex={String.raw`V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta`}
                description="Treillis à bielle variable"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`A_{sw}/s`, meaning: 'Cours transversal', value: inp.asw },
                    { symbol: String.raw`\theta`, meaning: 'Angle des bielles', value: res.ksi.toFixed(3) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={inp.v_ed <= res.v_rd_max ? 'text-green-600' : 'text-red-600'}>
              {inp.v_ed <= res.v_rd_max ? '✓' : '✗'} VEd={inp.v_ed.toFixed(1)}kN {inp.v_ed <= res.v_rd_max ? '≤' : '>'} VRd,max={res.v_rd_max.toFixed(1)}kN
            </li>
            <li className={res.k_factor < 1.0 ? 'text-green-600' : 'text-yellow-600'}>
              {res.k_factor < 1.0 ? '✓' : '⚠'} k = {res.k_factor.toFixed(3)}
            </li>
            <li className="text-slate-500">• β = {res.beta.toFixed(3)}</li>
            <li className="text-slate-500">• ξ = {res.ksi.toFixed(3)} | μ = {res.mu.toFixed(4)}</li>
            <li className="text-slate-500">• s,max = {res.s_max.toFixed(0)}mm</li>
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
