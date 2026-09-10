import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { IntegrationNumInputs, IntegrationNumOutput } from '../../types/engineering';

export default function Module231() {
  const [inp, setInp] = useState<IntegrationNumInputs>({
    mode: 1, a: 0, b: 3, ys: [], coeffs: [0, 0, 1],
  });
  const [text, setText] = useState({ list: '1, 2, 3, 4, 5', poly: '0, 0, 1' });

  const parseList = (s: string) =>
    s.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
  const mode = Math.round(inp.mode);
  const payload: IntegrationNumInputs = mode === 0
    ? { ...inp, mode, ys: parseList(text.list), coeffs: [] }
    : { ...inp, mode, ys: [], coeffs: parseList(text.poly) };

  const { data: res, error: err, live } = useModuleCalc<IntegrationNumInputs, IntegrationNumOutput>(
    'calculate_integration_num_231', payload,
  );

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  // ---- area sketch (400x200 canvas) ----
  const area = (() => {
    const coeffs = mode === 1 ? parseList(text.poly) : [];
    const f = mode === 1
      ? (x: number) => coeffs.reduce((s, c, j) => s + c * Math.pow(x, j), 0)
      : (_x: number) => 0;
    const N = 60;
    const raw: [number, number][] = [];
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i <= N; i++) {
      const x = inp.a + (inp.b - inp.a) * (i / N);
      const y = f(x);
      raw.push([x, y]);
      yMin = Math.min(yMin, y, 0); yMax = Math.max(yMax, y, 0);
    }
    if (yMax - yMin < 1e-9) { yMax += 1; yMin -= 1; }
    const span = (inp.b - inp.a) || 1;
    const X = (x: number) => 40 + ((x - inp.a) / span) * 320;
    const Y = (y: number) => 20 + (1 - (y - yMin) / (yMax - yMin)) * 150;
    return {
      pts: raw.map(([x, y]) => [X(x), Y(y)] as [number, number]),
      poly: `40,${Y(0)} ${raw.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')} 360,${Y(0)}`,
      X, Y,
    };
  })();

  return (
    <Workstation
      title="231 Intégration numérique"
      subtitle="Simpson 1/3 + contrôle trapèzes, échantillons ou polynôme — RUST"
      eurocode="Maths · Simpson"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Fonction</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setInp((p) => ({ ...p, mode: Number(e.target.value) }))}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
            >
              <option value={0}>Échantillons (points)</option>
              <option value={1}>Polynôme (coeffs)</option>
            </select>
          </div>
          {mode === 0 ? (
            <div className="mb-1">
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                Échantillons y (nombre impair)
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
                value={text.list} onChange={(e) => setText({ ...text, list: e.target.value })}
              />
            </div>
          ) : (
            <div className="mb-1">
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                Coefficients a0, a1, ...
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
                value={text.poly} onChange={(e) => setText({ ...text, poly: e.target.value })}
              />
            </div>
          )}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Bornes</div>
          <ParamSlider label="a" unit="" value={inp.a} min={-10} max={10} step={0.1} onChange={(v) => setInp((p) => ({ ...p, a: v }))} />
          <ParamSlider label="b" unit="" value={inp.b} min={-10} max={20} step={0.1} onChange={(v) => setInp((p) => ({ ...p, b: v }))} />
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Aire sous la courbe" vbW={400} vbH={200}>
            <polygon points={area.poly} fill="#3B82F6" opacity={0.25} />
            <DiagramOverlay type="moment" points={area.pts} />
            {res && (
              <>
                <line
                  x1={area.X(res.centroide)} y1={20} x2={area.X(res.centroide)} y2={180}
                  stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3"
                />
                <text x={area.X(res.centroide) + 4} y={30} fontSize={10} fill="#EF4444">
                  x̄={res.centroide.toFixed(2)}
                </text>
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
                  ['Simpson', res.integrale.toFixed(4)],
                  ['Trapèzes', res.trapeze.toFixed(4)],
                  ['Écart', res.ecart.toExponential(1)],
                  ['Centroïde', res.centroide.toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Intégration numérique"
                latex={String.raw`\int_a^b f \approx \frac{h}{3}(f_0 + 4f_1 + 2f_2 + \cdots + f_n)`}
                description="Simpson 1/3 + trapèzes"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`I_{simp}`, meaning: 'Intégrale Simpson', value: res.integrale.toFixed(4) },
                  { symbol: String.raw`\bar{x}`, meaning: 'Centroïde', value: res.centroide.toFixed(3) },
                  { symbol: String.raw`e`, meaning: 'Écart Simpson/trapèzes', value: res.ecart.toExponential(1) },
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
