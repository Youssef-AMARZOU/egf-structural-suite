import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PoutresCroiseesInputs, PoutresCroiseesOutput } from '../../types/engineering';

export default function Module215() {
  const [inputs, setInputs] = useState<PoutresCroiseesInputs>({
    la: 6, lb: 8, eia: 30000, eib: 30000, q: 100, qa: 10, qb: 10,
  });
  const { data: res, error: err, live } = useModuleCalc<PoutresCroiseesInputs, PoutresCroiseesOutput>('calculate_poutres_croisees_215', inputs);
  type NumKey = { [K in keyof PoutresCroiseesInputs]: PoutresCroiseesInputs[K] extends number ? K : never }[keyof PoutresCroiseesInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 215 — Poutres croisées"
      subtitle="Répartition de Q au croisement par égalité des flèches"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">File A</div>

          
{slider("la", "La", "m", 0.1, 20, 0.1)}

          
{slider("eia", "EIa", "kN·m²", 5000, 100000, 1000.0)}

          
{slider("qa", "qa uniforme", "kN/m", 0, 25.0, 0.1)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">File B & charge</div>

          
{slider("lb", "Lb", "m", 0.1, 20, 0.1)}

          
{slider("eib", "EIb", "kN·m²", 5000, 100000, 1000.0)}

          
{slider("qb", "qb uniforme", "kN/m", 0, 25.0, 0.1)}

          
{slider("q", "Q croisement", "kN", 0, 250.0, 1)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Grillage — vue en plan" vbW={400} vbH={240}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={240 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              <line x1={40} y1={120} x2={360} y2={120} stroke="#1D4ED8" strokeWidth={8} />
              <line x1={200} y1={30} x2={200} y2={210} stroke="#7C3AED" strokeWidth={8} />
              <circle cx={200} cy={120} r={12} fill="#EF4444" />
              <text x={200} y={112} fontSize={10} fill="#fff" textAnchor="middle">Q</text>
              <text x={110} y={110} fontSize={11} fill="#1D4ED8">QA={result.qa_pt.toFixed(0)}</text>
              <text x={215} y={70} fontSize={11} fill="#7C3AED">QB={result.qb_pt.toFixed(0)}</text>
              <text x={40} y={140} fontSize={10} fill="#333">La={inputs.la} m</text>
              <text x={300} y={225} fontSize={10} fill="#333">Lb={inputs.lb} m</text>
              <text x={200} y={228} fontSize={10} fill="#333" textAnchor="middle">y={result.y.toFixed(1)} mm</text>
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
              { label: 'QA', value: res.qa_pt.toFixed(1), unit: 'kN', color: 'bg-blue-50' },
              { label: 'QB', value: res.qb_pt.toFixed(1), unit: 'kN', color: 'bg-purple-50' },
              { label: 'MA / MB', value: `${res.m_a.toFixed(0)} / ${res.m_b.toFixed(0)}`, unit: 'kN·m', color: 'bg-orange-50' },
              { label: 'y', value: res.y.toFixed(1), unit: 'mm', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Poutres croisées"
                latex={String.raw`f_A = f_B`}
                description="Compatibilité des flèches"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`Q_A`, meaning: "Charge reprise file A", value: res.qa_pt.toFixed(1), unit: "kN/m" },
                  { symbol: String.raw`Q_B`, meaning: "Charge reprise file B", value: res.qb_pt.toFixed(1), unit: "kN/m" },
                  { symbol: String.raw`y`, meaning: "Flèche au croisement", value: res.y.toFixed(1), unit: "mm" },
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
