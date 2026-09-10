import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { PortiqueTraversesRigidesInputs, PortiqueTraversesRigidesOutput } from '../../types/engineering';

export default function Module201() {
  const [inputs, setInputs] = useState<PortiqueTraversesRigidesInputs>({
    n: 5, h: 15, fo: 20, i_col: 0.005, e_mpa: 33000, kco: 0,
  });
  const nLv = Math.max(inputs.n, 1);
  const H = 260, W = 200, x0 = 110, hs = H / nLv;
  const { data: res, error: err, live } = useModuleCalc<PortiqueTraversesRigidesInputs, PortiqueTraversesRigidesOutput>('calculate_portique_traverses_rigides_201', inputs);
  const ROUND: Set<string> = new Set(["kco", "n"]);
  type NumKey = { [K in keyof PortiqueTraversesRigidesInputs]: PortiqueTraversesRigidesInputs[K] extends number ? K : never }[keyof PortiqueTraversesRigidesInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 201 — Portique à traverses rigides"
      subtitle="Poutre de cisaillement + voile équivalent (égalité des flèches, DFM minimal)"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Portique</div>

          
{slider("n", "n étages", "", 1, 15, 1.0)}

          
{slider("h", "Hauteur totale", "m", 0.25, 50, 0.25)}

          
{slider("fo", "Fo par plancher", "kN", 0, 50, 0.25)}

          
{slider("i_col", "ΣIc / étage", "m⁴", 0.001, 0.02, 0.001)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Réglages</div>

          
{slider("e_mpa", "E béton", "MPa", 0, 100000, 100.0)}

          
{slider("kco", "kco imposé (0=auto)", "", 0, 5, 1.0)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title={`Schéma portique (${nLv} niveaux, traverses rigides)`} vbW={400} vbH={300}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={300 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {Array.from({ length: nLv + 1 }, (_, i) => (
                <line key={i} x1={x0 - W / 2} y1={280 - i * hs} x2={x0 + W / 2} y2={280 - i * hs}
                  stroke={i === 0 ? '#333' : '#1D4ED8'} strokeWidth={i === 0 ? 3 : 4} />
              ))}
              <line x1={x0 - W / 2} y1={280 - H} x2={x0 - W / 2} y2={280} stroke="#64748B" strokeWidth={3} />
              <line x1={x0 + W / 2} y1={280 - H} x2={x0 + W / 2} y2={280} stroke="#64748B" strokeWidth={3} />
              {Array.from({ length: nLv }, (_, i) => (
                <g key={i}>
                  <line x1={x0 + W / 2} y1={280 - (i + 0.5) * hs} x2={x0 + W / 2 + 60} y2={280 - (i + 0.5) * hs} stroke="#EF4444" strokeWidth={1.5} />
                  <text x={x0 + W / 2 + 62} y={283 - (i + 0.5) * hs} fontSize={9} fill="#EF4444">Fo</text>
                </g>
              ))}
              <text x={x0} y={295} fontSize={10} fill="#333" textAnchor="middle">Iéq={result.i_eq.toFixed(4)} m⁴</text>
              <DimensionLine x1={x0 - W / 2} y1={280 - H} x2={x0 - W / 2} y2={280} offset={-24} text={`H = ${inputs.h} m`} />
            </>);
    })()}
  </SectionCanvas>
</div>
      </>}
      results={<>
        {res ? (
        <div className="space-y-4">
          <div className={`p-3 rounded font-semibold ${status === 'pass' ? 'bg-green-50 text-green-800' : status === 'fail' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'I éq', value: res.i_eq.toFixed(4), unit: 'm⁴', color: 'bg-blue-50' },
              { label: 'Niveau opti', value: String(res.best_level), unit: '', color: 'bg-purple-50' },
              { label: 'fpo tête', value: res.fpo_top.toFixed(1), unit: 'mm', color: 'bg-orange-50' },
              { label: 'DFM min', value: res.dfm_min.toFixed(1), unit: '', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Raideur d'étage"
                latex={String.raw`K = \frac{12EI}{h^3}`}
                description="Traverses infiniment rigides"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`I_{eq}`, meaning: "Équivalent voile", value: res.i_eq.toFixed(4), unit: "m⁴" },
                  { symbol: String.raw`f_{po}`, meaning: "Flèche portique en tête", value: res.fpo_top.toFixed(1), unit: "mm" },
                  { symbol: String.raw`niv`, meaning: "Niveau optimal", value: String(res.best_level) },
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
