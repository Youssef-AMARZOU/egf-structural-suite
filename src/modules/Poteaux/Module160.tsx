import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { InteracSectQQv2Inputs, InteracSectQQv2Output } from '../../types/engineering';

export default function Module160() {
  const [inp, setInp] = useState<InteracSectQQv2Inputs>({
    trapezes: [{ b1: 300, b2: 300, h: 500 }],
    steel_layers: [
      { area: 471, position: 50 },
      { area: 471, position: 450 },
    ],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15, concrete_model: 1, n_points: 30,
  });
  const { data: res, error: err, live } = useModuleCalc<InteracSectQQv2Inputs, InteracSectQQv2Output>(
    'calculate_interac_sect_qq_v2_160', inp,
  );
  const S = (k: keyof InteracSectQQv2Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addTrapeze = () => setInp({ ...inp, trapezes: [...inp.trapezes, { b1: 300, b2: 300, h: 200 }] });
  const removeTrapeze = (i: number) => setInp({ ...inp, trapezes: inp.trapezes.filter((_, j) => j !== i) });
  const updateTrapeze = (i: number, field: string, v: number) => {
    const t = [...inp.trapezes];
    (t[i] as any)[field] = v;
    setInp({ ...inp, trapezes: t });
  };
  const addSteel = () => setInp({ ...inp, steel_layers: [...inp.steel_layers, { area: 200, position: 250 }] });
  const removeSteel = (i: number) => setInp({ ...inp, steel_layers: inp.steel_layers.filter((_, j) => j !== i) });
  const updateSteel = (i: number, field: string, v: number) => {
    const s = [...inp.steel_layers];
    (s[i] as any)[field] = v;
    setInp({ ...inp, steel_layers: s });
  };

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InteracSectQQv2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const nm = (() => {
    if (!res) return null;
    const w = 460, h = 230, padX = 60, padY = 30;
    const ox = padX + w / 2, oy = padY;
    const nMax = res.n_max / 1000;
    const nMin = res.n_min / 1000;
    const mMax = res.m_max / 1000;
    const nRange = Math.max(Math.abs(nMax), Math.abs(nMin), 1);
    const mRange = Math.max(mMax, 1) * 1.15;
    const scaleY = h / nRange;
    const scaleX = w / 2 / mRange;
    const toSvg = (nKN: number, mKNm: number): [number, number] => [
      ox + mKNm * scaleX,
      oy + (nMax - nKN) * scaleY,
    ];
    const pts = res.interaction_curve.map(([n, m]) => toSvg(n / 1000, m / 1000));
    const bx = toSvg(res.n_balance / 1000, res.m_balance / 1000);
    return { pts, bx, w, h, ox, oy, padX, padY, nRange, mRange, nMax, nMin, mMax };
  })();

  return (
    <Workstation
      title="160 Interaction N-M section QQ v2"
      subtitle="EC2/BAEL — Diagramme N-M pour section arbitraire (P-R ou Sargin) — RUST"
      eurocode="EC2 §6.1"
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
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Aciers</div>
          {inp.steel_layers.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Lit {i + 1}</span>
                {inp.steel_layers.length > 1 && (
                  <button onClick={() => removeSteel(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="As" unit="mm²" value={s.area} min={0} max={5000} step={10} onChange={v => updateSteel(i, 'area', v)} />
              <ParamSlider label="y" unit="mm" value={s.position} min={0} max={2000} step={5} onChange={v => updateSteel(i, 'position', v)} />
            </div>
          ))}
          <button onClick={addSteel} className="text-blue-600 text-sm mt-1">+ Ajouter lit</button>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Modèle béton</label>
            <select value={inp.concrete_model} onChange={e => setInp({ ...inp, concrete_model: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15">
              <option value={1}>Parabole-Rectangle</option>
              <option value={2}>Sargin</option>
            </select>
          </div>
          {slider('n_points', 'Points courbe', '', 5, 100, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Diagramme N-M" vbW={600} vbH={320}>
            {res && nm && (() => {
              const curvePath = nm.pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
              const gridN = [0.25, 0.5, 0.75].map(f => ({
                y: nm.oy + nm.h * f,
                label: (nm.nMax - f * nm.nRange).toFixed(0),
              }));
              const gridM = [0.5, 1.0].map(f => ({
                x1: nm.ox - f * nm.mRange * (nm.w / 2 / nm.mRange),
                x2: nm.ox + f * nm.mRange * (nm.w / 2 / nm.mRange),
                label: f * nm.mRange,
              }));
              return (
                <>
                  {gridN.map((g, i) => (
                    <g key={`n${i}`}>
                      <line x1={nm.padX} y1={g.y} x2={600 - nm.padX} y2={g.y} stroke="#475569" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.4} />
                      <text x={nm.padX - 4} y={g.y + 3} fontSize={8} fill="#64748b" textAnchor="end">{g.label}</text>
                    </g>
                  ))}
                  {gridM.map((g, i) => (
                    <g key={`m${i}`}>
                      <line x1={g.x1} y1={nm.oy} x2={g.x1} y2={nm.oy + nm.h} stroke="#475569" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
                      <line x1={g.x2} y1={nm.oy} x2={g.x2} y2={nm.oy + nm.h} stroke="#475569" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
                      <text x={g.x2} y={nm.oy + nm.h + 14} fontSize={8} fill="#64748b" textAnchor="middle">{g.label.toFixed(0)}</text>
                      <text x={g.x1} y={nm.oy + nm.h + 14} fontSize={8} fill="#64748b" textAnchor="middle">{(-g.label).toFixed(0)}</text>
                    </g>
                  ))}
                  <line x1={nm.ox} y1={nm.oy} x2={nm.ox} y2={nm.oy + nm.h} stroke="#94a3b8" strokeWidth={1} />
                  <line x1={nm.padX} y1={nm.oy + nm.h} x2={600 - nm.padX} y2={nm.oy + nm.h} stroke="#94a3b8" strokeWidth={1} />
                  <text x={nm.ox + 4} y={nm.oy - 8} fontSize={10} fill="#94a3b8" fontWeight="bold">N (kN)</text>
                  <text x={600 - nm.padX + 4} y={nm.oy + nm.h + 4} fontSize={10} fill="#94a3b8" fontWeight="bold">M (kN·m)</text>
                  <text x={nm.ox + 5} y={nm.oy + 14} fontSize={9} fill="#64748b">{nm.nMax.toFixed(0)} kN</text>
                  <text x={nm.ox + 5} y={nm.oy + nm.h - 6} fontSize={9} fill="#64748b">{nm.nMin.toFixed(0)} kN</text>
                  <path d={curvePath} fill="#3b82f6" fillOpacity={0.12} stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
                  <circle cx={nm.bx[0]} cy={nm.bx[1]} r={5} fill="#EF4444" stroke="#fff" strokeWidth={1.5} />
                  <text x={nm.bx[0] + 10} y={nm.bx[1] - 8} fontSize={9} fill="#EF4444" fontWeight="bold">Pivot ({(res.n_balance / 1000).toFixed(0)} kN, {(res.m_balance / 1000).toFixed(1)} kN·m)</text>
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
                  ['y̅', `${res.centroid.toFixed(1)} mm`],
                  ['N_max', `${(res.n_max / 1000).toFixed(0)} kN`],
                  ['N_min', `${(res.n_min / 1000).toFixed(0)} kN`],
                  ['M_max', `${(res.m_max / 1000).toFixed(1)} kN·m`],
                  ['N_bal', `${(res.n_balance / 1000).toFixed(0)} kN`],
                  ['M_bal', `${(res.m_balance / 1000).toFixed(1)} kN·m`],
                  ['Points', res.interaction_curve.length.toString()],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Interaction QQ v2"
                latex={String.raw`N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}`}
                description="Béton P-R + Sargin"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_{Rd,max}`, meaning: 'Effort normal max', value: (res.n_max / 1000).toFixed(0), unit: 'kN' },
                  { symbol: String.raw`M_{Rd,max}`, meaning: 'Moment max', value: (res.m_max / 1000).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`M_{bal}`, meaning: 'Moment équilibré', value: (res.m_balance / 1000).toFixed(1), unit: 'kN·m' },
                ]}
              />
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-semibold">
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
