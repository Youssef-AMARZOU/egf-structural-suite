import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { ClasseExpositionInputs, ClasseExpositionOutput } from '../../types/engineering';

const CLASSES = ['X0','XC1','XC2','XC3','XC4','XD1','XD2','XD3','XS1','XS2','XS3','XF1','XF2','XF3','XF4','XA1','XA2','XA3'];

export default function Module203() {
  const [inputs, setInputs] = useState<ClasseExpositionInputs>({
    expo: 4, fck: 30, duree: 50, dalle: false, liant: false,
  });
  const { data: res, error: err, live } = useModuleCalc<ClasseExpositionInputs, ClasseExpositionOutput>('calculate_classe_exposition_203', inputs);
  type NumKey = { [K in keyof ClasseExpositionInputs]: ClasseExpositionInputs[K] extends number ? K : never }[keyof ClasseExpositionInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 203 — Classes d'exposition"
      subtitle="NF EN 206 / EC2 §4 — béton mini, classe structurale, enrobage cnom"
      eurocode="EC2 §4"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Exposition</div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Classe</span>
            <select value={inputs.expo} onChange={e => setInputs({ ...inputs, expo: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono">
              {CLASSES.map((c, i) => <option key={c} value={i}>{c}</option>)}
            </select>
          </label>
          
{slider("fck", "fck prévu", "MPa", 12, 90, 1)}

          
{slider("duree", "Durée projet", "ans", 5, 100, 1.0)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Options</div>

          <label className="flex items-center gap-2 text-sm py-1">
            <input type="checkbox" checked={inputs.dalle} onChange={e => setInputs({ ...inputs, dalle: e.target.checked })} />
            Élément de type dalle (S−1)
          </label>
          <label className="flex items-center gap-2 text-sm py-1">
            <input type="checkbox" checked={inputs.liant} onChange={e => setInputs({ ...inputs, liant: e.target.checked })} />
            Liant spécial XC + fck≥35 (S−1)
          </label>
        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Enrobage nominal" vbW={400} vbH={140}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={140 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              <rect x={60} y={20} width={280} height={100} fill="#E2E8F0" stroke="#64748B" strokeWidth={2} />
              <rect x={60 + result.cnom * 1.2} y={20 + result.cnom * 0.5} width={280 - result.cnom * 2.4} height={100 - result.cnom} fill="#BFDBFE" stroke="#1D4ED8" strokeDasharray="5,3" />
              <line x1={60} y1={130} x2={60 + result.cnom * 1.2} y2={130} stroke="#EF4444" strokeWidth={2} />
              <text x={60} y={142} fontSize={10} fill="#EF4444">cnom={result.cnom.toFixed(0)} mm</text>
              <text x={200} y={75} fontSize={11} fill="#1D4ED8" textAnchor="middle">{result.classe} — S{result.s_class}</text>
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
              { label: 'Classe struct.', value: `S${res.s_class}`, unit: '', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'cmin,dur', value: res.cmin_dur.toFixed(0), unit: 'mm', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'cnom', value: res.cnom.toFixed(0), unit: 'mm', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'fck mini', value: `C${res.fck_min.toFixed(0)}`, unit: '', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Enrobage (EC2 §4)"
                latex={String.raw`c_{nom} = c_{min} + \Delta c_{dev}`}
                description="Classes d'exposition NF EN 206"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`c_{nom}`, meaning: "Enrobage nominal", value: res.cnom.toFixed(0), unit: "mm" },
                  { symbol: String.raw`S`, meaning: "Classe structurale", value: `S${res.s_class}` },
                  { symbol: String.raw`f_{ck,min}`, meaning: "Béton minimal", value: `C${res.fck_min.toFixed(0)}` },
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
