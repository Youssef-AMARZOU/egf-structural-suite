import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { RotulePlastiqueInputs, RotulePlastiqueOutput } from '../../types/engineering';

export default function Module208() {
  const [inputs, setInputs] = useState<RotulePlastiqueInputs>({
    b: 300, d: 450, a_s: 1500, fck: 30, fyk: 500, acier_b: true, lambda_s: 3, theta_req: 12, delta: 0.85,
  });
  const { data: res, error: err, live } = useModuleCalc<RotulePlastiqueInputs, RotulePlastiqueOutput>('calculate_rotule_plastique_208', inputs);
  const ok = res ? res.rot_ok && res.redist_ok : false;
  type NumKey = { [K in keyof RotulePlastiqueInputs]: RotulePlastiqueInputs[K] extends number ? K : never }[keyof RotulePlastiqueInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 208 — Rotule plastique"
      subtitle="Capacité de rotation EC2 §5.6.3 (Fig 5.6N) + redistribution §5.5"
      eurocode="EC2 §5.6"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>

          
{slider("b", "b", "mm", 5, 1000, 5)}

          
{slider("d", "d", "mm", 5, 2000, 5)}

          
{slider("a_s", "As tendu", "mm²", 25.0, 5000, 25.0)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Rotule</div>

          <label className="flex items-center gap-2 text-sm py-1">
            <input type="checkbox" checked={inputs.acier_b} onChange={e => setInputs({ ...inputs, acier_b: e.target.checked })} />
            Acier classe B (décocher = C)
          </label>
          
{slider("lambda_s", "λs = M/Vd", "", 1, 6, 0.5)}

          
{slider("theta_req", "θ demandée", "mrad", 0, 30, 1)}

          
{slider("delta", "δ redistribution", "", 0.5, 1, 0.05)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Capacité vs demande" vbW={400} vbH={160}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={160 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const m = Math.max(result.theta_allow, result.theta_req, 1);
                const wA = (result.theta_allow / m) * 320, wR = (result.theta_req / m) * 320;
                return (
                  <>
                    <text x={10} y={55} fontSize={11}>adm</text>
                    <rect x={60} y={35} width={wA} height={24} fill="#3B82F6" />
                    <text x={65 + wA} y={52} fontSize={11} fill="#3B82F6">{result.theta_allow.toFixed(1)}</text>
                    <text x={10} y={105} fontSize={11}>dem</text>
                    <rect x={60} y={85} width={wR} height={24} fill={ok ? '#22C55E' : '#EF4444'} />
                    <text x={65 + wR} y={102} fontSize={11}>{result.theta_req.toFixed(1)}</text>
                    <line x1={60} y1={20} x2={60} y2={125} stroke="#64748B" />
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
              { label: 'xu/d', value: res.xu_d.toFixed(3), unit: '', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'θ adm', value: res.theta_allow.toFixed(1), unit: 'mrad', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'θ dem', value: res.theta_req.toFixed(1), unit: 'mrad', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'δmin', value: res.delta_min.toFixed(2), unit: '', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Rotation + redistribution"
                latex={String.raw`\delta \ge 0.44 + 1.25\,x_u/d`}
                description="Capacité Fig. 5.6N"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`x_u/d`, meaning: "Profondeur relative", value: res.xu_d.toFixed(3) },
                  { symbol: String.raw`\theta_{adm}`, meaning: "Rotation admissible", value: res.theta_allow.toFixed(1), unit: "mrad" },
                  { symbol: String.raw`\delta_{min}`, meaning: "Redistribution mini", value: res.delta_min.toFixed(2) },
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
