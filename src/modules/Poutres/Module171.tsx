import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup } from '../../components/drafting';
import { MrdDesTsInputs, MrdDesTsOutput } from '../../types/engineering';

export default function Module171() {
  const [inp, setInp] = useState<MrdDesTsInputs>({
    d: 270, fck: 30, gc: 1.5, Ac: 600, fyk: 500, gs: 1.15, euk: 0.01, k: 1.0,
  });
  const { data: res, error: err, live } = useModuleCalc<MrdDesTsInputs, MrdDesTsOutput>(
    'calculate_mrd_des_ts_171', inp,
  );
  const S = (k: keyof MrdDesTsInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof MrdDesTsInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 30;
  const bw = 200, hw = 120, tw = 40, tf = 20;

  return (
    <Workstation
      title="171 Mrd des ts"
      subtitle="Moment résistant section en T (itération σs) — RUST"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('d', 'd', 'mm', 100, 800, 10)}
          {slider('Ac', 'Ac (ferraillage)', 'mm²/m', 0, 3000, 10)}
          {slider('k', 'k', '', 0.5, 1.5, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {slider('euk', 'εuk', '', 0.005, 0.05, 0.001)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section en T" vbW={500} vbH={200}>
            <rect x={ox} y={oy} width={bw} height={tf} fill="#94A3B8" stroke="#333" strokeWidth={1.5} />
            <rect x={ox + (bw - tw) / 2} y={oy + tf} width={tw} height={hw - tf} fill="#94A3B8" stroke="#333" strokeWidth={1.5} />
            {res && (
              <>
                <line x1={ox - 10} y1={oy + res.x * 120 / inp.d}
                  x2={ox + bw + 10} y2={oy + res.x * 120 / inp.d}
                  stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,3" />
                <text x={ox + bw + 15} y={oy + res.x * 120 / inp.d + 4}
                  fontSize={9} fill="#EF4444">x = {res.x.toFixed(0)} mm</text>
                <RebarGroup bars={[{ x: ox + bw / 2, y: oy + hw - 5, phi: 20 }]} pxPerMm={120 / inp.d} />
                <text x={ox + bw / 2 + 10} y={oy + hw}
                  fontSize={9} fill="#333">σs = {res.ss.toFixed(0)} MPa</text>
              </>
            )}
            <DimensionLine x1={ox + bw + 20} y1={oy} x2={ox + bw + 20} y2={oy + hw} offset={8} text={`d = ${inp.d} mm`} />
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['MR', `${(res.MR / 1000).toFixed(2)} kN·m/m`],
                  ['σs', `${res.ss.toFixed(1)} MPa`],
                  ['x', `${res.x.toFixed(1)} mm`],
                  ['z', `${res.z.toFixed(1)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Moment résistant en T"
                latex={String.raw`\mu = \frac{M_{Ed}}{b_{eff} d^2 f_{cd}}`}
                description="Axe neutre table / nervure"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_R`, meaning: 'Moment résistant', value: (res.MR / 1000).toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`x`, meaning: 'Axe neutre', value: res.x.toFixed(1), unit: 'mm' },
                  { symbol: String.raw`\sigma_s`, meaning: 'Contrainte acier', value: res.ss.toFixed(1), unit: 'MPa' },
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
