import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { DalleBpEvasionNPotInputs, DalleBpEvasionNPotOutput } from '../../types/engineering';

export default function Module165() {
  const [inp, setInp] = useState<DalleBpEvasionNPotInputs>({
    spans: [6.0, 6.0],
    loads: [0.015, 0.015],
    E: 30000, H: 200,
    inertia: [], section: [],
    pa: 0, pb: 0,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleBpEvasionNPotInputs, DalleBpEvasionNPotOutput>(
    'calculate_dalle_bp_evasion_n_pot_165', inp,
  );
  const S = (k: keyof DalleBpEvasionNPotInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addSpan = () => setInp({ ...inp, spans: [...inp.spans, 6.0], loads: [...inp.loads, 0.015] });
  const removeSpan = (i: number) => setInp({ ...inp, spans: inp.spans.filter((_, j) => j !== i), loads: inp.loads.filter((_, j) => j !== i) });

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleBpEvasionNPotInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const totalL = inp.spans.reduce((a, b) => a + b, 0);
  const scX = 380 / totalL;
  const supports = [0];
  { let acc = 0; for (const s of inp.spans) { acc += s; supports.push(acc); } }
  const deflPts: [number, number][] = res ? res.deflections.map((d, i) => (
    [60 + supports[i] * scX, 75 + d * 1000 * (50 / (res.max_deflection || 1))] as [number, number]
  )) : [];
  const momPts: [number, number][] = res ? res.moments.map((m, i) => (
    [60 + supports[i] * scX, 75 + m * (50 / (res.max_moment || 1))] as [number, number]
  )) : [];

  return (
    <Workstation
      title="165 Dalle bp evasion n pot"
      subtitle="Bande de dalle continue — solveur matriciel Gaussian elimination — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie & Matériaux</div>
          {slider('E', 'E', 'MPa', 10000, 60000, 1000)}
          {slider('H', 'H', 'mm', 100, 600, 10)}
          {slider('pa', 'Pa', 'kN·m', -100, 100, 1)}
          {slider('pb', 'Pb', 'kN·m', -100, 100, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travées & Charges (MN/m²)</div>
          {inp.spans.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Travée {i + 1}</span>
                {inp.spans.length > 1 && (
                  <button onClick={() => removeSpan(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="L" unit="m" value={s} min={1} max={20} step={0.5} onChange={v => {
                const sp = [...inp.spans]; sp[i] = v; setInp({ ...inp, spans: sp });
              }} />
              <ParamSlider label="q" unit="MN/m²" value={inp.loads[i]} min={0} max={0.1} step={0.001} onChange={v => {
                const ld = [...inp.loads]; ld[i] = v; setInp({ ...inp, loads: ld });
              }} />
            </div>
          ))}
          <button onClick={addSpan} className="text-blue-600 text-sm mt-1">+ Ajouter travée</button>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Déflections aux appuis" vbW={500} vbH={150}>
              <line x1={60} y1={75} x2={60 + totalL * scX} y2={75} stroke="#94A3B8" strokeWidth={3} />
              {supports.map((sx, i) => (
                <polygon key={i} points={`${60 + sx * scX},80 ${60 + sx * scX - 6},93 ${60 + sx * scX + 6},93`}
                  fill="#6366F1" />
              ))}
              {res && res.deflections.length > 1 && (
                <DiagramOverlay type="deflection" points={deflPts} />
              )}
              {res && res.deflections.map((d, i) => (
                <text key={i} x={60 + supports[i] * scX} y={65}
                  fontSize={9} fill="#374151" textAnchor="middle">
                  {(d * 1000).toFixed(2)}
                </text>
              ))}
              <text x={60 + totalL * scX / 2} y={140} fontSize={10} fill="#999" textAnchor="middle">
                Déflections en mm
              </text>
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Moments fléchissants" vbW={500} vbH={150}>
              <line x1={60} y1={75} x2={60 + totalL * scX} y2={75} stroke="#94A3B8" strokeWidth={1} />
              {res && res.moments.length > 0 && (
                <DiagramOverlay type="moment" points={momPts} />
              )}
              {res && res.moments.map((m, i) => (
                <text key={i} x={60 + supports[i] * scX} y={m >= 0 ? 67 : 93}
                  fontSize={9} fill="#374151" textAnchor="middle">
                  {m.toFixed(1)}
                </text>
              ))}
              <text x={60 + totalL * scX / 2} y={140} fontSize={10} fill="#999" textAnchor="middle">
                Moments en kN·m
              </text>
            </SectionCanvas>
          </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['δ_max', `${(res.max_deflection * 1000).toFixed(2)} mm`],
                  ['M_max', `${res.max_moment.toFixed(2)} kN·m`],
                  ['Inconnues', (res.deflections.length * 3).toString()],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Système linéaire dalle"
                latex={String.raw`K u = f`}
                description="Élimination de Gauss, 3N inconnues"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\delta_{max}`, meaning: 'Flèche max', value: (res.max_deflection * 1000).toFixed(2), unit: 'mm' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.max_moment.toFixed(2), unit: 'kN·m' },
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
