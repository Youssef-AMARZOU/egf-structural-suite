import { useState } from 'react';
import type { EcretementInputs, EcretementOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: EcretementInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bw: 250, h: 500, d: 440,
  l_noeud: 12000, t_appui: 250,
  m_ed_sup: -200, v_ed_sup: 300,
  m_ed_pos_max: 150, m_span_design: 120,
  n_spans: 3, span_lengths: [4000, 4000, 4000],
  support_widths: [250, 250, 250, 250],
};


export default function Module135() {
  const [inp, setInp] = useState<EcretementInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<EcretementInputs, EcretementOutput>(
    'calculate_ecretement_135', inp,
  );
  const S = (k: keyof EcretementInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof EcretementInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="135 Écrêtement"
      subtitle="Écrêtement M/V appuis — EC2 §5.3.2.2, §6.2.1(8)"
      eurocode="EC2 §5.3.2.2"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'Acier fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutre</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('bw', 'Largeur âme bw', 'mm', 100, 1000, 10)}
          {slider('h', 'Hauteur h', 'mm', 100, 1500, 10)}
          {slider('d', 'Hauteur utile d', 'mm', 50, 1400, 5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('l_noeud', 'L_nœud', 'mm', 2000, 30000, 500)}
          {slider('t_appui', 't appui', 'mm', 100, 1000, 10)}
          {slider('n_spans', 'Nb travées', '-', 1, 10, 1)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('m_ed_sup', 'MEd,sup', 'kN·m', -1000, 0, 5)}
          {slider('v_ed_sup', 'VEd,sup', 'kN', 0, 1000, 5)}
          {slider('m_ed_pos_max', 'MEd,pos', 'kN·m', 0, 500, 5)}
          {slider('m_span_design', 'M_span,des', 'kN·m', 0, 500, 5)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Diagramme de moments" vbW={400} vbH={180}>
            {res && (() => {
              const ox = 40, oy = 90, w = 340, h = 140;
              const env = res.moment_envelope;
              const maxM = Math.max(...env.map(Math.abs), 1);
              const sc = h / maxM / 2;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={0.5} />

                  {env.map((m, i) => {
                    const x = ox + (i / (env.length - 1)) * w;
                    const y = oy - m * sc;
                    return (
                      <g key={i}>
                        {i > 0 && (
                          <line
                            x1={ox + ((i - 1) / (env.length - 1)) * w}
                            y1={oy - env[i - 1] * sc}
                            x2={x}
                            y2={y}
                            stroke="#2563eb"
                            strokeWidth={1.5}
                          />
                        )}
                      </g>
                    );
                  })}

                  {res.moment_envelope.length > 0 && (
                    <>
                      <line
                        x1={ox} y1={oy - res.m_sup_red * sc}
                        x2={ox + w} y2={oy - res.m_sup_red * sc}
                        stroke="#ef4444" strokeWidth={0.8} strokeDasharray="4,2"
                      />
                      <text x={ox + w + 4} y={oy - res.m_sup_red * sc + 3} fontSize={5} fill="#ef4444">M_red</text>
                    </>
                  )}

                  <text x={ox} y={oy + 16} fontSize={5} fill="#64748b">0</text>
                  <text x={ox + w} y={oy + 16} fontSize={5} fill="#64748b" textAnchor="end">L</text>
                  <text x={ox + w / 2} y={oy + 16} textAnchor="middle" fontSize={5} fill="#64748b">
                    Écrêtement {res.reduction_pct.toFixed(0)}%
                  </text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupes d'appui</h2>
          {res && res.support_caps.length > 0 && (
            <div className="h-28">
              <SectionCanvas title="Coupes d'appui" vbW={350} vbH={80}>
                {(() => {
                  const maxM = Math.max(...res.support_caps.map((c) => c.m_original), 1);
                  const barH = 50;
                  const w = 350 / res.support_caps.length - 4;
                  return res.support_caps.map((cap, i) => {
                    const hOrig = (cap.m_original / maxM) * barH;
                    const hCap = (cap.m_capped / maxM) * barH;
                    const x = (i / res.support_caps.length) * 350 + 2;
                    return (
                      <g key={i}>
                        <rect x={x} y={70 - hOrig} width={w / 2 - 1} height={hOrig} fill="#94a3b8" rx={1} opacity={0.5} />
                        <rect x={x + w / 2} y={70 - hCap} width={w / 2 - 1} height={hCap} fill="#2563eb" rx={1} opacity={0.8} />
                        <text x={x + w / 2} y={75} textAnchor="middle" fontSize={5} fill="#64748b">A{i + 1}</text>
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
              <div>M,sup,orig = <b>{res.m_sup_original.toFixed(1)}</b> kN·m</div>
              <div>M,sup,red = <b>{res.m_sup_red.toFixed(1)}</b> kN·m | Réduction = <b>{res.reduction_pct.toFixed(0)}%</b></div>
              <div>ΔM = <b>{res.delta_m.toFixed(1)}</b> kN·m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>M,span,orig = <b>{res.m_span_original.toFixed(1)}</b> kN·m</div>
              <div>M,span,red = <b>{res.m_span_red.toFixed(1)}</b> kN·m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>VEd(d) = <b>{res.v_ed_at_d.toFixed(1)}</b> kN</div>
              <div>VRd,c = <b>{res.v_rdc.toFixed(1)}</b> kN | VRd,max = <b>{res.v_rdc_max.toFixed(1)}</b> kN</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>


              <FormulaCard
                title="Écrêtement (EC2 §5.3.2.2)"
                latex={String.raw`M_{Ed,nu} = M_{Ed} - V_{Ed} \cdot t/2`}
                description="Moment au nu de l'appui"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment sur axe', value: inp.m_ed_sup },
                    { symbol: String.raw`t`, meaning: 'Largeur d’appui', value: res.m_sup_original.toFixed(1) },
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
                {res.ratio_v <= 1.0 ? '✓' : '✗'} VEd(d)/VRd,c = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• M,sup,orig = {res.m_sup_original.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• M,sup,red = {res.m_sup_red.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• Réduction = {res.reduction_pct.toFixed(0)}%</li>
              <li className="text-slate-500">• ΔM = {res.delta_m.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• M,span,red = {res.m_span_red.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• VEd(d) = {res.v_ed_at_d.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,c = {res.v_rdc.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,max = {res.v_rdc_max.toFixed(1)}kN</li>
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
