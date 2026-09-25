import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { PourcentageMiniAgeInputs, PourcentageMiniAgeOutput } from '../../types/engineering';
import {
  SectionCanvas, DimensionLine, RebarGroup, rowBars,
} from '../../components/drafting';

const BAR_PHI = 16;
const BAR_AREA = Math.PI * (BAR_PHI / 2) ** 2;

export default function Module195() {
  const [inp, setInp] = useState<PourcentageMiniAgeInputs>({
    b: 200, h: 450, d: 400, fck: 30, fyd: 434.8, t0: 28, RH: 60, classe: 2,
  });
  const { data: res, error: err, live } = useModuleCalc<PourcentageMiniAgeInputs, PourcentageMiniAgeOutput>(
    'calculate_pourcentage_mini_age_195', inp,
  );
  const S = (k: keyof PourcentageMiniAgeInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  // ---- sketch geometry ----
  const k = Math.min(260 / inp.b, 200 / inp.h);
  const ox = 200;
  const oy = 50;
  const W = inp.b * k;
  const H = inp.h * k;
  const ySteel = oy + inp.d * k;
  const nBars = res ? Math.max(2, Math.round(res.As_min / BAR_AREA)) : 3;

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PourcentageMiniAgeInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="195 Pourcentage Mini + Âge"
      subtitle="EC2 §9.2.1.1 corrigé du fluage au jeune âge — RUST"
      eurocode="EC2 §9.2.1.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'Largeur b', 'mm', 100, 1000, 10)}
          {slider('h', 'Hauteur h', 'mm', 200, 1200, 10)}
          {slider('d', 'Hauteur utile d', 'mm', 100, 1100, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & âge</div>
          {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
          {slider('fyd', 'Acier fyd', 'MPa', 400, 500, 0.1)}
          {slider('t0', 't0', 'jours', 1, 365, 1)}
          {slider('RH', 'RH', '%', 40, 100, 1)}
          {slider('classe', 'classe', '-', 1, 3, 1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section + distribution As,min" vbW={600} vbH={320} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
            <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
            <line x1={ox} y1={ySteel} x2={ox + W} y2={ySteel} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="4 2" opacity={0.7} />
            <RebarGroup bars={rowBars(nBars, ox + 14, ox + W - 14, ySteel, BAR_PHI)} pxPerMm={k} showLabels />
            <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} text={`b = ${inp.b}`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`h = ${inp.h}`} />
            <DimensionLine x1={ox + W} y1={oy} x2={ox + W} y2={ySteel} offset={22} text={`d = ${inp.d}`} />
            {res && (
              <text x={ox + W / 2} y={oy + H + 44} textAnchor="middle" fontSize={11} fill="#22c55e" fontWeight="bold">
                {nBars}φ{BAR_PHI} ≈ {res.As_min.toFixed(0)} mm²
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
                  ['As_min', `${res.As_min.toFixed(0)} mm²`],
                  ['As_min âge', `${res.As_min_age.toFixed(0)} mm²`],
                  ['ρ_min', res.rho_min.toFixed(4)],
                  ['ρ_min âge', res.rho_min_age.toFixed(4)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Pourcentage mini + âge"
                latex={String.raw`A_{s,min} = 0.26\frac{f_{ctm}}{f_{yk}} b_t d \ge 0.0013 b_t d`}
                description="Corrigé du fluage au jeune âge"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`A_{s,min}`, meaning: 'Section minimale', value: res.As_min.toFixed(0), unit: 'mm²' },
                  { symbol: String.raw`\rho_{min}`, meaning: 'Ratio minimal', value: res.rho_min.toFixed(4) },
                  { symbol: String.raw`t_0`, meaning: 'Âge de chargement', value: inp.t0, unit: 'j' },
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
