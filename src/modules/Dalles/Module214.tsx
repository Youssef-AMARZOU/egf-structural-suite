import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { FeuDallesAnalytiqueInputs, FeuDallesAnalytiqueOutput } from '../../types/engineering';

export default function Module214() {
  const [inputs, setInputs] = useState<FeuDallesAnalytiqueInputs>({
    h: 200, a: 30, a_s: 800, fck: 30, fyk: 500, r: 90, m_ed_fi: 25,
  });
  const { data: res, error: err, live } = useModuleCalc<FeuDallesAnalytiqueInputs, FeuDallesAnalytiqueOutput>('calculate_feu_dalles_analytique_214', inputs);
  const ok = res ? res.ratio <= 1 : false;
  type NumKey = { [K in keyof FeuDallesAnalytiqueInputs]: FeuDallesAnalytiqueInputs[K] extends number ? K : never }[keyof FeuDallesAnalytiqueInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 214 — Dalles au feu (analytique)"
      subtitle="EC2-1-2 isotherme 500°C — θs, ks(θ), MRd,fi"
      eurocode="EC2-1-2"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Dalle</div>

          
{slider("h", "h dalle", "mm", 2.5, 500, 2.5)}

          
{slider("a", "a (axe acier)", "mm", 0, 100, 0.5)}

          
{slider("a_s", "As", "mm²/m", 10, 2000, 10)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu & charge</div>

          
{slider("r", "R requis", "min", 15, 240, 30.0)}

          
{slider("m_ed_fi", "MEd,fi", "kN·m/m", 0, 100, 0.25)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Isotherme 500°C — section réduite" vbW={400} vbH={200}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={200 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const H = 140, y0 = 30, sc = H / inputs.h;
                const a500Px = Math.min(result.a500 * sc, H);
                const aPx = inputs.a * sc;
                return (
                  <g>
                    <rect x={80} y={y0} width={240} height={H} fill="#DBEAFE" stroke="#64748B" strokeWidth={2} />
                    <rect x={80} y={y0 + H - a500Px} width={240} height={a500Px} fill="#EF4444" opacity={0.45} />
                    <line x1={70} y1={y0 + H - aPx} x2={330} y2={y0 + H - aPx} stroke="#F59E0B" strokeWidth={3} />
                    <text x={335} y={y0 + H - aPx + 4} fontSize={10} fill="#F59E0B">As θs={result.theta_s.toFixed(0)}°</text>
                    <text x={200} y={y0 + H + 16} fontSize={10} fill="#EF4444" textAnchor="middle">zone &gt;500°C écartée (a500={result.a500.toFixed(0)} mm)</text>
                    <text x={200} y={y0 - 8} fontSize={10} fill="#CBD5E1" textAnchor="middle">🔥 R{inputs.r} — θg={result.theta_g.toFixed(0)}°C</text>
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
              { label: 'θs', value: res.theta_s.toFixed(0), unit: '°C', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'ks', value: res.ks.toFixed(2), unit: '', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'MRd,fi', value: res.m_rd_fi.toFixed(1), unit: 'kN·m/m', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'a500', value: res.a500.toFixed(0), unit: 'mm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Dalle au feu (isotherme 500)"
                latex={String.raw`M_{Rd,fi} = \sum A_s k_s(\theta) f_{yk} z / \gamma_{s,fi}`}
                description="EC2-1-2, méthode analytique"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{Rd,fi}`, meaning: "Capacité à chaud", value: res.m_rd_fi.toFixed(1), unit: "kN·m/m" },
                  { symbol: String.raw`k_s`, meaning: "Réduction acier", value: res.ks.toFixed(2) },
                  { symbol: String.raw`\theta_s`, meaning: "Température acier", value: res.theta_s.toFixed(0), unit: "°C" },
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
