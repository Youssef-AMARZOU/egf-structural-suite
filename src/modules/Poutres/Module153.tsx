import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { StatTile } from '../../components/common/StatTile';
import { DiagList, type DiagItem } from '../../components/common/DiagList';
import { RatioGauge } from '../../components/common/RatioGauge';
import { Accordion } from '../../components/common/Accordion';
import {
  SectionCanvas, DimensionLine, RebarGroup, rowBars, StressStrainBlock, DiagramOverlay,
  AxisTicks, InlineLegend,
} from '../../components/drafting';

interface InputState {
  fck: number; fyk: number; b: number; h: number; bw: number; hf: number;
  d: number; dp: number; med: number; ned: number; hx: number; ln: number;
  p_uni: number; mg: number; md: number; neq: number; fctm: number; n_ite: number;
}

const DEFAULT: InputState = {
  fck: 25.0, fyk: 500.0, b: 300.0, h: 500.0, bw: 200.0, hf: 120.0,
  d: 440.0, dp: 60.0, med: 150.0, ned: 0.0, hx: 250.0, ln: 6.0,
  p_uni: 20.0, mg: 50.0, md: 80.0, neq: 6.0, fctm: 2.6, n_ite: 100,
};

interface Res153 {
  x_na: number; acs: number; aci: number; ac_min: number;
  sigma_c: number; sigma_s: number; mx_max: number; xr_max: number;
  mode: string; is_balanced: boolean; verdict: string; diag: string[];
}

const BAR_PHI = 20;
const BAR_AREA = Math.PI * (BAR_PHI / 2) ** 2;
const MU_LIM = 0.372; // EC2 pivot B, sans redistribution

