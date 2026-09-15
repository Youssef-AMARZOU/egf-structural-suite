import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { PoutreContinue2travInputs, PoutreContinue2travOutput } from '../../types/engineering';

export default function Module234() {
  const [inp, setInp] = useState<PoutreContinue2travInputs>({
    l1: 6, l2: 5, g1: 20, q1: 15, g2: 20, q2: 10, b: 600, hf: 80, bw: 300, d: 450, fck: 30, fyk: 500,
  });
  const { data: res, error: err, live } = useModuleCalc<PoutreContinue2travInputs, PoutreContinue2travOutput>(
    'calculate_poutre_continue_2trav_234', inp,
  );
  const S = (k: keyof PoutreContinue2travInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PoutreContinue2travInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- moment envelope (400x200 canvas) ----
  const L = inp.l1 + inp.l2;
  const env = (() => {
    if (!res) return null;
    const X = (x: number) => 30 + (x / L) * 340;
    const mMax = Math.max(res.m_trav1, res.m_trav2, -res.m_appui, 1);
    const Y = (m: number) => 70 + (m / mMax) * 80;
    const pts: [number, number][] = [
      [X(0), Y(0)],
      [X(inp.l1 / 2), Y(res.m_trav1)],
      [X(inp.l1), Y(res.m_appui)],
      [X(inp.l1 + inp.l2 / 2), Y(res.m_trav2)],
      [X(L), Y(0)],
    ];
    return { X, Y, pts };
  })();

  return (
    <Workstation
      title="234 Poutre continue 2 travées (T)"
      subtitle="Clapeyron + combinaisons ELU + aciers en T / sur appui — RUST"
      eurocode="EC2 §5.3"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travées & charges</div>
          {slider('l1', 'L1', 'm', 1, 20, 0.5)}
          {slider('l2', 'L2', 'm', 1, 20, 0.5)}
          {slider('g1', 'g1', 'kN/m', 0, 100, 1)}
          {slider('q1', 'q1', 'kN/m', 0, 100, 1)}
          {slider('g2', 'g2', 'kN/m', 0, 100, 1)}
          {slider('q2', 'q2', 'kN/m', 0, 100, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section en T</div>
          {slider('b', 'b table', 'mm', 200, 2000, 20)}
          {slider('hf', 'hf', 'mm', 40, 300, 5)}
          {slider('bw', 'bw', 'mm', 150, 800, 10)}
          {slider('d', 'd', 'mm', 150, 1200, 10)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Enveloppe des moments" vbW={400} vbH={200}>
            {res && env ? (
              <>
                <line x1={30} y1={70} x2={370} y2={70} stroke="#64748b" />
                {[0, inp.l1, L].map((x, i) => (
                  <g key={i}>
                    <line x1={env.X(x)} y1={70} x2={env.X(x)} y2={150} stroke="#64748b" strokeWidth={3} />
                    <polygon
                      points={`${env.X(x) - 6},150 ${env.X(x) + 6},150 ${env.X(x)},158`}
                      fill="#64748b"
                    />
                  </g>
                ))}
                <DiagramOverlay type="moment" points={env.pts} />
                <text x={env.X(inp.l1)} y={env.Y(res.m_appui) - 6} fontSize={10} fill="#EF4444" textAnchor="middle">
                  {res.m_appui.toFixed(0)}
                </text>
                <text x={env.X(inp.l1 / 2)} y={env.Y(res.m_trav1) + 16} fontSize={10} fill="#1D4ED8" textAnchor="middle">
                  {res.m_trav1.toFixed(0)}
                </text>
                <text x={env.X(inp.l1 + inp.l2 / 2)} y={env.Y(res.m_trav2) + 16} fontSize={10} fill="#1D4ED8" textAnchor="middle">
                  {res.m_trav2.toFixed(0)}
                </text>
                <text x={200} y={185} fontSize={10} fill="#94a3b8" textAnchor="middle">
                  As {res.as_trav1.toFixed(0)} / {res.as_appui.toFixed(0)} / {res.as_trav2.toFixed(0)} mm²
                </text>
                <DimensionLine x1={env.X(0)} y1={70} x2={env.X(inp.l1)} y2={70} offset={-46} text={`L1=${inp.l1}`} />
                <DimensionLine x1={env.X(inp.l1)} y1={70} x2={env.X(L)} y2={70} offset={-46} text={`L2=${inp.l2}`} />
                {(() => {
                  const mMax = Math.max(res.m_trav1, res.m_trav2, -res.m_appui, 1);
                  const mapX = (v: number) => [30 + (v / L) * 340, 0] as [number, number];
                  const mapY = (v: number) => [0, 70 + (v / mMax) * 80] as [number, number];
                  const xValues = [0, inp.l1 / 2, inp.l1, inp.l1 + inp.l2 / 2, L];
                  const yRange = mMax;
                  const rawStep = yRange / 3;
                  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
                  const step = Math.ceil(rawStep / mag) * mag;
                  const yValues: number[] = [];
                  for (let v = -Math.ceil(yRange / step) * step; v <= yRange + step * 0.01; v += step) yValues.push(+v.toFixed(1));
                  return (
                    <>
                      <AxisTicks values={xValues} map={mapX} unit="m" side="below" decimals={1} />
                      <AxisTicks values={yValues} map={mapY} unit="kN·m" side="left" decimals={0} />
                    </>
                  );
                })()}
              </>
            ) : (
              <text x={200} y={100} fontSize={11} fill="#94a3b8" textAnchor="middle">
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
                  ['M appui', `${res.m_appui.toFixed(1)} kN·m`],
                  ['Mt trav.1', `${res.m_trav1.toFixed(1)} kN·m`],
                  ['Mt trav.2', `${res.m_trav2.toFixed(1)} kN·m`],
                  ['R1 max', `${res.r1.toFixed(0)} kN`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Continue 2 travées en T"
                latex={String.raw`M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 + 6A_1\bar{x}_1/L_1 + 6A_2\bar{x}'_2/L_2 = 0`}
                description="Clapeyron + 3 cas ELU"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{app}`, meaning: 'Moment sur appui', value: res.m_appui.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`A_{s,app}`, meaning: 'Acier sur appui', value: res.as_appui.toFixed(0), unit: 'mm²' },
                  { symbol: String.raw`A_{s,t}`, meaning: 'Acier travée 1', value: res.as_trav1.toFixed(0), unit: 'mm²' },
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
