import { useState } from 'react';
import type { BaelFaesselInputs, BaelFaesselOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { StatTile } from '../../components/common/StatTile';
import { DiagList, type DiagItem } from '../../components/common/DiagList';
import {
  SectionCanvas, DimensionLine, RebarGroup, rowBars,
} from '../../components/drafting';

const DEFAULT: BaelFaesselInputs = {
  h: 500, bh: 1.0, fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  rho: 1.0, delta: 0.1, lam: 30, lel: 3000, ec1: 2.0,
  eh01: 3.5, eh02: 0.0, eb1: -3.5, eb2: 0.0, llim: 6000, eim: 20,
};

const BAR_PHI = 20;


export default function Module109() {
  const [inp, setInp] = useState<BaelFaesselInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<BaelFaesselInputs, BaelFaesselOutput>(
    'calculate_bael_faessel_109', inp,
  );
  const S = (k: keyof BaelFaesselInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BaelFaesselInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- sketch geometry ----
  const k = Math.min(150 / (inp.bh * inp.h), 190 / inp.h);
  const ox = 190;
  const oy = 36;
  const W = inp.bh * inp.h * k;
  const H = inp.h * k;
  const yTop = oy + inp.delta * H;
  const yBot = oy + H - inp.delta * H;

  const diags: DiagItem[] = res ? [
    {
      severity: res.nr > 0 ? 'ok' : 'fail',
      message: res.nr > 0 ? `NR = ${res.nr.toFixed(1)} kN.` : 'Pas de solution.',
    },
    {
      severity: inp.lam < 70 ? 'ok' : 'fail',
      message: inp.lam < 70 ? `λ = ${inp.lam} < 70.` : `λ = ${inp.lam} > 70 — BAEL interdit.`,
    },
    { severity: 'info', message: `ρ = ${inp.rho} % · α = ${res.alpha.toFixed(3)}.` },
    { severity: 'info', message: `e₁ = ${res.e1.toFixed(1)} mm · e₂ = ${res.e2.toFixed(1)} mm.` },
    { severity: 'info', message: `σs₁ = ${res.sigma_s1.toFixed(0)} MPa.` },
  ] : [];

  return (
    <Workstation
      title="109 Bâton BAEL"
      subtitle="Interaction N-M — BAEL B.8.4.1 + Faessel"
      eurocode="BAEL"
      category="Poteaux"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Section</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('h', 'h', 'mm', 100, 2000, 50)}
          {slider('bh', 'b/h', '-', 0.3, 3, 0.1)}
          {slider('delta', 'δ enrobage', '-', 0.05, 0.5, 0.01)}
          {slider('rho', 'ρ', '%', 0.1, 10, 0.1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Matériaux</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 1.5, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Flambement</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('lam', 'λ', '-', 5, 100, 1)}
          {slider('lel', 'Longueur', 'mm', 500, 15000, 100)}
          {slider('llim', 'Long limite', 'mm', 1000, 20000, 100)}
          {slider('eim', 'Excentrement', 'mm', 0, 200, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Recherche</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('ec1', 'εc1', '‰', 1, 4, 0.1)}
          {slider('eh01', 'εh0₁', '‰', 0, 5, 0.1)}
          {slider('eh02', 'εh0₂', '‰', -5, 0, 0.1)}
          {slider('eb1', 'εb₁', '‰', -5, 0, 0.1)}
          {slider('eb2', 'εb₂', '‰', 0, 5, 0.1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="glass rounded-2xl p-5">
          <SectionCanvas title="Section et lits d'acier" vbW={380} vbH={300} scaleLabel="δ = enrobage relatif">
            <rect x={ox - W / 2} y={oy} width={W} height={H} fill="#4C8DFF" opacity={0.14} stroke="#4C8DFF" strokeWidth={1.4} rx={2} />
            <RebarGroup
              bars={[
                ...rowBars(2, ox - W / 2 + 12, ox + W / 2 - 12, yTop, BAR_PHI),
                ...rowBars(2, ox - W / 2 + 12, ox + W / 2 - 12, yBot, BAR_PHI),
              ]}
              pxPerMm={k}
              fill="#4C8DFF"
              stroke="#1D4ED8"
            />
            <DimensionLine x1={ox - W / 2} y1={oy + H} x2={ox + W / 2} y2={oy + H} offset={24} text={`B = ${(inp.bh * inp.h).toFixed(0)} mm`} />
            <DimensionLine x1={ox - W / 2} y1={oy} x2={ox - W / 2} y2={oy + H} offset={-28} text={`h = ${inp.h} mm`} />
            <DimensionLine x1={ox + W / 2} y1={oy} x2={ox + W / 2} y2={yTop} offset={20} text="δ·h" />
            {res && (
              <>
                <text x={ox} y={oy + H + 42} textAnchor="middle" fontSize={11} fill="#4C8DFF" fontWeight="bold">
                  NR = {res.nr.toFixed(0)} kN
                </text>
                <text x={ox} y={oy + H + 56} textAnchor="middle" fontSize={11} fill="#34D399" fontWeight="bold">
                  NBaels = {res.n_baels.toFixed(0)} kN
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
              <div className="grid grid-cols-2 gap-2">
                <StatTile label="NR" value={res.nr.toFixed(1)} unit="kN" tone={res.nr > 0 ? 'pass' : 'fail'} />
                <StatTile label="MR" value={res.mr.toFixed(1)} unit="kN·m" />
                <StatTile label="NBaels" value={res.n_baels.toFixed(1)} unit="kN" />
                <StatTile label="α flambement" value={res.alpha.toFixed(3)} tone={inp.lam < 70 ? 'pass' : 'fail'} />
                <StatTile label="e₁ / e₂" value={`${res.e1.toFixed(1)} / ${res.e2.toFixed(1)}`} unit="mm" />
                <StatTile label="σs₁ / σs₂" value={`${res.sigma_s1.toFixed(0)} / ${res.sigma_s2.toFixed(0)}`} unit="MPa" />
              </div>
              <FormulaCard
                title="Poteau BAEL (Faessel)"
                latex={String.raw`\alpha = \frac{0.85}{1 + 0.2(\lambda/35)^2}`}
                description="Coefficient de flambement BAEL"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`\lambda`, meaning: 'Élancement', value: inp.lam },
                    { symbol: String.raw`\alpha`, meaning: 'Coefficient réducteur', value: res.alpha.toFixed(3) },
                ]}
              />
              <DiagList items={diags} />
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
