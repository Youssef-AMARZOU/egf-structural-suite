import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PoteauFretteInputs, PoteauFretteOutput } from '../../types/engineering';

export default function Module207() {
  const [inputs, setInputs] = useState<PoteauFretteInputs>({
    d: 500, l: 3, c: 30, phi_sp: 10, s: 60, fck: 30, fyk: 500, as_long: 2500, n_ed: 3000,
  });
  const { data: res, error: err, live } = useModuleCalc<PoteauFretteInputs, PoteauFretteOutput>('calculate_poteau_frette_207', inputs);
  const ok = res ? res.ratio <= 1 : false;
  type NumKey = { [K in keyof PoteauFretteInputs]: PoteauFretteInputs[K] extends number ? K : never }[keyof PoteauFretteInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 207 — Poteau fretté"
      subtitle="Béton confiné EC2 §3.1.9 — spire → σ2 → fck,c → NRd"
      eurocode="EC2 §3.1.9"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>

          
{slider("d", "D poteau", "mm", 5, 2000, 5)}

          
{slider("l", "l0 flambement", "m", 0.05, 10, 0.05)}

          
{slider("c", "Enrobage", "mm", 0.5, 100, 0.5)}

          
{slider("phi_sp", "φ spire", "mm", 6, 20, 1)}

          
{slider("s", "pas s", "mm", 30, 200, 5)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & charge</div>

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

          
{slider("as_long", "As long.", "mm²", 25.0, 10000, 25.0)}

          
{slider("n_ed", "NEd", "kN", 0, 10000, 50)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Coupe — noyau confiné" vbW={400} vbH={220}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={220 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const R = 90, r = R * (result.dc / inputs.d);
                return (
                  <g transform="translate(200,110)">
                    <circle r={R} fill="#E2E8F0" stroke="#333" strokeWidth={2} />
                    <circle r={r} fill="#BFDBFE" stroke="#1D4ED8" strokeWidth={2} strokeDasharray="6,3" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                      <circle key={a} cx={r * 0.8 * Math.cos(a * Math.PI / 180)} cy={r * 0.8 * Math.sin(a * Math.PI / 180)} r={5} fill="#EF4444" />
                    ))}
                    <text y={R + 18} fontSize={10} fill="#1D4ED8" textAnchor="middle">fck,c={result.fck_c.toFixed(1)} MPa</text>
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
          <div className={`p-3 rounded font-semibold ${ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'fck,c', value: res.fck_c.toFixed(1), unit: 'MPa', color: 'bg-blue-50' },
              { label: 'NRd', value: res.n_rd.toFixed(0), unit: 'kN', color: 'bg-purple-50' },
              { label: 'σ2', value: res.sigma2.toFixed(2), unit: 'MPa', color: 'bg-orange-50' },
              { label: 'ρw', value: res.rho_w.toFixed(2), unit: '%', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Béton confiné (EC2 §3.1.9)"
                latex={String.raw`f_{ck,c} = f_{ck}(1 + 5\sigma_2/f_{ck})`}
                description="Frettage par spires"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f_{ck,c}`, meaning: "Béton confiné", value: res.fck_c.toFixed(1), unit: "MPa" },
                  { symbol: String.raw`N_{Rd}`, meaning: "Résistance", value: res.n_rd.toFixed(0), unit: "kN" },
                  { symbol: String.raw`\tau`, meaning: "Taux", value: res.ratio.toFixed(2) },
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
