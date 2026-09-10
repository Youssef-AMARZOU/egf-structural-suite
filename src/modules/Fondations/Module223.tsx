import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PieuxEluFlexionInputs, PieuxEluFlexionOutput } from '../../types/engineering';

export default function Module223() {
  const [inputs, setInputs] = useState<PieuxEluFlexionInputs>({
    d: 800, n_bar: 10, phi: 20, c: 50, fck: 30, fyk: 500, n_ed: 2500, m_ed: 400,
  });
  const { data: res, error: err, live } = useModuleCalc<PieuxEluFlexionInputs, PieuxEluFlexionOutput>('calculate_pieux_elu_flexion_223', { ...inputs, n_bar: Math.round(inputs.n_bar) });
  const ok = res ? res.ratio <= 1 : false;
  const ROUND: Set<string> = new Set(["n_bar"]);
  type NumKey = { [K in keyof PieuxEluFlexionInputs]: PieuxEluFlexionInputs[K] extends number ? K : never }[keyof PieuxEluFlexionInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 223 — Pieux ELU en flexion composée"
      subtitle="Section circulaire — courbe N-M (pivots EC2) + torseur ELU"
      eurocode="EC2 §6.1"
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

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Torseur ELU</div>

          
{slider("n_ed", "NEd (compr.+)", "kN", 0, 10000, 25.0)}

          
{slider("m_ed", "MEd", "kN·m", 0, 1000, 5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Courbe N-M + torseur" vbW={400} vbH={260}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={260 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const mMax = Math.max(...result.curve_m, inputs.m_ed, 1);
                const nMax = Math.max(...result.curve_n, inputs.n_ed, 1);
                const nMin = Math.min(...result.curve_n, 0);
                const X = (m: number) => 50 + (m / mMax) * 320;
                const Y = (n: number) => 20 + (1 - (n - nMin) / (nMax - nMin)) * 210;
                const pts = result.curve_m.map((m, i) => `${X(m).toFixed(1)},${Y(result.curve_n[i]).toFixed(1)}`).join(' ');
                return (
                  <>
                    <line x1={50} y1={Y(0)} x2={370} y2={Y(0)} stroke="#999" strokeDasharray="4,3" />
                    <polygon points={`50,${Y(0)} ${pts}`} fill="#3B82F6" opacity={0.2} />
                    <polyline points={pts} fill="none" stroke="#1D4ED8" strokeWidth={2} />
                    <circle cx={X(inputs.m_ed)} cy={Y(inputs.n_ed)} r={6} fill={ok ? '#22C55E' : '#EF4444'} />
                    <text x={X(inputs.m_ed) + 10} y={Y(inputs.n_ed)} fontSize={10} fill={ok ? '#15803D' : '#B91C1C'}>
                      ({inputs.m_ed}, {inputs.n_ed})
                    </text>
                    <text x={60} y={250} fontSize={10} fill="#333">M (kN·m)</text>
                  </>
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
          <div className={`p-3 rounded font-semibold ${ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Taux', value: (res.ratio * 100).toFixed(0), unit: '%', color: 'bg-blue-50' },
              { label: 'Nmax', value: res.n_max.toFixed(0), unit: 'kN', color: 'bg-purple-50' },
              { label: 'Mmax', value: res.m_max.toFixed(0), unit: 'kN·m', color: 'bg-orange-50' },
              { label: 'x éq.', value: res.x_eq.toFixed(0), unit: 'mm', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Pieu ELU flexion composée"
                latex={String.raw`(N_{Ed}, M_{Ed}) \in \mathcal{D}_{Rd}`}
                description="Bloc 0,8x + pivots, circulaire"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\tau`, meaning: "Taux", value: res.ratio.toFixed(2) },
                  { symbol: String.raw`N_{max}`, meaning: "Effort maximal", value: res.n_max.toFixed(0), unit: "kN" },
                  { symbol: String.raw`x_{eq}`, meaning: "Axe neutre équivalent", value: res.x_eq.toFixed(0), unit: "mm" },
                ]}
              />
          {res.diag.length > 0 && (
            <div className="bg-gray-50 border rounded p-3 text-sm font-mono space-y-1">
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
