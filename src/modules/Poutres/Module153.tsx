import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup, rowBars, StressStrainBlock, DiagramOverlay,
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

export default function Module153() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InputState, Res153>(
    'calculate_flexion_as_flech_153', inp,
  );
  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

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

  const mu = (inp.med * 1e6) / (inp.b * inp.d * inp.d * (inp.fck / 1.5));
  const status = !res ? 'computing' : res.is_balanced ? 'warn' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="153 Flexion As fléchie"
      subtitle="D'après EGF N°153 © Henry Thonier — RUST"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériau</div>
          {slider('fck', 'fck', 'MPa', 10, 80, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('fctm', 'fctm', 'MPa', 1, 6, 0.1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'b', 'mm', 100, 2000, 10)}
          {slider('h', 'h', 'mm', 100, 2000, 10)}
          {slider('bw', 'bw', 'mm', 0, 2000, 10)}
          {slider('hf', 'hf', 'mm', 0, 500, 10)}
          {slider('d', 'd', 'mm', 50, 2000, 5)}
          {slider('dp', "d'", 'mm', 20, 500, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation</div>
          {slider('med', 'MEd', 'kN.m', 0, 10000, 5)}
          {slider('ned', 'NEd', 'kN', -5000, 5000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Enveloppe</div>
          {slider('ln', 'Ln', 'm', 1, 30, 0.5)}
          {slider('p_uni', 'p uni', 'kN/m', 0, 200, 2)}
          {slider('mg', 'Mg', 'kN.m', 0, 500, 5)}
          {slider('md', 'Md', 'kN.m', 0, 500, 5)}
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
              {res && <StressStrainBlock x={ox} yTop={oy} hPx={H} xNa={xNaPx} wPx={70} />}
              <RebarGroup
                bars={[
                  ...rowBars(nBot, ox + (W - wWeb) / 2 + 12, ox + (W + wWeb) / 2 - 12, ySteel, BAR_PHI),
                  ...rowBars(nTop, ox + (W - wWeb) / 2 + 12, ox + (W + wWeb) / 2 - 12, yTop2, BAR_PHI),
                ]}
                pxPerMm={k}
              />
              <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} text={`b = ${inp.b}`} />
              <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`h = ${inp.h}`} />
              <DimensionLine x1={ox + W} y1={oy} x2={ox + W} y2={ySteel} offset={22} text={`d = ${inp.d}`} />
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Enveloppe de moment" vbW={600} vbH={220} grid={20}>
              <line x1={60} y1={180} x2={570} y2={180} stroke="#475569" strokeWidth={1} />
              <line x1={70} y1={20} x2={70} y2={180} stroke="#475569" strokeWidth={1} />
              <DiagramOverlay type="moment" points={env.pts} />
              {res && env.mx > 0 && (
                <>
                  <circle cx={70 + (res.xr_max / inp.ln) * 460} cy={180 - (res.mx_max / env.mx) * 140} r={4} fill="#ef4444" />
                  <text x={76 + (res.xr_max / inp.ln) * 460} y={174 - (res.mx_max / env.mx) * 140} fontSize={11} fill="#ef4444">
                    M={res.mx_max.toFixed(1)}
                  </text>
                </>
              )}
              <text x={315} y={208} textAnchor="middle" fontSize={10} fill="#94a3b8">x (m)</text>
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
                  ['x_NA', `${res.x_na.toFixed(1)} mm`],
                  ['As ten', `${res.acs.toFixed(0)} mm²`],
                  ['As com', `${res.aci.toFixed(0)} mm²`],
                  ['As_min', `${res.ac_min.toFixed(0)} mm²`],
                  ['σc', `${res.sigma_c.toFixed(2)} MPa`],
                  ['σs', `${res.sigma_s.toFixed(2)} MPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flexion ELU"
                latex={String.raw`\mu = \frac{M_{Ed}}{b d^2 f_{cd}} \quad A_s = \frac{M_{Ed}}{z f_{yd}}`}
                description="Enveloppe de moments, table de compression"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\mu`, meaning: 'Moment réduit', value: mu.toFixed(3) },
                  { symbol: String.raw`A_s`, meaning: 'Acier tendu', value: res.acs.toFixed(0), unit: 'mm²' },
                  { symbol: String.raw`x_{NA}`, meaning: 'Axe neutre', value: res.x_na.toFixed(1), unit: 'mm' },
                ]}
              />
              <ul className="text-xs space-y-1.5">
                <li className="text-slate-500">— verdict: {res.verdict}</li>
                <li className="font-mono text-slate-600 dark:text-slate-400">Mode: {res.mode}</li>
                {res.is_balanced && <li className="font-mono text-red-500">ATTENTION : section proche de l'équilibre</li>}
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
