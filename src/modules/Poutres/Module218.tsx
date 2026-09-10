import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { CorbeauFdInputs, CorbeauFdOutput } from '../../types/engineering';

export default function Module218() {
  const [inputs, setInputs] = useState<CorbeauFdInputs>({
    f_ed: 300, h_ed: 60, av: 200, ac: 150, b: 300, hc: 500, d: 450, lb: 150, asm: 1200, fck: 30, fyk: 500,
  });
  const { data: res, error: err, live } = useModuleCalc<CorbeauFdInputs, CorbeauFdOutput>('calculate_corbeau_fd_218', inputs);
  const ok = res ? res.verdict.startsWith('Cas') && res.bearing <= 1 : false;
  type NumKey = { [K in keyof CorbeauFdInputs]: CorbeauFdInputs[K] extends number ? K : never }[keyof CorbeauFdInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : ok ? 'pass' : 'fail';
  return (
    <Workstation
      title="Module 218 — Corbeau (FD P 18-717)"
      subtitle="Bielles-tirants — tirant principal + 5 cas de ferraillage"
      eurocode="FD P 18-717"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges & géométrie</div>

          
{slider("f_ed", "FEd", "kN", 0, 1000, 10)}

          
{slider("h_ed", "HEd", "kN", 0, 300, 5)}

          
{slider("av", "av", "mm", 50, 500, 10)}

          
{slider("ac", "ac", "mm", 50, 400, 10)}

          
{slider("b", "b", "mm", 5, 1000, 5)}

          
{slider("hc", "hc", "mm", 200, 1000, 10)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Appui & matériaux</div>

          
{slider("d", "d", "mm", 5, 2000, 5)}

          
{slider("lb", "lb appui", "mm", 50, 400, 10)}

          
{slider("asm", "Asm placé", "mm²", 20, 5000, 20)}

          
{slider("fck", "fck", "MPa", 12, 90, 1)}

          
{slider("fyk", "fyk", "MPa", 400, 600, 5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title={`Bielle-tirant (cas ${res?.cas})`} vbW={400} vbH={220}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={220 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const x0 = 60, w = 140, H = 150, y0 = 40;
                return (
                  <g>
                    <rect x={x0} y={y0} width={60} height={170} fill="#E2E8F0" stroke="#333" strokeWidth={2} />
                    <polygon points={`${x0 + 60},${y0 + 20} ${x0 + 60 + w},${y0 + 20} ${x0 + 60 + w},${y0 + 20 + H} ${x0 + 60},${y0 + 20 + H}`} fill="#F1F5F9" stroke="#333" strokeWidth={2} />
                    <line x1={x0 + 60 + w - 30} y1={y0 + 20} x2={x0 + 60 + w - 30} y2={y0 + 5} stroke="#333" strokeWidth={3} />
                    <line x1={x0 + 60 + w - 55} y1={y0 + 5} x2={x0 + 60 + w - 5} y2={y0 + 5} stroke="#333" strokeWidth={4} />
                    <text x={x0 + 60 + w - 30} y={y0 - 2} fontSize={10} textAnchor="middle">FEd</text>
                    <line x1={x0 + 60 + w - 30} y1={y0 + 20} x2={x0 + 65} y2={y0 + 20 + H - 15} stroke="#3B82F6" strokeWidth={5} />
                    <line x1={x0 + 65} y1={y0 + 20 + 8} x2={x0 + 60 + w - 30} y2={y0 + 20 + 8} stroke="#EF4444" strokeWidth={3} />
                    <text x={x0 + 60 + w / 2} y={y0 + 36} fontSize={10} fill="#EF4444" textAnchor="middle">tirant As={result.as_main_req.toFixed(0)}</text>
                    <text x={x0 + 30} y={y0 + 200} fontSize={10} fill="#333" textAnchor="middle">poteau</text>
                    <text x={330} y={200} fontSize={10} fill="#1D4ED8" textAnchor="middle">{result.cas_label.split(':')[0]}</text>
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
              { label: 'Cas', value: String(res.cas), unit: '', color: 'bg-blue-50' },
              { label: 'As tirant req.', value: res.as_main_req.toFixed(0), unit: 'mm²', color: 'bg-purple-50' },
              { label: 'VRd,c', value: res.vrdc.toFixed(0), unit: 'kN', color: 'bg-orange-50' },
              { label: 'Appui', value: (res.bearing * 100).toFixed(0), unit: '%', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Corbeau FD P18-717"
                latex={String.raw`F_{td} = \frac{F_{Ed} a}{z} + H_{Ed}`}
                description="Tirant + nœud CCT"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`A_{s}`, meaning: "Tirant requis", value: res.as_main_req.toFixed(0), unit: "mm²" },
                  { symbol: String.raw`cas`, meaning: "Cas de ferraillage", value: String(res.cas) },
                  { symbol: String.raw`V_{Rd,c}`, meaning: "Bielle béton", value: res.vrdc.toFixed(0), unit: "kN" },
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
