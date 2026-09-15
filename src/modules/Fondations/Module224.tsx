import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PieuxElsFlexionInputs, PieuxElsFlexionOutput } from '../../types/engineering';

export default function Module224() {
  const [inputs, setInputs] = useState<PieuxElsFlexionInputs>({
    d: 800, n_bar: 10, phi: 20, c: 50, fck: 30, fyk: 500, n_els: 1500, m_els: 250,
  });
  const { data: res, error: err, live } = useModuleCalc<PieuxElsFlexionInputs, PieuxElsFlexionOutput>('calculate_pieux_els_flexion_224', { ...inputs, n_bar: Math.round(inputs.n_bar) });
  const ok = res ? res.ratio_c <= 1 && res.ratio_s <= 1 : false;
  const ROUND: Set<string> = new Set(["n_bar"]);
  type NumKey = { [K in keyof PieuxElsFlexionInputs]: PieuxElsFlexionInputs[K] extends number ? K : never }[keyof PieuxElsFlexionInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 224 — Pieux ELS en flexion composée"
      subtitle="Section homogénéisée fissurée — σc ≤ 0,6fck, σs ≤ 0,8fyk"
      eurocode="EC2 §7.2"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Pieu</div>

          
{slider("d", "D", "mm", 10, 2000, 10)}

          
{slider("n_bar", "nb barres", "", 2, 20, 1)}

          
{slider("phi", "φ", "mm", 0.25, 50, 0.25)}

          
{slider("c", "Enrobage", "mm", 0.5, 200, 0.5)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Torseur ELS</div>

          
{slider("n_els", "N ELS (compr.+)", "kN", 0, 5000, 25.0)}

          
{slider("m_els", "M ELS", "kN·m", 0, 1000, 2.5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Taux d'utilisation ELS" vbW={400} vbH={140}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={140 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const bars = [
                  { label: 'béton', r: result.ratio_c, col: '#3B82F6' },
                  { label: 'acier', r: result.ratio_s, col: '#7C3AED' },
                ];
                return (
                  <g>
                    {bars.map((b, i) => (
                      <g key={b.label}>
                        <text x={10} y={45 + i * 50} fontSize={11}>{b.label}</text>
                        <rect x={80} y={28 + i * 50} width={280} height={22} fill="#F1F5F9" stroke="#CBD5E1" />
                        <rect x={80} y={28 + i * 50} width={Math.min(b.r, 1.2) * 280 / 1.2} height={22}
                          fill={b.r <= 1 ? b.col : '#EF4444'} />
                        <line x1={80 + 280 / 1.2} y1={24 + i * 50} x2={80 + 280 / 1.2} y2={54 + i * 50} stroke="#64748B" strokeWidth={2} />
                        <text x={90 + Math.min(b.r, 1.2) * 280 / 1.2} y={44 + i * 50} fontSize={10} fill="#CBD5E1">{(b.r * 100).toFixed(0)}%</text>
                      </g>
                    ))}
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
              { label: 'σc', value: res.sig_c.toFixed(1), unit: 'MPa', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'σs', value: res.sig_s.toFixed(0), unit: 'MPa', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'x', value: res.x.toFixed(0), unit: 'mm', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'n_eq', value: res.neq.toFixed(1), unit: '', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Pieu ELS flexion composée"
                latex={String.raw`\sigma_c \le 0.6 f_{ck} \quad \sigma_s \le 0.8 f_{yk}`}
                description="Section homogénéisée fissurée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\sigma_c`, meaning: "Contrainte béton", value: res.sig_c.toFixed(1), unit: "MPa" },
                  { symbol: String.raw`\sigma_s`, meaning: "Contrainte acier", value: res.sig_s.toFixed(0), unit: "MPa" },
                  { symbol: String.raw`\tau`, meaning: "Taux maximal", value: `${(Math.max(res.ratio_c, res.ratio_s) * 100).toFixed(0)} %` },
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
