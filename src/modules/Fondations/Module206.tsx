import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import type { ModuleStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PieuForceHorizMomentInputs, PieuForceHorizMomentOutput } from '../../types/engineering';

export default function Module206() {
  const [inputs, setInputs] = useState<PieuForceHorizMomentInputs>({
    b: 0.8, l: 15, e_mpa: 33000, enc: 1, vt: 150, mt: 80, hc: [4, 6, 10], kc: [8, 15, 30],
  });
  const [text, setText] = useState({ hc: '4, 6, 10', kc: '8, 15, 30' });
  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const full = { ...inputs, hc: parseList(text.hc), kc: parseList(text.kc) };
  const { data: res, error: err, live } = useModuleCalc<PieuForceHorizMomentInputs, PieuForceHorizMomentOutput>('calculate_pieu_force_horiz_moment_206', full);
  const ROUND: Set<string> = new Set(["enc"]);
  type NumKey = { [K in keyof PieuForceHorizMomentInputs]: PieuForceHorizMomentInputs[K] extends number ? K : never }[keyof PieuForceHorizMomentInputs];
  const S = (k: NumKey) => (v: number) => setInputs((p) => ({ ...p, [k]: ROUND.has(k as string) ? Math.round(v) : v }));
  const slider = (key: NumKey, label: string, unit: string, min: number, max: number, step: number) => (
    <ParamSlider label={label} unit={unit} value={inputs[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );
  const status: ModuleStatus = !res ? 'computing' : verdictStatus(res.verdict);
  return (
    <Workstation
      title="Module 206 — Pieu : effort horizontal + moment"
      subtitle="Pieu sur sol élastique (Winkler) — λ=(KB/4EI)^¼, tête libre / encastrée"
      eurocode="EC7 §7"
      status={status}
      live={live}
      params={<>
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Pieu & tête</div>

          
{slider("b", "B diamètre", "m", 0.1, 2, 0.1)}

          
{slider("l", "L fiche", "m", 0.25, 50, 0.25)}

          
{slider("e_mpa", "E béton", "MPa", 0, 100000, 100.0)}

          
{slider("enc", "ENC (1=libre,2=encastré)", "", 1, 2, 1.0)}

          
{slider("vt", "VT tête", "kN", 0, 500, 2.5)}

          
{slider("mt", "MT tête", "kN·m", 0, 200, 1)}

        
<div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sol multicouche</div>

          <label className="block text-sm font-medium text-gray-700 mb-1">Épaisseurs hc (m, séparées par virgules)</label>
          <input className="w-full border rounded px-3 py-2 text-sm mb-3" value={text.hc}
            onChange={e => setText({ ...text, hc: e.target.value })} />
          <label className="block text-sm font-medium text-gray-700 mb-1">Modules Kc (MPa/m)</label>
          <input className="w-full border rounded px-3 py-2 text-sm" value={text.kc}
            onChange={e => setText({ ...text, kc: e.target.value })} />
        
{err && (<p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>)}
      </>}
      sketch={<>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Déformée (mm) le long de la fiche" vbW={400} vbH={320}>
    {(() => {
      const result = res;
      if (!result) return (<text x={400 / 2} y={320 / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">computing…</text>);
      return (<>
              {(() => {
                const yMax = Math.max(...result.ys.map(v => Math.abs(v)), 0.01);
                const X = (x: number) => 150 + (result.ys[result.xs.indexOf(x)] / yMax) * 120;
                return (
                  <>
                    <rect x={60} y={10} width={60} height={300} fill="#FEF3C7" stroke="#92400E" opacity={0.6} />
                    <line x1={150} y1={10} x2={150} y2={310} stroke="#1D4ED8" strokeWidth={4} />
                    <polyline points={result.xs.map((x, i) => `${150 + (result.ys[i] / yMax) * 120},${15 + (x / inputs.l) * 290}`).join(' ')}
                      fill="none" stroke="#EF4444" strokeWidth={2} />
                    <line x1={150} y1={15} x2={230} y2={15} stroke="#333" strokeWidth={2} />
                    <text x={235} y={18} fontSize={10}>VT={inputs.vt}</text>
                    <text x={20} y={300} fontSize={10} fill="#92400E">sol Kéq={result.k_eq.toFixed(1)}</text>
                    <text x={Math.min(X(result.x_mmax), 330)} y={20 + (result.x_mmax / inputs.l) * 290} fontSize={9} fill="#EF4444">Mmax</text>
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
          <div className={`p-3 rounded font-semibold ${status === 'pass' ? 'bg-green-50 text-green-800' : status === 'fail' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>{res.verdict}</div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'y0 tête', value: res.y0.toFixed(1), unit: 'mm', color: 'bg-blue-50' },
              { label: 'Mmax', value: res.m_max.toFixed(0), unit: 'kN·m', color: 'bg-purple-50' },
              { label: 'l0 = 1/λ', value: res.l_elastic.toFixed(2), unit: 'm', color: 'bg-orange-50' },
              { label: 'p max', value: res.p_max.toFixed(0), unit: 'kN/m', color: 'bg-gray-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded p-2 text-center`}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          

          <FormulaCard
                title="Pieu horizontal (Winkler)"
                latex={String.raw`l_c = \sqrt[4]{\frac{4EI}{K_s B}}`}
                description="Sol élastique multicouche"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`y_0`, meaning: "Déplacement en tête", value: res.y0.toFixed(1), unit: "mm" },
                  { symbol: String.raw`M_{max}`, meaning: "Moment maximal", value: res.m_max.toFixed(0), unit: "kN·m" },
                  { symbol: String.raw`l_c`, meaning: "Longueur caractéristique", value: res.l_elastic.toFixed(2), unit: "m" },
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
