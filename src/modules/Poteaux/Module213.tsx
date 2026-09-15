import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend } from '../../components/drafting';
import { FissureCercleInputs, FissureCercleOutput } from '../../types/engineering';

export default function Module213() {
  const [inputs, setInputs] = useState<FissureCercleInputs>({
    d: 800, n_bar: 12, phi: 20, c: 40, n_qp: 200, m_qp: 300, fck: 30, kt: 0.4, w_lim: 0.3,
  });
  const { data: res, error: err, live } = useModuleCalc<FissureCercleInputs, FissureCercleOutput>('calculate_fissure_cercle_213', { ...inputs, n_bar: Math.round(inputs.n_bar) });
  const ok = res ? res.ratio <= 1 : false;
  const ROUND: Set<string> = new Set(["n_bar"]);
  type NumKey = { [K in keyof FissureCercleInputs]: FissureCercleInputs[K] extends number ? K : never }[keyof FissureCercleInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 213 — Fissuration, section circulaire"
      subtitle="EC2 §7.3.4 — section fissurée élastique + wk = sr,max·(εsm−εcm)"
      eurocode="EC2 §7.3"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>

          
{slider("d", "D", "mm", 10, 2000, 10)}

          
{slider("n_bar", "nb barres", "", 2, 20, 1)}

          
{slider("phi", "φ", "mm", 0.25, 50, 0.25)}

          
{slider("c", "Enrobage", "mm", 0.5, 100, 0.5)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Combinaison quasi-permanente</div>

          
{slider("n_qp", "Nqp (compr.+)", "kN", 0, 500, 2.5)}

          
{slider("m_qp", "Mqp", "kN·m", 0, 1000, 5)}

          
{slider("kt", "kt", "", 0, 1, 0.1)}

          
{slider("w_lim", "w lim", "mm", 0.1, 0.5, 0.05)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Section — zone comprimée / fissures" vbW={400} vbH={240}>
    {(() => {
      const result = res;
      if (!result) return (<text x={200} y={120} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      const R = 85, cx = 200, cy = 125;
      const nBar = Math.round(inputs.n_bar);
      const rebarR = Math.max(3, inputs.phi * 0.4);
      const coverOffset = inputs.c + inputs.phi;
      const rebarCircleR = R - coverOffset * (R / (inputs.d / 2));
      const xPx = (result.x / inputs.d) * 2 * R;
      return (
        <g>
          <circle cx={cx} cy={cy} r={R} fill="#E2E8F0" stroke="#64748B" strokeWidth={2} />
          <clipPath id="clip213"><circle cx={cx} cy={cy} r={R} /></clipPath>
          <rect x={cx - R} y={cy - R} width={2 * R} height={xPx} fill="#3B82F6" opacity={0.45} clipPath="url(#clip213)" />
          <line x1={cx - R} y1={cy - R + xPx} x2={cx + R} y2={cy - R + xPx} stroke="#FACC15" strokeWidth={1.5} strokeDasharray="6 3" />
          {Array.from({ length: nBar }, (_, i) => {
            const angle = (Math.PI / 2) + (2 * Math.PI * i) / nBar;
            const bx = cx + rebarCircleR * Math.cos(angle);
            const by = cy + rebarCircleR * Math.sin(angle);
            return <circle key={i} cx={bx} cy={by} r={rebarR} fill="#EF4444" stroke="#991B1B" strokeWidth={0.8} />;
          })}
          <text x={cx + R + 8} y={cy - R + xPx + 4} fontSize={9} fill="#FACC15" textAnchor="start">
            Neutre (x={result.x.toFixed(0)} mm)
          </text>
          <InlineLegend
            items={[
              { label: `Zone comprimée (x = ${result.x.toFixed(0)} mm)`, color: '#3B82F6' },
              { label: `wk = ${result.wk.toFixed(2)} mm`, color: '#FACC15', dashed: true },
              { label: `Armatures φ${inputs.phi} × ${nBar}`, color: '#EF4444' },
            ]}
            x={cx - R}
            y={cy + R + 10}
          />
        </g>
      );
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
              { label: 'wk', value: res.wk.toFixed(2), unit: 'mm', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'σs', value: res.sigma_s.toFixed(0), unit: 'MPa', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'sr,max', value: res.sr_max.toFixed(0), unit: 'mm', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'x', value: res.x.toFixed(0), unit: 'mm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Fissure circulaire (EC2 §7.3.4)"
                latex={String.raw`w_k = s_{r,max}(\varepsilon_{sm} - \varepsilon_{cm})`}
                description="Section fissurée par bandes"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`w_k`, meaning: "Ouverture", value: res.wk.toFixed(2), unit: "mm" },
                  { symbol: String.raw`\sigma_s`, meaning: "Contrainte acier", value: res.sigma_s.toFixed(0), unit: "MPa" },
                  { symbol: String.raw`s_{r,max}`, meaning: "Espacement", value: res.sr_max.toFixed(0), unit: "mm" },
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
