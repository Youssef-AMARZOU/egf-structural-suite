import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { TraveeToutesChargesInputs, TraveeToutesChargesOutput } from '../../types/engineering';

export default function Module216() {
  const [inputs, setInputs] = useState<TraveeToutesChargesInputs>({
    l: 6, ei: 30000, q: 15, p_vals: [50, 30], p_pos: [2, 4.5], m_vals: [], m_pos: [],
  });
  const [text, setText] = useState({ ps: '50:2, 30:4.5', ms: '' });
  const parsePairs = (s: string): [number[], number[]] => {
    const v: number[] = [], pos: number[] = [];
    s.split(',').map(t => t.trim()).filter(t => t.length > 0).forEach(t => {
      const [a, b] = t.split(':').map(x => parseFloat(x));
      if (!isNaN(a) && !isNaN(b)) { v.push(a); pos.push(b); }
    });
    return [v, pos];
  };
  const [p_vals, p_pos] = parsePairs(text.ps);
      const [m_vals, m_pos] = parsePairs(text.ms);
      const full = { ...inputs, p_vals, p_pos, m_vals, m_pos };
  const { data: res, error: err, live } = useModuleCalc<TraveeToutesChargesInputs, TraveeToutesChargesOutput>('calculate_travee_toutes_charges_216', full);
  type NumKey = { [K in keyof TraveeToutesChargesInputs]: TraveeToutesChargesInputs[K] extends number ? K : never }[keyof TraveeToutesChargesInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 216 — Travée toutes charges"
      subtitle="Isostatique — q + charges P:a + couples C:a, diagrammes V/M/flèche"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travée</div>

          
{slider("l", "L", "m", 0.1, 20, 0.1)}

          
{slider("ei", "EI", "kN·m²", 5000, 100000, 1000.0)}

          
{slider("q", "q uniforme", "kN/m", 0, 50, 0.25)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges (format P:a, séparées par virgules)</div>

          <label className="block text-sm font-medium text-gray-700 mb-1">Forces P:a (kN:m)</label>
          <input className="w-full border rounded px-3 py-2 text-sm mb-3" value={text.ps}
            onChange={e => setText({ ...text, ps: e.target.value })} placeholder="50:2, 30:4.5" />
          <label className="block text-sm font-medium text-gray-700 mb-1">Couples horaires C:a (kN·m:m)</label>
          <input className="w-full border rounded px-3 py-2 text-sm" value={text.ms}
            onChange={e => setText({ ...text, ms: e.target.value })} placeholder="20:3" />
        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Diagramme M (kN·m)" vbW={400} vbH={200}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={200 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const mMax = Math.max(...result.ms.map(v => Math.abs(v)), 0.01);
                const X = (x: number) => 30 + (x / inputs.l) * 340;
                const Y = (m: number) => 40 + (m / mMax) * 90;
                return (
                  <>
                    <line x1={30} y1={40} x2={370} y2={40} stroke="#64748B" />
                    <line x1={30} y1={40} x2={30} y2={170} stroke="#64748B" />
                    <DiagramOverlay type="moment" points={result.xs.map((x, i) => [X(x), Y(result.ms[i])] as [number, number])} fill zeroY={40} closeX={[X(result.xs[0]), X(result.xs[result.xs.length - 1])]} />
                    <text x={X(result.x_mmax)} y={Y(result.m_max) + 16} fontSize={10} fill="#1D4ED8" textAnchor="middle">Mmax={result.m_max.toFixed(1)}</text>
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
              { label: 'RA / RB', value: `${res.ra.toFixed(0)} / ${res.rb.toFixed(0)}`, unit: 'kN', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Mmax', value: res.m_max.toFixed(1), unit: 'kN·m', color: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Vmax', value: res.v_max.toFixed(0), unit: 'kN', color: 'bg-orange-50 dark:bg-orange-900/20' },
              { label: 'Flèche', value: res.y_max.toFixed(1), unit: 'mm', color: 'bg-slate-100 dark:bg-white/5' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500 dark:text-slate-400">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400 dark:text-slate-500">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Travée isostatique"
                latex={String.raw`R_A + R_B = Q \quad M(x),\,V(x)`}
                description="Toutes charges, double intégration"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`R_A/R_B`, meaning: "Réactions", value: `${res.ra.toFixed(0)} / ${res.rb.toFixed(0)}`, unit: "kN" },
                  { symbol: String.raw`M_{max}`, meaning: "Moment maximal", value: res.m_max.toFixed(1), unit: "kN·m" },
                  { symbol: String.raw`y_{max}`, meaning: "Flèche maximale", value: res.y_max.toFixed(1), unit: "mm" },
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
