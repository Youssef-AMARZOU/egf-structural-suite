import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { EquaDroitesCerclesInputs, EquaDroitesCerclesOutput } from '../../types/engineering';

const MODES = ['Droite par AB', 'Cercle par ABC', 'Droite AB ∩ cercle (C,R)', 'Cercle A ∩ cercle B'];

export default function Module230() {
  const [inp, setInp] = useState<EquaDroitesCerclesInputs>({
    mode: 1, xa: 0, ya: 0, xb: 4, yb: 0, xc: 2, yc: 3, ra: 2.5, rb: 2.5,
  });
  const { data: res, error: err, live } = useModuleCalc<EquaDroitesCerclesInputs, EquaDroitesCerclesOutput>(
    'calculate_equa_droites_cercles_230',
    { ...inp, mode: Math.round(inp.mode) },
  );
  const S = (k: keyof EquaDroitesCerclesInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof EquaDroitesCerclesInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- epure mapping (400x260 canvas) ----
  const epure = (() => {
    if (!res) return null;
    const px = [inp.xa, inp.xb, inp.xc, res.x0, res.ix1, res.ix2];
    const py = [inp.ya, inp.yb, inp.yc, res.y0, res.iy1, res.iy2];
    const x0 = Math.min(...px, -1), x1 = Math.max(...px, 1);
    const y0 = Math.min(...py, -1), y1 = Math.max(...py, 1);
    const X = (x: number) => 30 + ((x - x0) / (x1 - x0 || 1)) * 340;
    const Y = (y: number) => 20 + (1 - (y - y0) / (y1 - y0 || 1)) * 210;
    const sc = 340 / (x1 - x0 || 1);
    return { X, Y, sc };
  })();

  return (
    <Workstation
      title="230 Droites & cercles"
      subtitle="Équations normalisées + intersections (aide de tracé) — RUST"
      eurocode="Géométrie · tracé"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Mode & points</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Mode</label>
            <select
              value={inp.mode}
              onChange={(e) => setInp({ ...inp, mode: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
            >
              {MODES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          {slider('xa', 'xA', '-', -10, 10, 0.1)}
          {slider('ya', 'yA', '-', -10, 10, 0.1)}
          {slider('xb', 'xB', '-', -10, 10, 0.1)}
          {slider('yb', 'yB', '-', -10, 10, 0.1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Point C & rayons</div>
          {slider('xc', 'xC', '-', -10, 10, 0.1)}
          {slider('yc', 'yC', '-', -10, 10, 0.1)}
          {slider('ra', 'Ra', '-', 0.1, 10, 0.1)}
          {slider('rb', 'Rb', '-', 0.1, 10, 0.1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title={`Épure (${res ? res.kind : '…'})`} vbW={400} vbH={260}>
            {res && epure ? (
              <>
                {(inp.mode === 0 || inp.mode === 2) && (
                  <line
                    x1={epure.X(inp.xa)} y1={epure.Y(inp.ya)}
                    x2={epure.X(inp.xb)} y2={epure.Y(inp.yb)}
                    stroke="#1D4ED8" strokeWidth={2}
                  />
                )}
                {(inp.mode === 1 || inp.mode === 2) && res.r > 0 && (
                  <circle
                    cx={epure.X(res.x0)} cy={epure.Y(res.y0)} r={res.r * epure.sc}
                    fill="none" stroke="#7C3AED" strokeWidth={2}
                  />
                )}
                {inp.mode === 3 && (
                  <>
                    <circle cx={epure.X(inp.xa)} cy={epure.Y(inp.ya)} r={inp.ra * epure.sc} fill="none" stroke="#1D4ED8" strokeWidth={2} />
                    <circle cx={epure.X(inp.xb)} cy={epure.Y(inp.yb)} r={inp.rb * epure.sc} fill="none" stroke="#7C3AED" strokeWidth={2} />
                  </>
                )}
                {[
                  [inp.xa, inp.ya, 'A'], [inp.xb, inp.yb, 'B'], [inp.xc, inp.yc, 'C'],
                ].map(([x, y, l], i) => (
                  <g key={i}>
                    <circle cx={epure.X(x as number)} cy={epure.Y(y as number)} r={4} fill="#64748b" />
                    <text x={epure.X(x as number) + 6} y={epure.Y(y as number)} fontSize={10} fill="#94a3b8">{l}</text>
                  </g>
                ))}
                {res.n_pts > 0 && (
                  <>
                    <circle cx={epure.X(res.ix1)} cy={epure.Y(res.iy1)} r={5} fill="#EF4444" />
                    {res.n_pts === 2 && <circle cx={epure.X(res.ix2)} cy={epure.Y(res.iy2)} r={5} fill="#EF4444" />}
                  </>
                )}
              </>
            ) : (
              <text x={200} y={130} fontSize={11} fill="#94a3b8" textAnchor="middle">
                {err ?? 'computing…'}
              </text>
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
                  ['Type', res.kind],
                  ['Centre', `(${res.x0.toFixed(2)}, ${res.y0.toFixed(2)})`],
                  ['R', res.r.toFixed(3)],
                  ['Intersections', `${res.n_pts} → (${res.ix1.toFixed(2)}, ${res.iy1.toFixed(2)})`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Droites et cercles"
                latex={String.raw`(x-a)^2 + (y-b)^2 = R^2`}
                description="Cercle par 3 points, intersections"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`R`, meaning: 'Rayon', value: res.r.toFixed(3) },
                  { symbol: String.raw`n`, meaning: 'Intersections', value: res.n_pts },
                ]}
              />
              <div className="p-2 rounded bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300 text-xs font-semibold">
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
