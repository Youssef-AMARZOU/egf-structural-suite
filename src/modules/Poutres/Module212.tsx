import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { EffTrSectQqInputs, EffTrSectQqOutput } from '../../types/engineering';

export default function Module212() {
  const [inputs, setInputs] = useState<EffTrSectQqInputs>({
    v_ed: 180, n_ed: 0, bw: 300, d: 450, ac: 150000, asl: 1500, asw_s: 500, cot_theta: 2.5, fck: 30, fyk: 500,
  });
  const { data: res, error: err, live } = useModuleCalc<EffTrSectQqInputs, EffTrSectQqOutput>('calculate_eff_tr_sect_qq_212', inputs);
  const ok = res ? res.ratio <= 1 : false;
  type NumKey = { [K in keyof EffTrSectQqInputs]: EffTrSectQqInputs[K] extends number ? K : never }[keyof EffTrSectQqInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 212 — Effort tranchant, section quelconque"
      subtitle="EC2 §6.2 — VRd,c / VRd,s / VRd,max, flexion simple ou composée (NEd)"
      eurocode="EC2 §6.2"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations & âme</div>

          
{slider("v_ed", "VEd", "kN", 0, 500, 2.5)}

          
{slider("n_ed", "NEd (compr.+)", "kN", 0, 100, 1)}

          
{slider("bw", "bw âme équiv.", "mm", 5, 1000, 5)}

          
{slider("d", "d", "mm", 5, 2000, 5)}

          
{slider("ac", "Ac (σcp)", "mm²", 20000, 500000, 5000)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Ferraillage & matériaux</div>

          
{slider("asl", "Asl tendu", "mm²", 25.0, 5000, 25.0)}

          
{slider("asw_s", "Asw/s", "mm²/m", 5, 2000, 5)}

          
{slider("cot_theta", "cot θ", "", 1, 2.5, 0.1)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Treillis (θ) — bielle / cours" vbW={400} vbH={180}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={180 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const theta = Math.atan(1 / inputs.cot_theta);
                const dx = 60 * inputs.cot_theta;
                return (
                  <g>
                    <line x1={20} y1={30} x2={380} y2={30} stroke="#64748B" strokeWidth={3} />
                    <line x1={20} y1={150} x2={380} y2={150} stroke="#64748B" strokeWidth={3} />
                    {[0, 1, 2].map(i => (
                      <g key={i}>
                        <line x1={60 + i * dx} y1={30} x2={60 + i * dx + dx} y2={150} stroke="#3B82F6" strokeWidth={3} />
                        <line x1={60 + i * dx} y1={150} x2={60 + i * dx} y2={30} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3" />
                      </g>
                    ))}
                    <text x={200} y={172} fontSize={10} fill="#CBD5E1" textAnchor="middle">θ={(theta * 180 / Math.PI).toFixed(1)}° — cotθ={inputs.cot_theta}</text>
                  </g>
                );
              })()}
            </>);
    })()}
  </SectionCanvas>
</div>
      </>}
      results={<>
        {res ? (
        <div className="space-y-4">
          <div className={`p-3 rounded font-semibold ${ok ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'VRd,c', value: res.vrd_c.toFixed(0), unit: 'kN', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'VRd,s', value: res.arm_transv ? res.vrd_s.toFixed(0) : '—', unit: 'kN', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'VRd,max', value: res.vrd_max.toFixed(0), unit: 'kN', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Taux', value: (res.ratio * 100).toFixed(0), unit: '%', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Cisaillement QQ (EC2 §6.2)"
                latex={String.raw`V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta`}
                description="Âme équivalente + flexion composée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`V_{Rd,c}`, meaning: "Béton seul", value: res.vrd_c.toFixed(0), unit: "kN" },
                  { symbol: String.raw`V_{Rd,s}`, meaning: "Armatures", value: res.arm_transv ? res.vrd_s.toFixed(0) : '—', unit: "kN" },
                  { symbol: String.raw`\tau`, meaning: "Taux", value: res.ratio.toFixed(2) },
                ]}
              />
          {res.diag.length > 0 && (
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-sm font-mono space-y-1 dark:text-slate-300">
              {res.diag.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
        ) : (
        <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
        )}
      </>}
    />
  );
}
