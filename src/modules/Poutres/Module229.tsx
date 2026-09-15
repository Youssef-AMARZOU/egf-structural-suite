import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { CourbesPointsInputs, CourbesPointsOutput } from '../../types/engineering';

export default function Module229() {
  const [inp, setInp] = useState<CourbesPointsInputs>({
    xs: [0, 1, 2, 3], ys: [0, 1, 4, 9], x_eval: 1.5,
  });
  const [ptsText, setPtsText] = useState('0:0, 1:1, 2:4, 3:9');

  const parsePts = (s: string): { xs: number[]; ys: number[] } => {
    const xs: number[] = [], ys: number[] = [];
    s.split(',').map((t) => t.trim()).filter((t) => t.length > 0).forEach((t) => {
      const [a, b] = t.split(':').map((x) => parseFloat(x));
      if (!isNaN(a) && !isNaN(b)) { xs.push(a); ys.push(b); }
    });
    return { xs: xs.length > 0 ? xs : inp.xs, ys: ys.length > 0 ? ys : inp.ys };
  };
  const parsed = parsePts(ptsText);
  const payload: CourbesPointsInputs = { xs: parsed.xs, ys: parsed.ys, x_eval: inp.x_eval };

  const { data: res, error: err, live } = useModuleCalc<CourbesPointsInputs, CourbesPointsOutput>(
    'calculate_courbes_points_229', payload,
  );

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  // ---- interpolated curve (px in 400x220 canvas) ----
  const curve = (() => {
    if (!res || res.coeffs.length === 0) return null;
    const allX = [...payload.xs, payload.x_eval];
    const x0 = Math.min(...allX), x1 = Math.max(...allX, x0 + 1e-9);
    const evalP = (x: number) => res.coeffs.reduce((s, c, j) => s + c * Math.pow(x, j), 0);
    const N = 60;
    let yMin = Infinity, yMax = -Infinity;
    const raw: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * (i / N);
      const y = evalP(x);
      raw.push([x, y]);
      yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
    }
    payload.ys.forEach((y) => { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); });
    if (yMax - yMin < 1e-9) { yMax += 1; yMin -= 1; }
    const X = (x: number) => 40 + ((x - x0) / (x1 - x0)) * 330;
    const Y = (y: number) => 20 + (1 - (y - yMin) / (yMax - yMin)) * 170;
    return { pts: raw.map(([x, y]) => [X(x), Y(y)] as [number, number]), X, Y };
  })();

  return (
    <Workstation
      title="229 Courbes par points"
      subtitle="Interpolation polynomiale (Vandermonde + Gauss) — valeur + pente — RUST"
      eurocode="Maths · Lagrange"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
            Points (format x:y, 2 à 10)
          </div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Points (2 à 10)
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={ptsText} onChange={(e) => setPtsText(e.target.value)}
            />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Évaluation</div>
          <ParamSlider
            label="x à évaluer" unit="" value={inp.x_eval}
            min={-10} max={10} step={0.1}
            onChange={(v) => setInp((p) => ({ ...p, x_eval: v }))}
          />
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Courbe interpolée" vbW={400} vbH={220}>
            {res && curve ? (
              <>
                <DiagramOverlay type="moment" points={curve.pts} />
                {payload.xs.map((x, i) => (
                  <circle key={i} cx={curve.X(x)} cy={curve.Y(payload.ys[i])} r={4} fill="#EF4444" />
                ))}
                <circle
                  cx={curve.X(payload.x_eval)} cy={curve.Y(res.y_eval)} r={5}
                  fill="none" stroke="#22C55E" strokeWidth={2.5}
                />
                <text x={curve.X(payload.x_eval) + 8} y={curve.Y(res.y_eval)} fontSize={10} fill="#22C55E">
                  {res.y_eval.toFixed(2)}
                </text>
              </>
            ) : (
              <text x={200} y={110} fontSize={11} fill="#94a3b8" textAnchor="middle">
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
                  ['P(x)', res.y_eval.toFixed(3)],
                  ["P'(x)", res.slope.toFixed(3)],
                  ['Degré', String(res.degree)],
                  ['Écart max', res.max_err.toExponential(1)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Interpolation polynomiale"
                latex={String.raw`P(x) = \sum y_i \ell_i(x)`}
                description="Vandermonde + Gauss, 2-10 pts"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`P(x)`, meaning: 'Valeur interpolée', value: res.y_eval.toFixed(3) },
                  { symbol: String.raw`P'`, meaning: 'Dérivée', value: res.slope.toFixed(3) },
                  { symbol: String.raw`n`, meaning: 'Degré', value: res.degree },
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