export default function Module153() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live, lastMs } = useModuleCalc<InputState, Res153>(
    'calculate_flexion_as_flech_153', inp,
  );
  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const mu = (inp.med * 1e6) / (inp.b * inp.d * inp.d * (inp.fck / 1.5));
  const eta = mu / MU_LIM;
  const status = err ? 'fail' : !res ? 'computing' : res.is_balanced ? 'warn' : eta > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step: number, symbol?: string,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} symbol={symbol} />
  );

  // ---- section geometry (px) ----
  const k = Math.min(300 / inp.b, 220 / inp.h);
  const ox = 170;
  const oy = 50;
  const W = inp.b * k;
  const H = inp.h * k;
  const hFl = Math.max(0, Math.min(H, inp.hf * k));
  const wWeb = Math.max(8, inp.bw * k);
  const ySteel = oy + inp.d * k;
  const yTop2 = oy + inp.dp * k;
  const xNaPx = res ? (res.x_na * k) : H / 2;
  const nBot = res ? Math.max(2, Math.round(res.acs / BAR_AREA)) : 3;
  const nTop = res && res.aci > 50 ? Math.max(2, Math.round(res.aci / BAR_AREA)) : 0;

  // ---- moment envelope points ----
  const env = (() => {
    const pts: [number, number][] = [];
    const n = 60;
    let mx = 0;
    const ms: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * inp.ln;
      const m = inp.p_uni * x * (inp.ln - x) / 2 + (1 - x / inp.ln) * inp.mg + (x / inp.ln) * inp.md;
      ms.push(m);
      if (m > mx) mx = m;
    }
    for (let i = 0; i <= n; i++) {
      const xPx = 70 + (i / n) * 460;
      const yPx = 180 - (mx > 0 ? (ms[i] / mx) * 140 : 0);
      pts.push([xPx, yPx]);
    }
    return { pts, mx };
  })();

  const diags: DiagItem[] = res ? [
    { severity: res.is_balanced ? 'warn' : 'info', message: `Mode : ${res.mode}` },
    ...(res.is_balanced
      ? [{ severity: 'warn' as const, message: 'Section proche de l’équilibre — augmenter h ou passer en section doublement armée.' }]
      : []),
    { severity: eta > 1 ? 'fail' : 'ok', message: `μ = ${mu.toFixed(3)} (limite ${MU_LIM}).` },
    ...res.diag.map((d): DiagItem => ({ severity: 'info', message: d })),
  ] : [];

  return (
    <Workstation
      title="153 Flexion As fléchie"
      subtitle="D'après EGF N°153 © Henry Thonier"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      liveMs={lastMs}
      category="Poutres"
      eta={eta}
      verdict={res?.verdict}
      figures={res ? [
        { label: 'Moment MEd', value: inp.med.toFixed(1), unit: 'kN·m' },
        { label: 'As tendu', value: res.acs.toFixed(0), unit: 'mm²' },
        { label: 'Ratio μ/μlim', value: eta.toFixed(3), unit: '' },
        { label: 'Axe neutre', value: res.x_na.toFixed(1), unit: 'mm' },
      ] : []}
      presets={[
        { label: 'Isostatique', apply: () => setInp((p) => ({ ...p, mg: 0, md: 0 })) },
        { label: 'Continue', apply: () => setInp((p) => ({ ...p, mg: 50, md: 80 })) },
        { label: 'Console', apply: () => setInp((p) => ({ ...p, mg: 150, md: 0 })) },
      ]}
      params={
        <>
          <Accordion title="Géométrie" count={6} defaultOpen>
            {slider('b', 'Largeur', 'mm', 100, 2000, 10, 'b')}
            {slider('h', 'Hauteur totale', 'mm', 100, 2000, 10, 'h')}
            {slider('bw', 'Nervure', 'mm', 0, 2000, 10, 'b_w')}
            {slider('hf', 'Table', 'mm', 0, 500, 10, 'h_f')}
            {slider('d', 'Hauteur utile', 'mm', 50, 2000, 5, 'd')}
            {slider('dp', 'Enrobage sup', 'mm', 20, 500, 5, "d'")}
          </Accordion>
          <Accordion title="Matériaux & béton" count={4}>
            {slider('fck', 'Résistance béton', 'MPa', 10, 80, 1, 'f_{ck}')}
            {slider('fyk', 'Limite acier', 'MPa', 400, 600, 10, 'f_{yk}')}
            {slider('fctm', 'Traction béton', 'MPa', 1, 6, 0.1, 'f_{ctm}')}
            {slider('neq', 'Équivalence', '-', 1, 15, 0.5, 'n_{eq}')}
          </Accordion>
          <Accordion title="Sollicitations ELU/ELS" count={3}>
            {slider('med', 'Moment', 'kN·m', 0, 10000, 5, 'M_{Ed}')}
            {slider('ned', 'Effort normal', 'kN', -5000, 5000, 10, 'N_{Ed}')}
            {slider('hx', 'Position', 'mm', 0, 2000, 5, 'x')}
          </Accordion>
          <Accordion title="Enveloppe de moment" count={4}>
            {slider('ln', 'Portée', 'm', 1, 30, 0.5, 'L_n')}
            {slider('p_uni', 'Charge uniforme', 'kN/m', 0, 200, 2, 'p')}
            {slider('mg', 'Moment gauche', 'kN·m', 0, 500, 5, 'M_g')}
            {slider('md', 'Moment droit', 'kN·m', 0, 500, 5, 'M_d')}
          </Accordion>
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section en T + bloc P-R" vbW={600} vbH={340} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
              {hFl > 0 ? (
                <>
                  <rect x={ox} y={oy} width={W} height={hFl} fill="#60a5fa" opacity={0.3} stroke="#3b82f6" strokeWidth={1.2} />
                  <rect x={ox + (W - wWeb) / 2} y={oy + hFl} width={wWeb} height={H - hFl} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
                </>
              ) : (
                <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
              )}
              {res && <StressStrainBlock x={ox} yTop={oy} hPx={H} xNa={xNaPx} wPx={70} naValue={`xu = ${res.x_na.toFixed(0)} mm`} />}
              <RebarGroup
                bars={[
                  ...rowBars(nBot, ox + (W - wWeb) / 2 + 12, ox + (W + wWeb) / 2 - 12, ySteel, BAR_PHI),
                  ...rowBars(nTop, ox + (W - wWeb) / 2 + 12, ox + (W + wWeb) / 2 - 12, yTop2, BAR_PHI),
                ]}
                pxPerMm={k}
              />
              <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} ticks="tick45" text={`b = ${inp.b}`} />
              <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} ticks="tick45" text={`h = ${inp.h}`} />
              <DimensionLine x1={ox + W} y1={oy} x2={ox + W} y2={ySteel} offset={22} text={`d = ${inp.d}`} />
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Enveloppe de moment" vbW={600} vbH={220} grid={20}>
              <line x1={60} y1={180} x2={570} y2={180} stroke="#475569" strokeWidth={1} />
              <line x1={70} y1={20} x2={70} y2={180} stroke="#475569" strokeWidth={1} />
              <DiagramOverlay type="moment" points={env.pts} />
              {res && env.mx > 0 && (() => {
                const maxY = Math.max(...env.pts.map(([, y]) => y));
                const minM = (180 - maxY) * env.mx / 140;
                const yVals = [...new Set([minM, 0, env.mx])].sort((a, b) => a - b)
                  .filter((v, i, a) => i === 0 || Math.abs(((a[i - 1] / env.mx) * 140) - ((v / env.mx) * 140)) >= 15);
                return (
                  <>
                    <circle cx={70 + (res.xr_max / inp.ln) * 460} cy={180 - (res.mx_max / env.mx) * 140} r={4} fill="#ef4444" />
                    <text x={76 + (res.xr_max / inp.ln) * 460} y={174 - (res.mx_max / env.mx) * 140} fontSize={11} fill="#ef4444">
                      M={res.mx_max.toFixed(1)}
                    </text>
                    <AxisTicks
                      origin={[70, 180]}
                      end={[530, 180]}
                      values={[0, inp.ln / 2, inp.ln]}
                      map={(v) => [70 + (v / inp.ln) * 460, 180]}
                      unit="m"
                      side="below"
                      decimals={1}
                    />
                    <AxisTicks
                      origin={[70, 20]}
                      end={[70, 180]}
                      values={yVals}
                      map={(v) => [70, 180 - (v / env.mx) * 140]}
                      unit="kN·m"
                      side="left"
                      decimals={0}
                    />
                  </>
                );
              })()}
            </SectionCanvas>
          </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="flex items-center gap-3">
                <RatioGauge eta={eta} size={132} />
                <div className="grid grid-cols-2 gap-2 flex-1 text-xs font-mono">
                  <StatTile label="As tendu" value={res.acs.toFixed(0)} unit="mm²" />
                  <StatTile label="As comprimé" value={res.aci.toFixed(0)} unit="mm²" />
                  <StatTile label="σc" value={res.sigma_c.toFixed(2)} unit="MPa" />
                  <StatTile label="σs" value={res.sigma_s.toFixed(2)} unit="MPa" />
                </div>
              </div>
              <FormulaCard
                title="Flexion ELU"
                latex={String.raw`\mu = \frac{M_{Ed}}{b d^2 f_{cd}} \quad A_s = \frac{M_{Ed}}{z f_{yd}}`}
                description="Enveloppe de moments, table de compression"
                status={status === 'computing' || status === 'neutral' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\mu`, meaning: 'Moment réduit', value: mu.toFixed(3) },
                  { symbol: String.raw`A_s`, meaning: 'Acier tendu', value: res.acs.toFixed(0), unit: 'mm²' },
                  { symbol: String.raw`x_u`, meaning: 'Axe neutre', value: res.x_na.toFixed(1), unit: 'mm' },
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
