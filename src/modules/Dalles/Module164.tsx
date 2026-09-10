import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { Dalle4apBpVoilePignonInputs, Dalle4apBpVoilePignonOutput } from '../../types/engineering';

export default function Module164() {
  const [inp, setInp] = useState<Dalle4apBpVoilePignonInputs>({
    h: 200, E: 30000, nu: 0.2, LA: 6.0, LB: 5.0,
    loads: [{ P0: 0.005, A1: 0, A2: 6.0, B1: 0, B2: 5.0 }],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15, d: 170,
  });
  const { data: res, error: err, live } = useModuleCalc<Dalle4apBpVoilePignonInputs, Dalle4apBpVoilePignonOutput>(
    'calculate_dalle4ap_bp_voile_pignon_164', inp,
  );
  const S = (k: keyof Dalle4apBpVoilePignonInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addLoad = () => setInp({ ...inp, loads: [...inp.loads, { P0: 0.003, A1: 1, A2: 2, B1: 1, B2: 2 }] });
  const removeLoad = (i: number) => setInp({ ...inp, loads: inp.loads.filter((_, j) => j !== i) });
  const updateLoad = (i: number, field: string, v: number) => {
    const l = [...inp.loads];
    (l[i] as any)[field] = v;
    setInp({ ...inp, loads: l });
  };

  const status = !res ? 'computing'
    : /KO|non/i.test(res.verdict) ? 'fail'
    : /OK/i.test(res.verdict) ? 'pass' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Dalle4apBpVoilePignonInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 30, w = 400, h = 280;
  const scX = w / inp.LA;
  const scY = h / inp.LB;

  return (
    <Workstation
      title="164 Dalle4ap BP voile pignon"
      subtitle="Dalle sur 4 appuis — charges partielles Navier + vérification ELU/ELS — RUST"
      eurocode="EC2 §9.3"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie dalle</div>
          {slider('h', 'h', 'mm', 50, 600, 10)}
          {slider('E', 'E', 'MPa', 10000, 60000, 1000)}
          {slider('nu', 'ν', '', 0.05, 0.4, 0.01)}
          {slider('LA', 'LA', 'm', 1, 15, 0.5)}
          {slider('LB', 'LB', 'm', 1, 15, 0.5)}
          {slider('d', 'd', 'mm', 50, 550, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges rectangulaires (P0 en MN/m²)</div>
          {inp.loads.map((lc, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Cas {i + 1}</span>
                {inp.loads.length > 1 && (
                  <button onClick={() => removeLoad(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="P0" unit="MN/m²" value={lc.P0} min={0} max={0.05} step={0.001} onChange={v => updateLoad(i, 'P0', v)} />
              <ParamSlider label="A1" unit="m" value={lc.A1} min={0} max={15} step={0.5} onChange={v => updateLoad(i, 'A1', v)} />
              <ParamSlider label="ΔA" unit="m" value={lc.A2} min={0.5} max={15} step={0.5} onChange={v => updateLoad(i, 'A2', v)} />
              <ParamSlider label="B1" unit="m" value={lc.B1} min={0} max={15} step={0.5} onChange={v => updateLoad(i, 'B1', v)} />
              <ParamSlider label="ΔB" unit="m" value={lc.B2} min={0.5} max={15} step={0.5} onChange={v => updateLoad(i, 'B2', v)} />
            </div>
          ))}
          <button onClick={addLoad} className="text-blue-600 text-sm mt-1">+ Ajouter cas de charge</button>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Plan dalle — distribution Mx" vbW={500} vbH={350}>
            <rect x={ox} y={oy} width={w} height={h} fill="#f8fafc" stroke="#6366F1" strokeWidth={2} />
            {inp.loads.map((lc, i) => (
              <rect key={i} x={ox + lc.A1 * scX} y={oy + lc.B1 * scY} width={lc.A2 * scX} height={lc.B2 * scY}
                fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1} opacity={0.7} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = ox + (i + 1) / 6 * w;
              return <line key={i} x1={x} y1={oy} x2={x} y2={oy + h} stroke="#E5E7EB" strokeWidth={0.5} />;
            })}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = oy + (i + 1) / 5 * h;
              return <line key={i} x1={ox} y1={y} x2={ox + w} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />;
            })}
            <DimensionLine x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} offset={18} text={`LA = ${inp.LA} m`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + h} offset={-22} text={`LB = ${inp.LB} m`} />
            {res && (
              <>
                <text x={ox + w / 2} y={oy - 10} fontSize={11} fill="#374151" textAnchor="middle">
                  Mx_max = {res.mx_max.toFixed(2)} kN·m/m
                </text>
                <text x={ox + w / 2} y={oy + h + 35} fontSize={10} fill="#999" textAnchor="middle">
                  Asx = {res.asx_els.toFixed(0)} mm²/m, MRDx = {res.mrdu.toFixed(1)} kN·m/m
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
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Mx_max', `${res.mx_max.toFixed(2)} kN·m/m`],
                  ['My_max', `${res.my_max.toFixed(2)} kN·m/m`],
                  ['Vx_max', `${res.vx_max.toFixed(2)} kN/m`],
                  ['Vy_max', `${res.vy_max.toFixed(2)} kN/m`],
                  ['w_max', `${res.w_max.toFixed(3)} mm`],
                  ['Asx_ELS', `${res.asx_els.toFixed(0)} mm²/m`],
                  ['Asy_ELS', `${res.asy_els.toFixed(0)} mm²/m`],
                  ['MRDx', `${res.mrdu.toFixed(1)} kN·m/m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Dalle Navier + acier"
                latex={String.raw`a_{mn} = \frac{q_{mn}}{\pi^4 D(m^2/a^2 + n^2/b^2)^2}`}
                description="Série de Navier + dimensionnement"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{x,max}`, meaning: 'Moment max', value: res.mx_max.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`A_{sx}`, meaning: 'Acier ELS', value: res.asx_els.toFixed(0), unit: 'mm²/m' },
                  { symbol: String.raw`M_{RDx}`, meaning: 'Capacité', value: res.mrdu.toFixed(1), unit: 'kN·m/m' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.verdict.includes('OK') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
