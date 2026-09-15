import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup, DiagramOverlay, AxisTicks, InlineLegend,
} from '../../components/drafting';
import { InteractionMFeuCircInputs, InteractionMFeuCircOutput } from '../../types/engineering';

export default function Module220() {
  const [inp, setInp] = useState<InteractionMFeuCircInputs>({
    d: 400, n_bar: 8, phi: 20, a: 45, fck: 30, fyk: 500, r: 90, n_ed_fi: 900, m_ed_fi: 80,
  });
  const { data: res, error: err, live } = useModuleCalc<InteractionMFeuCircInputs, InteractionMFeuCircOutput>(
    'calculate_interaction_m_feu_circ_220',
    { ...inp, n_bar: Math.round(inp.n_bar) },
  );
  const S = (k: keyof InteractionMFeuCircInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InteractionMFeuCircInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- interaction curve points (px in 200x260 canvas) ----
  const curve = (() => {
    if (!res || res.curve_m.length === 0) return null;
    const mMax = Math.max(...res.curve_m, inp.m_ed_fi, 1);
    const nMax = Math.max(...res.curve_n, inp.n_ed_fi, 1);
    const nMin = Math.min(...res.curve_n, 0);
    const X = (m: number) => 30 + (m / mMax) * 150;
    const Y = (n: number) => 15 + (1 - (n - nMin) / (nMax - nMin)) * 220;
    const pts: [number, number][] = res.curve_m.map((m, i) => [X(m), Y(res.curve_n[i])] as [number, number]);
    return { pts, ox: X(inp.m_ed_fi), oy: Y(inp.n_ed_fi) };
  })();

  // ---- residual section: rebar crown ----
  const RCX = 100, RCY = 110, RR = 90;
  const pxPerMm = 180 / inp.d;
  const rResPx = res ? RR * (res.d_res / inp.d) : RR;
  const nBars = Math.max(1, Math.round(inp.n_bar));
  const bars = Array.from({ length: nBars }, (_, i) => {
    const ang = (2 * Math.PI * i) / nBars - Math.PI / 2;
    const rr = Math.max(0, rResPx - inp.a * pxPerMm);
    return { x: RCX + rr * Math.cos(ang), y: RCY + rr * Math.sin(ang), phi: inp.phi };
  });

  return (
    <Workstation
      title="220 Interaction M feu, poteau circulaire"
      subtitle="EC2-1-2 — cercle résiduel + couronne d'aciers, courbe N-M — RUST"
      eurocode="EC2-1-2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('d', 'D', 'mm', 200, 800, 10)}
          {slider('n_bar', 'nb barres', '-', 4, 16, 1)}
          {slider('phi', 'φ', 'mm', 10, 40, 1)}
          {slider('a', 'a', 'mm', 20, 80, 1)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu & torseur</div>
          {slider('r', 'R', 'min', 30, 240, 30)}
          {slider('n_ed_fi', 'NEd,fi', 'kN', 0, 5000, 10)}
          {slider('m_ed_fi', 'MEd,fi', 'kN·m', 0, 500, 5)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Courbe d'interaction N-M" vbW={200} vbH={260}>
              {curve ? (
                <>
                  <line x1={30} y1={15} x2={30} y2={235} stroke="#64748B" strokeWidth={1} />
                  <line x1={30} y1={235} x2={180} y2={235} stroke="#64748B" strokeWidth={1} />
                  <DiagramOverlay type="moment" points={curve.pts} />
                  <circle cx={curve.ox} cy={curve.oy} r={5} fill={status === 'fail' ? '#EF4444' : '#22C55E'} />
                  <text x={3} y={125} fontSize={9} fill="#94a3b8" textAnchor="middle" transform="rotate(-90 3 125)">N (kN)</text>
                  {(() => {
                    const mMax = Math.max(...res!.curve_m, inp.m_ed_fi, 1);
                    const nMax = Math.max(...res!.curve_n, inp.n_ed_fi, 1);
                    const nMin = Math.min(...res!.curve_n, 0);
                    return (
                      <>
                        <AxisTicks
                          values={[0, mMax / 2, mMax]}
                          map={(v) => [30 + (v / mMax) * 150, 235]}
                          unit="kN·m"
                          side="below"
                        />
                        <AxisTicks
                          values={[nMin, 0, nMax]}
                          map={(v) => [30, 15 + (1 - (v - nMin) / (nMax - nMin)) * 220]}
                          unit="kN"
                          side="left"
                        />
                      </>
                    );
                  })()}
                  <text x={10} y={250} fontSize={9} fill="#94a3b8">M→</text>
                  <InlineLegend
                    items={[
                      { label: 'Courbe N-M', color: '#3B82F6' },
                      { label: '(MEd, NEd)', color: status === 'fail' ? '#EF4444' : '#22C55E' },
                    ]}
                    x={75}
                    y={5}
                  />
                </>
              ) : (
                <text x={100} y={130} fontSize={10} fill="#94a3b8" textAnchor="middle">computing…</text>
              )}
            </SectionCanvas>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section résiduelle" vbW={200} vbH={220}>
              <circle cx={RCX} cy={RCY} r={RR} fill="#FECACA" opacity={0.5} stroke="#991B1B" strokeWidth={2} />
              {res && (
                <>
                  <circle cx={RCX} cy={RCY} r={rResPx} fill="#DBEAFE" opacity={0.5} stroke="#1D4ED8" strokeWidth={2} />
                  <RebarGroup bars={bars} pxPerMm={pxPerMm} />
                  <DimensionLine x1={RCX} y1={RCY} x2={RCX + rResPx} y2={RCY} offset={-14} text={`D rés.=${res.d_res.toFixed(0)}`} />
                </>
              )}
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
                  ['Taux', `${(res.ratio * 100).toFixed(0)} %`],
                  ['Nmax', `${res.n_max.toFixed(0)} kN`],
                  ['Mmax', `${res.m_max.toFixed(1)} kN·m`],
                  ['D résiduel', `${res.d_res.toFixed(0)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="M au feu circulaire"
                latex={String.raw`M_{Ed} \le M_{Rd,fi}`}
                description="Cercle résiduel + couronne d'aciers"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\eta`, meaning: 'Taux N-M', value: (res.ratio * 100).toFixed(0), unit: '%' },
                  { symbol: String.raw`M_{Rd,fi}`, meaning: 'Capacité à chaud', value: res.m_max.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`D_{res}`, meaning: 'Diamètre résiduel', value: res.d_res.toFixed(0), unit: 'mm' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${status === 'fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'}`}>
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
