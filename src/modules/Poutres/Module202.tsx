import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { AuxiliairesFlexionInputs, AuxiliairesFlexionOutput } from '../../types/engineering';

export default function Module202() {
  const [inputs, setInputs] = useState<AuxiliairesFlexionInputs>({
    m_ed: 150, b: 300, h: 500, d: 450, bw: 300, hf: 0, dp: 40, fck: 30, fyk: 500,
  });
  const isT = inputs.hf > 0 && inputs.bw < inputs.b;
  const H = 200, yTop = 20, sc = H / Math.max(inputs.h, 1);
  const hPx = inputs.h * sc, dPx = inputs.d * sc, hfPx = inputs.hf * sc;
  const bPx = Math.min(inputs.b / 4, 220), bwPx = Math.min(inputs.bw / 4, 220);
  const { data: res, error: err, live } = useModuleCalc<AuxiliairesFlexionInputs, AuxiliairesFlexionOutput>('calculate_auxiliaires_flexion_202', inputs);
  type NumKey = { [K in keyof AuxiliairesFlexionInputs]: AuxiliairesFlexionInputs[K] extends number ? K : never }[keyof AuxiliairesFlexionInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 202 — Auxiliaires : flexion simple"
      subtitle="Noyau flexion EC2 du classeur d'auxiliaires — rectangulaire / en T, pivots A/B"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation & géométrie</div>

          
{slider("m_ed", "MEd", "kN·m", 0, 500, 2.5)}

          
{slider("b", "b (table)", "mm", 5, 1000, 5)}

          
{slider("h", "h", "mm", 5, 2000, 5)}

          
{slider("d", "d", "mm", 5, 2000, 5)}

          
{slider("bw", "bw (nervure)", "mm", 5, 1000, 5)}

          
{slider("hf", "hf (0=rect.)", "mm", 0, 500, 10)}

          
{slider("dp", "d'", "mm", 0.5, 100, 0.5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title={`Section ${isT ? 'en T' : 'rectangulaire'} — bloc comprimé`} vbW={400} vbH={240}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={240 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const cx = 200, xPx = result.x * sc;
                return (
                  <>
                    {isT ? (
                      <>
                        <rect x={cx - bPx / 2} y={yTop} width={bPx} height={hfPx} fill="#E2E8F0" stroke="#64748B" />
                        <rect x={cx - bwPx / 2} y={yTop + hfPx} width={bwPx} height={hPx - hfPx} fill="#E2E8F0" stroke="#64748B" />
                      </>
                    ) : (
                      <rect x={cx - bPx / 2} y={yTop} width={bPx} height={hPx} fill="#E2E8F0" stroke="#64748B" />
                    )}
                    <rect x={cx - bPx / 2} y={yTop} width={bPx} height={Math.min(xPx, hPx)} fill="#3B82F6" opacity={0.55} />
                    <line x1={cx - bPx / 2 - 30} y1={yTop + dPx} x2={cx + bPx / 2 + 30} y2={yTop + dPx} stroke="#EF4444" strokeWidth={2} strokeDasharray="5,3" />
                    <text x={cx + bPx / 2 + 34} y={yTop + dPx + 4} fontSize={10} fill="#EF4444">As</text>
                    <text x={cx} y={yTop + hPx + 16} fontSize={10} fill="#CBD5E1" textAnchor="middle">x={result.x.toFixed(0)} mm — pivot {result.pivot}</text>
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
              { label: 'As', value: res.as_req.toFixed(0), unit: 'mm²', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: "As'", value: res.as_comp.toFixed(0), unit: 'mm²', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'x', value: res.x.toFixed(0), unit: 'mm', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'μ', value: res.mu.toFixed(3), unit: '', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Flexion simple EC2"
                latex={String.raw`\mu = \frac{M_{Ed}}{b d^2 f_{cd}}`}
                description="Rectangulaire / en T, pivots"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\mu`, meaning: "Moment réduit", value: res.mu.toFixed(3) },
                  { symbol: String.raw`A_s`, meaning: "Acier tendu requis", value: res.as_req.toFixed(0), unit: "mm²" },
                  { symbol: String.raw`x`, meaning: "Axe neutre", value: res.x.toFixed(0), unit: "mm" },
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
