import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PoutreSolElastiqueInputs, PoutreSolElastiqueOutput } from '../../types/engineering';

export default function Module222() {
  const [inputs, setInputs] = useState<PoutreSolElastiqueInputs>({
    l: 12, b: 0.6, h: 0.8, e_mpa: 33000, ks: 20, p: 200, m0: 0, q: 30,
  });
  const { data: res, error: err, live } = useModuleCalc<PoutreSolElastiqueInputs, PoutreSolElastiqueOutput>('calculate_poutre_sol_elastique_222', inputs);
  type NumKey = { [K in keyof PoutreSolElastiqueInputs]: PoutreSolElastiqueInputs[K] extends number ? K : never }[keyof PoutreSolElastiqueInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 222 — Poutre sur sol élastique"
      subtitle="Winkler — λ=(k/4EI)^¼, superposition P + M0 + q"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Poutre & sol</div>

          
{slider("l", "L", "m", 0.2, 50, 0.2)}

          
{slider("b", "b", "m", 0.1, 2, 0.1)}

          
{slider("h", "h", "m", 0.1, 2, 0.1)}

          
{slider("e_mpa", "E", "MPa", 0, 100000, 100.0)}

          
{slider("ks", "Ks", "MPa/m", 0, 50, 0.25)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges (centre + uniforme)</div>

          
{slider("p", "P centre", "kN", 0, 500, 2.5)}

          
{slider("m0", "M0 centre", "kN·m", 0, 100, 1)}

          
{slider("q", "q", "kN/m", 0, 100, 0.5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Tassement y(x) (mm)" vbW={400} vbH={200}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={200 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const yMax = Math.max(...result.ys.map(v => Math.abs(v)), 0.01);
                const X = (s: number) => 30 + ((s + inputs.l / 2) / inputs.l) * 340;
                const Y = (y: number) => 40 + (y / yMax) * 110;
                return (
                  <>
                    <rect x={30} y={150} width={340} height={30} fill="#FEF3C7" stroke="#92400E" />
                    <text x={35} y={168} fontSize={10} fill="#92400E">sol Ks={inputs.ks}</text>
                    <polyline points={result.xs.map((s, i) => `${X(s).toFixed(1)},${Y(result.ys[i]).toFixed(1)}`).join(' ')}
                      fill="none" stroke="#1D4ED8" strokeWidth={2.5} />
                    <line x1={X(0)} y1={20} x2={X(0)} y2={Y(result.ys[Math.floor(result.ys.length / 2)])} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3" />
                    <text x={X(0) + 6} y={30} fontSize={10} fill="#EF4444">P={inputs.p} — y0={result.y0.toFixed(1)}</text>
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
          <div className={`p-3 rounded font-semibold ${status === 'pass' ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : status === 'fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'y0', value: res.y0.toFixed(1), unit: 'mm', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Mmax', value: res.m_max.toFixed(0), unit: 'kN·m', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'pmax', value: res.p_max.toFixed(0), unit: 'kN/m', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'l0', value: res.l0.toFixed(2), unit: 'm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Winkler infini"
                latex={String.raw`EI\,y'''' + Ky = 0 \quad \lambda = \sqrt[4]{KB/4EI}`}
                description="Superposition P + M0 + q"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`y_0`, meaning: "Tassement", value: res.y0.toFixed(1), unit: "mm" },
                  { symbol: String.raw`M_{max}`, meaning: "Moment maximal", value: res.m_max.toFixed(0), unit: "kN·m" },
                  { symbol: String.raw`l_0`, meaning: "Longueur caractéristique", value: res.l0.toFixed(2), unit: "m" },
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
