import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { RotPlastoptimBInputs, RotPlastoptimBOutput } from '../../types/engineering';

export default function Module175() {
  const [inp, setInp] = useState<RotPlastoptimBInputs>({
    na: 4, L: [6, 6, 6], ine: [0.01, 0.01, 0.01],
    tg: [10, 10, 10, 10], tq: [5, 5, 5, 5],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    b: 200, h: 400, d: 360, hf: 0,
  });
  const { data: res, error: err, live } = useModuleCalc<RotPlastoptimBInputs, RotPlastoptimBOutput>(
    'calculate_rot_plastoptim_b_175', inp,
  );
  const S = (k: keyof RotPlastoptimBInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof RotPlastoptimBInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 70, w = 400, h = 50;

  return (
    <Workstation
      title="175 Rot plastoptim b"
      subtitle="Poutre continue — 3 moments + rotation plastique (EC2/BAEL) — RUST"
      eurocode="EC2 §5.6"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          <ParamSlider label="na (appuis)" unit="" value={inp.na} min={2} max={10} step={1} onChange={v => {
            const n = Math.max(2, Math.min(10, Math.round(v)));
            setInp({
              ...inp, na: n, L: Array(n - 1).fill(inp.L[0] || 6),
              ine: Array(n - 1).fill(inp.ine[0] || 0.01),
              tg: Array(n).fill(inp.tg[0] || 10), tq: Array(n).fill(inp.tq[0] || 5),
            });
          }} />
          {slider('b', 'b', 'mm', 100, 1000, 10)}
          {slider('h', 'h', 'mm', 100, 1000, 10)}
          {slider('d', 'd', 'mm', 100, 900, 10)}
          {slider('hf', 'hf', 'mm', 0, 300, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges (kN/m/m)</div>
          {Array.from({ length: inp.na }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-500">Appui {i + 1}</span>
              <ParamSlider label="tg" unit="kN/m" value={inp.tg[i]} min={0} max={100} step={1} onChange={v => { const t = [...inp.tg]; t[i] = v; setInp({ ...inp, tg: t }); }} />
              <ParamSlider label="tq" unit="kN/m" value={inp.tq[i]} min={0} max={100} step={1} onChange={v => { const t = [...inp.tq]; t[i] = v; setInp({ ...inp, tq: t }); }} />
            </div>
          ))}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Enveloppe de moments" vbW={500} vbH={150}>
            {res && (() => {
              const allM = [...res.moments_appuis, ...res.moments_travee];
              const maxM = Math.max(...allM.map(m => Math.abs(m)), 1);
              const sc = h / maxM;
              const nSpans = inp.na - 1;
              const spanW = w / nSpans;
              return (
                <>
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94A3B8" strokeWidth={2} />
                  {res.moments_appuis.map((m, i) => (
                    <g key={`s${i}`}>
                      <circle cx={ox + i * spanW} cy={oy + m * sc} r={4} fill="#EF4444" />
                      <text x={ox + i * spanW} y={oy + m * sc + (m < 0 ? -8 : 14)}
                        fontSize={8} fill="#333" textAnchor="middle">{m.toFixed(1)}</text>
                    </g>
                  ))}
                  {Array.from({ length: nSpans }).map((_, si) => {
                    const pts: [number, number][] = Array.from({ length: 5 }).map((_, j) => (
                      [ox + si * spanW + j / 4 * spanW, oy + res.moments_travee[si * 5 + j] * sc] as [number, number]
                    ));
                    return <DiagramOverlay key={`sp${si}`} type="moment" points={pts} />;
                  })}
                  <text x={ox + w / 2} y={oy + h + 20} fontSize={10} fill="#666" textAnchor="middle">x (m)</text>
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
                  ['M_appuis max', `${Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1)} kN·m`],
                  ['M_travée max', `${Math.max(...res.moments_travee.map(m => Math.abs(m)), 0).toFixed(1)} kN·m`],
                  ['Appuis', `${res.moments_appuis.length}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Poutre continue plastique"
                latex={String.raw`M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 + 6A_1\bar{x}_1/L_1 + 6A_2\bar{x}'_2/L_2 = 0`}
                description="Trois moments + rotules"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{app}`, meaning: 'Moment sur appui max', value: Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`M_{trav}`, meaning: 'Moment en travée max', value: Math.max(...res.moments_travee.map(m => Math.abs(m)), 0).toFixed(1), unit: 'kN·m' },
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
