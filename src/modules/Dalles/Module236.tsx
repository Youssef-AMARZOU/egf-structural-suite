import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { DalleRectTrapInputs, DalleRectTrapOutput } from '../../types/engineering';

export default function Module236() {
  const [inp, setInp] = useState<DalleRectTrapInputs>({
    lx: 5, ly: 6, q0: 8, q1: 14, h: 200, e_mpa: 33000, m_rd: 0,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleRectTrapInputs, DalleRectTrapOutput>(
    'calculate_dalle_rect_trap_236', inp,
  );
  const S = (k: keyof DalleRectTrapInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : inp.m_rd > 0 && res.ratio > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleRectTrapInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- trapezoidal load plan view (400x200 canvas) ----
  const x0 = 60, W = 280, y0 = 120;
  const qMax = Math.max(inp.q0, inp.q1, 0.01);
  const h0 = (inp.q0 / qMax) * 70, h1 = (inp.q1 / qMax) * 70;

  return (
    <Workstation
      title="236 Dalle rectangulaire, charge trapézoïdale"
      subtitle="Bandes de Marcus + poutre trapèze exacte — mx, my, flèche — RUST"
      eurocode="Marcus · EC2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Dalle</div>
          {slider('lx', 'Lx (sens charge)', 'm', 1, 12, 0.25)}
          {slider('ly', 'Ly', 'm', 1, 12, 0.25)}
          {slider('h', 'Hauteur dalle h', 'mm', 80, 500, 10)}
          {slider('e_mpa', 'Module E', 'MPa', 20000, 45000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charge & résistance</div>
          {slider('q0', 'q0 (x=0)', 'kN/m²', 0, 50, 0.5)}
          {slider('q1', 'q1 (x=Lx)', 'kN/m²', 0, 50, 0.5)}
          {slider('m_rd', 'MRd (0=sans vérif)', 'kN·m/m', 0, 200, 1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Charge trapézoïdale (vue en plan)" vbW={400} vbH={200}>
            <rect x={x0} y={y0} width={W} height={50} fill="#DBEAFE" opacity={0.5} stroke="#64748b" strokeWidth={2} />
            <polygon
              points={`${x0},${y0} ${x0},${y0 - h0} ${x0 + W},${y0 - h1} ${x0 + W},${y0}`}
              fill="#3B82F6" opacity={0.45} stroke="#1D4ED8"
            />
            <text x={x0} y={y0 - h0 - 6} fontSize={10} fill="#1D4ED8">q0={inp.q0}</text>
            <text x={x0 + W - 34} y={y0 - h1 - 6} fontSize={10} fill="#1D4ED8">q1={inp.q1}</text>
            <DimensionLine x1={x0} y1={y0 + 50} x2={x0 + W} y2={y0 + 50} offset={14} text={`Lx=${inp.lx} × Ly=${inp.ly}`} />
            {res && (
              <text x={200} y={192} fontSize={10} fill="#22C55E" textAnchor="middle">
                mx={res.mx.toFixed(1)}, my={res.my.toFixed(1)}
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
                  ['mx', `${res.mx.toFixed(2)} kN·m/m`],
                  ['my', `${res.my.toFixed(2)} kN·m/m`],
                  ['x(mx)', `${res.x_mx.toFixed(2)} m`],
                  ['Flèche', `${res.fleche.toFixed(1)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Dalle trapézoïdale (Marcus)"
                latex={String.raw`m_x = \alpha_x p l_x^2`}
                description="Poutre-trapèze + clé de Marcus"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`m_x`, meaning: 'Moment sens x', value: res.mx.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`m_y`, meaning: 'Moment sens y', value: res.my.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`f`, meaning: 'Flèche', value: res.fleche.toFixed(1), unit: 'mm' },
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
