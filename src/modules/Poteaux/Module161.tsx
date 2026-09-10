import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, StressStrainBlock } from '../../components/drafting';
import { PourcentMiniSectQQInputs, PourcentMiniSectQQOutput } from '../../types/engineering';

export default function Module161() {
  const [inp, setInp] = useState<PourcentMiniSectQQInputs>({
    trapezes: [{ b1: 300, b2: 300, h: 500 }],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  });
  const { data: res, error: err, live } = useModuleCalc<PourcentMiniSectQQInputs, PourcentMiniSectQQOutput>(
    'calculate_pourcent_mini_sect_qq_161', inp,
  );
  const S = (k: keyof PourcentMiniSectQQInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addTrapeze = () => setInp({ ...inp, trapezes: [...inp.trapezes, { b1: 300, b2: 300, h: 200 }] });
  const removeTrapeze = (i: number) => setInp({ ...inp, trapezes: inp.trapezes.filter((_, j) => j !== i) });
  const updateTrapeze = (i: number, field: string, v: number) => {
    const t = [...inp.trapezes];
    (t[i] as any)[field] = v;
    setInp({ ...inp, trapezes: t });
  };

  const status = !res ? 'computing' : res.as_min_pct >= 0.30 ? 'fail' : res.as_min_pct >= 0.15 ? 'warn' : 'pass';

  const slider = (
    key: keyof PourcentMiniSectQQInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="161 Pourcentage mini sect QQ"
      subtitle="Armature minimum — section arbitraire (BAEL §C3.3.4 / EC2 §9.2.1.1) — RUST"
      eurocode="EC2 §9.2.1.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie — Trapèzes</div>
          {inp.trapezes.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Trapèze {i + 1}</span>
                {inp.trapezes.length > 1 && (
                  <button onClick={() => removeTrapeze(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="b1" unit="mm" value={t.b1} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'b1', v)} />
              <ParamSlider label="b2" unit="mm" value={t.b2} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'b2', v)} />
              <ParamSlider label="h" unit="mm" value={t.h} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'h', v)} />
            </div>
          ))}
          <button onClick={addTrapeze} className="text-blue-600 text-sm mt-1">+ Ajouter trapèze</button>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section — armature minimum" vbW={500} vbH={200}>
            {res && (() => {
              const maxB = Math.max(...inp.trapezes.map(t => Math.max(t.b1, t.b2)));
              const ht = res.ht;
              const scX = 150 / maxB;
              const scY = 150 / ht;
              const ox = 230;
              const oy = 25;
              const pts = inp.trapezes.map((t, i) => {
                const y1 = oy + i * t.h * scY;
                const y2 = oy + (i + 1) * t.h * scY;
                return `${ox - t.b1 * scX},${y1} ${ox + t.b1 * scX},${y1} ${ox + t.b2 * scX},${y2} ${ox - t.b2 * scX},${y2}`;
              }).join(' ');
              const leftEdge = ox - maxB * scX;
              const barY = oy + (res.ht - res.y_bar) * scY;
              return (
                <>
                  <polygon points={pts} fill="#e0e7ff" stroke="#6366F1" strokeWidth={2} />
                  <StressStrainBlock x={leftEdge} yTop={oy} hPx={ht * scY} xNa={res.x_neutral * scY} wPx={40} />
                  <line x1={ox - 100} y1={barY} x2={ox + 100} y2={barY} stroke="#22C55E" strokeWidth={1.5} strokeDasharray="4,4" />
                  <text x={ox + 105} y={barY + 4} fontSize={10} fill="#22C55E">y̅</text>
                  <rect x={ox - 40} y={oy + (res.ht - 30) * scY} width={80} height={6} fill="#6366F1" rx={2} />
                  <text x={ox} y={oy + (res.ht - 25) * scY} fontSize={9} fill="#6366F1" textAnchor="middle">As_min</text>
                  <text x={ox} y={190} fontSize={10} fill="#374151" textAnchor="middle">
                    {res.as_min.toFixed(0)} mm² ({res.as_min_pct.toFixed(3)}%)
                  </text>
                </>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['h totale', `${res.ht.toFixed(0)} mm`],
                  ['y̅', `${res.y_bar.toFixed(1)} mm`],
                  ['Ig', `${res.i_g.toExponential(2)} mm⁴`],
                  ['Mcr', `${(res.mcr / 1e6).toFixed(1)} kN·m`],
                  ['As_min', `${res.as_min.toFixed(0)} mm²`],
                  ['As/Ac', `${res.as_min_pct.toFixed(3)} %`],
                  ['x (NA)', `${res.x_neutral.toFixed(1)} mm`],
                  ['z', `${res.lever_arm.toFixed(1)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Mini armatures QQ"
                latex={String.raw`M_{cr} \le M_{Rd}(A_{s,min})`}
                description="Recherche dichotomique"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{cr}`, meaning: 'Fissuration', value: (res.mcr / 1e6).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`A_{s,min}`, meaning: 'Section minimale', value: res.as_min.toFixed(0), unit: 'mm²' },
                  { symbol: String.raw`A_s/A_c`, meaning: 'Ratio', value: res.as_min_pct.toFixed(3), unit: '%' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${
                res.as_min_pct < 0.15 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'
                : res.as_min_pct < 0.30 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {res.diag.map((d: string, i: number) => (
                  <li key={i} className="font-mono text-slate-600 dark:text-slate-400">{d}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
