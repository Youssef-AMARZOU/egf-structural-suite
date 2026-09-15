import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, AxisTicks, InlineLegend } from '../../components/drafting';
import { InteractionMnFeuRectInputs, InteractionMnFeuRectOutput } from '../../types/engineering';

export default function Module219() {
  const [inputs, setInputs] = useState<InteractionMnFeuRectInputs>({
    b: 300, h: 300, a: 40, as_tot: 2000, fck: 30, fyk: 500, r: 90, n_ed_fi: 800, m_ed_fi: 60, faces: 4,
  });
  const { data: res, error: err, live } = useModuleCalc<InteractionMnFeuRectInputs, InteractionMnFeuRectOutput>('calculate_interaction_mn_feu_rect_219', { ...inputs, faces: Math.round(inputs.faces) });
  const ok = res ? res.ratio <= 1 : false;
  const ROUND: Set<string> = new Set(["faces"]);
  type NumKey = { [K in keyof InteractionMnFeuRectInputs]: InteractionMnFeuRectInputs[K] extends number ? K : never }[keyof InteractionMnFeuRectInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 219 — Interaction M-N feu, poteau rectangulaire"
      subtitle="EC2-1-2 — courbe d'interaction réduite + torseur de calcul"
      eurocode="EC2-1-2"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>

          
{slider("b", "b", "mm", 5, 1000, 5)}

          
{slider("h", "h", "mm", 5, 1000, 5)}

          
{slider("a", "a", "mm", 0, 100, 0.5)}

          
{slider("as_tot", "As total (2 lits)", "mm²", 25.0, 5000, 25.0)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu & torseur</div>

          
{slider("r", "R", "min", 0, 250.0, 30.0)}

          
{slider("faces", "Faces (1/4)", "", 1, 4, 1.0)}

          
{slider("n_ed_fi", "NEd,fi", "kN", 0, 2000, 10)}

          
{slider("m_ed_fi", "MEd,fi", "kN·m", 0, 200, 1)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Courbe d'interaction (M en abscisse, N en ordonnée)" vbW={400} vbH={260}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={260 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const mMax = Math.max(...result.curve_m, inputs.m_ed_fi, 1);
                const nMax = Math.max(...result.curve_n, inputs.n_ed_fi, 1);
                const nMin = Math.min(...result.curve_n, 0);
                const X = (m: number) => 50 + (m / mMax) * 320;
                const Y = (n: number) => 20 + (1 - (n - nMin) / (nMax - nMin)) * 210;
                const pts = result.curve_m.map((m, i) => `${X(m).toFixed(1)},${Y(result.curve_n[i]).toFixed(1)}`).join(' ');
                return (
                  <>
                    <line x1={50} y1={Y(0)} x2={370} y2={Y(0)} stroke="#64748B" strokeWidth={1} />
                    <line x1={50} y1={20} x2={50} y2={230} stroke="#64748B" strokeWidth={1} />
                    <polygon points={`50,${Y(0)} ${pts}`} fill="#3B82F6" opacity={0.15} />
                    <polyline points={pts} fill="none" stroke="#60A5FA" strokeWidth={2} />
                    <circle cx={X(inputs.m_ed_fi)} cy={Y(inputs.n_ed_fi)} r={6} fill={ok ? '#22C55E' : '#EF4444'} />
                    <text x={14} y={120} fontSize={9} fill="#94A3B8" textAnchor="middle" transform="rotate(-90 14 120)">N (kN)</text>
                    <AxisTicks
                      values={[0, mMax / 2, mMax]}
                      map={(v) => [X(v), Y(0)]}
                      unit="kN·m"
                      side="below"
                    />
                    <AxisTicks
                      values={[nMin, 0, nMax]}
                      map={(v) => [X(0), Y(v)]}
                      unit="kN"
                      side="left"
                    />
                    <text x={60} y={250} fontSize={10} fill="#CBD5E1">M (kN·m)</text>
                    <InlineLegend
                      items={[
                        { label: 'Courbe N-M', color: '#1D4ED8' },
                        { label: '(MEd, NEd)', color: ok ? '#22C55E' : '#EF4444' },
                      ]}
                      x={290}
                      y={25}
                    />
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
          <div className={`p-3 rounded font-semibold ${ok ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Taux', value: (res.ratio * 100).toFixed(0), unit: '%', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Nmax', value: res.n_max.toFixed(0), unit: 'kN', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Mmax', value: res.m_max.toFixed(1), unit: 'kN·m', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'ks', value: res.ks.toFixed(2), unit: '', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="N-M au feu rectangulaire"
                latex={String.raw`(N_{Ed}, M_{Ed}) \in \mathcal{D}_{fi}`}
                description="Section réduite à chaud, domaine résistant"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\tau`, meaning: "Taux", value: res.ratio.toFixed(2) },
                  { symbol: String.raw`N_{max}`, meaning: "Effort maximal", value: res.n_max.toFixed(0), unit: "kN" },
                  { symbol: String.raw`M_{max}`, meaning: "Moment maximal", value: res.m_max.toFixed(1), unit: "kN·m" },
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
