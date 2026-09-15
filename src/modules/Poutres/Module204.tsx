import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { FluageRetrait204Inputs, FluageRetrait204Output } from '../../types/engineering';

export default function Module204() {
  const [inputs, setInputs] = useState<FluageRetrait204Inputs>({
    b: 0.3, h: 0.5, fck: 30, t0: 28, t: 10000, rh: 60, classe_ciment: 'N',
  });
  const { data: res, error: err, live } = useModuleCalc<FluageRetrait204Inputs, FluageRetrait204Output>('calculate_fluage_retrait_204', inputs);
  type NumKey = { [K in keyof FluageRetrait204Inputs]: FluageRetrait204Inputs[K] extends number ? K : never }[keyof FluageRetrait204Inputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 204 — Fluage & retrait (EC2 Ann. B)"
      subtitle="φ(t,t0), εcd + εca — t0 ajusté selon la classe du ciment"
      eurocode="EC2 Ann. B"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section & béton</div>

          
{slider("b", "b", "m", 0.05, 1.0, 0.05)}

          
{slider("h", "h", "m", 0.05, 2, 0.05)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Ciment</span>
            <select value={inputs.classe_ciment} onChange={e => setInputs({ ...inputs, classe_ciment: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono">
              {['S', 'N', 'R'].map(c => <option key={c} value={c}>Classe {c}</option>)}
            </select>
          </label>
        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Temps & ambiance</div>

          
{slider("t0", "t0 chargement", "j", 1, 365, 1.0)}

          
{slider("t", "t considéré", "j", 10, 30000, 100.0)}

          
{slider("rh", "RH", "%", 40, 100, 1.0)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Évolution du fluage" vbW={400} vbH={180}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={180 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const pts = [1, 3, 7, 28, 90, 365, 1000, 3650, 10000].filter(t => t > inputs.t0)
                  .map(t => {
                    const x = 30 + 340 * (Math.log10(t) / 4);
                    const beta = Math.pow((t - inputs.t0) / (800 + t - inputs.t0), 0.3);
                    const y = 160 - 130 * Math.min(beta * result.phi_0 / Math.max(result.phi_t, 0.01), 1);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ');
                return (
                  <>
                    <line x1={30} y1={160} x2={370} y2={160} stroke="#64748B" />
                    <line x1={30} y1={160} x2={30} y2={20} stroke="#64748B" />
                    <polyline points={pts} fill="none" stroke="#1D4ED8" strokeWidth={2.5} />
                    <text x={200} y={175} fontSize={10} fill="#CBD5E1" textAnchor="middle">log(t) — φ(t,t0)→{result.phi_t.toFixed(2)}</text>
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
              { label: 'φ(t,t0)', value: res.phi_t.toFixed(2), unit: '', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'φ0', value: res.phi_0.toFixed(2), unit: '', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'εcs', value: res.eps_cs.toFixed(0), unit: 'µm/m', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'h0', value: res.h0.toFixed(0), unit: 'mm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Fluage-retrait (Annexe B)"
                latex={String.raw`\varphi(t,t_0) = \varphi_0 \beta_c \quad \varepsilon_{cs} = \varepsilon_{cd}+\varepsilon_{ca}`}
                description="Ciment S/N/R"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varphi`, meaning: "Coefficient de fluage", value: res.phi_t.toFixed(2) },
                  { symbol: String.raw`\varepsilon_{cs}`, meaning: "Retrait total", value: res.eps_cs.toFixed(0), unit: "µm/m" },
                  { symbol: String.raw`h_0`, meaning: "Rayon moyen", value: res.h0.toFixed(0), unit: "mm" },
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
