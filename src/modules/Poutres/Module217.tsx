import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { FeuPoutresAnalytiqueInputs, FeuPoutresAnalytiqueOutput } from '../../types/engineering';

export default function Module217() {
  const [inputs, setInputs] = useState<FeuPoutresAnalytiqueInputs>({
    b: 300, h: 500, a: 40, a_s: 1500, fck: 30, fyk: 500, r: 90, m_ed_fi: 120, faces: 3,
  });
  const { data: res, error: err, live } = useModuleCalc<FeuPoutresAnalytiqueInputs, FeuPoutresAnalytiqueOutput>('calculate_feu_poutres_analytique_217', { ...inputs, faces: Math.round(inputs.faces) });
  const ok = res ? res.ratio <= 1 : false;
  const ROUND: Set<string> = new Set(["faces"]);
  type NumKey = { [K in keyof FeuPoutresAnalytiqueInputs]: FeuPoutresAnalytiqueInputs[K] extends number ? K : never }[keyof FeuPoutresAnalytiqueInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 217 — Poutres au feu (analytique)"
      subtitle="EC2-1-2 isotherme 500°C — 1 ou 3 faces exposées"
      eurocode="EC2-1-2"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Poutre</div>

          
{slider("b", "b", "mm", 5, 1000, 5)}

          
{slider("h", "h", "mm", 5, 2000, 5)}

          
{slider("a", "a (axe acier)", "mm", 0, 100, 0.5)}

          
{slider("a_s", "As", "mm²", 25.0, 5000, 25.0)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu & charge</div>

          
{slider("r", "R requis", "min", 15, 240, 30.0)}

          
{slider("m_ed_fi", "MEd,fi", "kN·m", 0, 500, 2)}

          
{slider("faces", "Faces (1 ou 3)", "", 1, 3, 1.0)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title={`Section réduite (${inputs.faces} face(s))`} vbW={400} vbH={220}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={220 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const W = 200, H = 150, x0 = 100, y0 = 35;
                const sx = W / inputs.b, sy = H / inputs.h;
                const a500x = result.a500 * sx, a500y = result.a500 * sy;
                const beffW = Math.max(result.beff * sx, 4);
                return (
                  <g>
                    <rect x={x0} y={y0} width={W} height={H} fill="#DBEAFE" stroke="#64748B" strokeWidth={2} />
                    <rect x={x0} y={y0 + H - a500y} width={W} height={a500y} fill="#EF4444" opacity={0.4} />
                    {inputs.faces === 3 && (
                      <>
                        <rect x={x0} y={y0} width={a500x} height={H} fill="#EF4444" opacity={0.4} />
                        <rect x={x0 + W - a500x} y={y0} width={a500x} height={H} fill="#EF4444" opacity={0.4} />
                      </>
                    )}
                    <rect x={x0 + (W - beffW) / 2} y={y0} width={beffW} height={H - a500y} fill="none" stroke="#1D4ED8" strokeWidth={2} strokeDasharray="6,3" />
                    <line x1={x0 + 10} y1={y0 + H - inputs.a * sy} x2={x0 + W - 10} y2={y0 + H - inputs.a * sy} stroke="#F59E0B" strokeWidth={3} />
                    <text x={200} y={y0 + H + 16} fontSize={10} fill="#CBD5E1" textAnchor="middle">🔥 R{inputs.r} — beff={result.beff.toFixed(0)} mm</text>
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
              { label: 'MRd,fi', value: res.m_rd_fi.toFixed(1), unit: 'kN·m', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'beff', value: res.beff.toFixed(0), unit: 'mm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Poutre au feu (isotherme 500)"
                latex={String.raw`b_{eff} = b - 2a_{500}`}
                description="1 à 3 faces exposées"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{Rd,fi}`, meaning: "Capacité à chaud", value: res.m_rd_fi.toFixed(1), unit: "kN·m" },
                  { symbol: String.raw`b_{eff}`, meaning: "Largeur résiduelle", value: res.beff.toFixed(0), unit: "mm" },
                  { symbol: String.raw`k_s`, meaning: "Réduction acier", value: res.ks.toFixed(2) },
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
