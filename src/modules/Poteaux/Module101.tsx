import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup, rowBars,
} from '../../components/drafting';

interface CurvePoint { m: number; n: number; }

interface InputState {
  fck: number; fyk: number; bx: number; h: number; asc: number; ast: number;
}

const DEFAULT: InputState = {
  fck: 25, fyk: 500, bx: 0.3, h: 0.5, asc: 4, ast: 4,
};

const BAR_PHI = 20;
const BAR_AREA = Math.PI * (BAR_PHI / 2) ** 2;

export default function Module101() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InputState, CurvePoint[]>(
    'calculate_interaction_curve', inp,
  );
  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  const mMax = res && res.length > 0 ? Math.max(...res.map((p) => p.m)) : 0;
  const nMax = res && res.length > 0 ? Math.max(...res.map((p) => p.n)) : 0;

  // ---- section sketch geometry (px) ----
  const Wmm = inp.bx * 1000;
  const Hmm = inp.h * 1000;
  const k = Math.min(300 / Wmm, 220 / Hmm);
  const ox = 220;
  const oy = 50;
  const W = Wmm * k;
  const H = Hmm * k;
  const nBot = Math.max(2, Math.round((inp.asc * 100) / BAR_AREA));
  const nTop = Math.max(2, Math.round((inp.ast * 100) / BAR_AREA));

  const status = !res ? 'computing' : res.length > 0 ? 'pass' : 'computing';

  return (
    <Workstation
      title="101 Interaction M-N"
      subtitle="D'après EGF N°101 © Henry Thonier — EC2/BAEL"
      eurocode="EC2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('bx', 'bx', 'm', 0.1, 2, 0.05)}
          {slider('h', 'h', 'm', 0.15, 2, 0.05)}
          {slider('asc', 'Asc', 'cm²', 0, 100, 0.5)}
          {slider('ast', 'Ast', 'cm²', 0, 100, 0.5)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section + armatures" vbW={600} vbH={340} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
              <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
              <RebarGroup
                bars={[
                  ...rowBars(nBot, ox + 14, ox + W - 14, oy + H - 24, BAR_PHI),
                  ...rowBars(nTop, ox + 14, ox + W - 14, oy + 24, BAR_PHI),
                ]}
                pxPerMm={k}
              />
              <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} text={`bx = ${inp.bx} m`} />
              <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`h = ${inp.h} m`} />
            </SectionCanvas>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <h2 className="text-sm font-bold mb-2">Courbe d&apos;interaction M-N</h2>
            <div className="h-[400px]">
              {!res || res.length === 0 ? (
                <p className="text-xs text-slate-500 text-center pt-16">{err ?? 'computing…'}</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={res}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="m" type="number" name="M" unit=" kNm" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="n" type="number" name="N" unit=" kN" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="n" stroke="#2563eb" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Points', `${res.length}`],
                  ['M max', `${mMax.toFixed(1)} kNm`],
                  ['N max', `${nMax.toFixed(0)} kN`],
                  ['As tot', `${(inp.asc + inp.ast).toFixed(1)} cm²`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Interaction M-N (EC2 §6.1)"
                latex={String.raw`N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}`}
                description="Équilibre de la section en flexion composée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{max}`, meaning: 'Moment résistant max’, value: mMax.toFixed(1), unit: ’kNm' },
                  { symbol: String.raw`N_{max}`, meaning: 'Effort résistant max’, value: nMax.toFixed(0), unit: ’kN' },
                  { symbol: String.raw`A_s`, meaning: 'Aciers totaux’, value: (inp.asc + inp.ast).toFixed(1), unit: ’cm²' },
                ]}
              />
              <ul className="text-xs space-y-1.5">
                <li className="font-mono text-slate-600 dark:text-slate-400">
                  Section {inp.bx}×{inp.h} m — fck={inp.fck} MPa, fyk={inp.fyk} MPa
                </li>
                <li className="font-mono text-slate-600 dark:text-slate-400">
                  {res.length} points sur la courbe enveloppe
                </li>
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
