import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { VoilePortiqueRdcInputs, VoilePortiqueRdcOutput } from '../../types/engineering';

export default function Module200() {
  const [inputs, setInputs] = useState<VoilePortiqueRdcInputs>({
    l_wall: 5, t: 0.2, h: 15, e_mpa: 33000, qh: 10, q_top: 50, rho_open: 0.25,
  });
  const sc = 300 / Math.max(inputs.h, 1);
  const wW = Math.max(inputs.l_wall * 28, 40);
  const { data: res, error: err, live } = useModuleCalc<VoilePortiqueRdcInputs, VoilePortiqueRdcOutput>('calculate_voile_portique_rdc_200', inputs);
  type NumKey = { [K in keyof VoilePortiqueRdcInputs]: VoilePortiqueRdcInputs[K] extends number ? K : never }[keyof VoilePortiqueRdcInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 200 — Voile + Portique RDC (I équivalente)"
      subtitle="Inertie équivalente d'un voile percé sur RDC ouvert — flèche cantilever flexion + cisaillement"
      eurocode="EC2 §7.4"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Voile</div>

          
{slider("l_wall", "L voile", "m", 0, 20, 0.05)}

          
{slider("t", "épaisseur", "m", 0.1, 0.6, 0.05)}

          
{slider("h", "Hauteur", "m", 0.25, 50, 0.25)}

          
{slider("e_mpa", "E béton", "MPa", 0, 100000, 100.0)}

          
{slider("rho_open", "ρ ouvertures", "", 0, 0.8, 0.05)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Chargement vent</div>

          
{slider("qh", "qh uniforme", "kN/m", 0, 25.0, 0.1)}

          
{slider("q_top", "Q tête", "kN", 0, 200, 0.5)}

        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Schéma voile cantilever" vbW={400} vbH={340}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={340 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              <rect x={190 - wW / 2} y={320 - inputs.h * sc} width={wW} height={inputs.h * sc} fill="#DBEAFE" stroke="#1D4ED8" strokeWidth={2} />
              <line x1={60} y1={320} x2={340} y2={320} stroke="#333" strokeWidth={3} />
              <line x1={30} y1={320 - inputs.h * sc} x2={30} y2={320} stroke="#EF4444" strokeWidth={2} markerEnd="url(#a200)" />
              <text x={14} y={320 - (inputs.h * sc) / 2} fontSize={10} fill="#EF4444">qh</text>
              <line x1={190 - wW / 2 - 40} y1={320 - inputs.h * sc} x2={190 - wW / 2} y2={320 - inputs.h * sc} stroke="#F59E0B" strokeWidth={2} markerEnd="url(#a200)" />
              <text x={90} y={310 - inputs.h * sc} fontSize={10} fill="#F59E0B">Q={inputs.q_top}</text>
              <text x={190} y={332} fontSize={10} fill="#1D4ED8" textAnchor="middle">Iéq={result.i_eq.toFixed(3)} m⁴</text>
              <DimensionLine x1={190 - wW / 2} y1={320 - inputs.h * sc} x2={190 - wW / 2} y2={320} offset={-28} text={`H = ${inputs.h} m`} />
              <defs><marker id="a200" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#333" /></marker></defs>
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
              { label: 'I gross', value: res.i_gross.toFixed(3), unit: 'm⁴', color: 'bg-blue-50' },
              { label: 'I éq', value: res.i_eq.toFixed(3), unit: 'm⁴', color: 'bg-purple-50' },
              { label: 'δ réf', value: res.delta_ref.toFixed(1), unit: 'mm', color: 'bg-orange-50' },
              { label: 'M base', value: res.m_base.toFixed(0), unit: 'kN·m', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Voile + portique RDC"
                latex={String.raw`v = \frac{f_{top}}{H} \le \frac{1}{500}`}
                description="Dérive + inertie équivalente"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`I_{eq}`, meaning: "Inertie équivalente", value: res.i_eq.toFixed(3), unit: "m⁴" },
                  { symbol: String.raw`\delta`, meaning: "Flèche de référence", value: res.delta_ref.toFixed(1), unit: "mm" },
                  { symbol: String.raw`M_{base}`, meaning: "Moment en pied", value: res.m_base.toFixed(0), unit: "kN·m" },
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
