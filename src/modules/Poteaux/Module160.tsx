import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
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

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InteracSectQQv2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const nm = (() => {
    if (!res) return null;
    const w = 500, h = 250, ox = 300, oy = 20;
    const scaleN = h / Math.max(Math.abs(res.n_max), Math.abs(res.n_min), 1);
    const scaleM = w / 2 / Math.max(res.m_max, 1);
    const pts: [number, number][] = res.interaction_curve.map(([n, m]) => (
      [ox + m / 1e6 * scaleM, oy + (res.n_max - n) / (res.n_max - res.n_min) * h] as [number, number]
    ));
    const bx = ox + res.m_balance / 1e6 * scaleM;
    const by = oy + (res.n_max - res.n_balance) / (res.n_max - res.n_min) * h;
    return { pts, bx, by, w, h, ox, oy };
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
          <SectionCanvas title="Diagramme N-M" vbW={600} vbH={300}>
            {res && nm && (
              <>
                <text x={nm.ox} y={15} fontSize={11} fill="#374151" textAnchor="middle">N (kN)</text>
                <text x={580} y={nm.oy + nm.h / 2} fontSize={11} fill="#374151" textAnchor="end">M (kN·m)</text>
                <line x1={nm.ox} y1={nm.oy} x2={nm.ox} y2={nm.oy + nm.h} stroke="#ccc" />
                <line x1={nm.ox - nm.w / 2} y1={nm.oy + nm.h} x2={nm.ox + nm.w / 2} y2={nm.oy + nm.h} stroke="#ccc" />
                <DiagramOverlay type="moment" points={nm.pts} />
                <circle cx={nm.bx} cy={nm.by} r={5} fill="#EF4444" />
                <text x={nm.ox + 5} y={nm.oy + 15} fontSize={9} fill="#999">{(res.n_max / 1000).toFixed(0)} kN</text>
                <text x={nm.ox + 5} y={nm.oy + nm.h - 5} fontSize={9} fill="#999">{(res.n_min / 1000).toFixed(0)} kN</text>
              </>
            )}
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
                  ['M_max', `${(res.m_max / 1e6).toFixed(1)} kN·m`],
                  ['N_bal', `${(res.n_balance / 1000).toFixed(0)} kN`],
                  ['M_bal', `${(res.m_balance / 1e6).toFixed(1)} kN·m`],
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
                  { symbol: String.raw`M_{Rd,max}`, meaning: 'Moment max', value: (res.m_max / 1e6).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`M_{bal}`, meaning: 'Moment équilibré', value: (res.m_balance / 1e6).toFixed(1), unit: 'kN·m' },
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
