import { useState, useMemo } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { VoilesInertieVarIeqInputs, VoilesInertieVarIeqOutput } from '../../types/engineering';

export default function Module197() {
  const [inp, setInp] = useState<VoilesInertieVarIeqInputs>({
    b: 10, qb: 1.5, qh: 2.5, E: 33000, heights: [3, 3, 3, 3, 3], inertias: [0.8, 0.8, 0.6, 0.6, 0.4],
  });
  const [txt, setTxt] = useState({ heights: '3, 3, 3, 3, 3', inertias: '0.8, 0.8, 0.6, 0.6, 0.4' });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;
  const payload: VoilesInertieVarIeqInputs = useMemo(() => ({
    ...inp,
    heights: pick(parseList(txt.heights), inp.heights),
    inertias: pick(parseList(txt.inertias), inp.inertias),
  }), [inp, txt]);
  const { data: res, error: err, live } = useModuleCalc<VoilesInertieVarIeqInputs, VoilesInertieVarIeqOutput>(
    'calculate_voiles_inertie_var_ieq_197', payload,
  );
  const S = (k: keyof VoilesInertieVarIeqInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof VoilesInertieVarIeqInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const field = (key: keyof typeof txt, label: string) => (
    <div className="mb-1">
      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
        value={txt[key]} onChange={e => setTxt({ ...txt, [key]: e.target.value })} />
    </div>
  );

  return (
    <Workstation
      title="197 Voiles Inertie Variable Ieq"
      subtitle="Voile cantilever sous vent, inerties d'étage variables + inertie équivalente — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Vent & matériau</div>
          {slider('b', 'Largeur réf. b', 'm', 1, 30, 0.5)}
          {slider('qb', 'Pression base qb', 'kN/m', 0, 10, 0.1)}
          {slider('qh', 'Pression sommet qh', 'kN/m', 0, 10, 0.1)}
          {slider('E', 'Module E', 'MPa', 10000, 60000, 500)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Étages (séparés par virgule)</div>
          {field('heights', 'Hauteurs d\'étage (m)')}
          {field('inertias', 'Inerties (m⁴)')}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Déformée & moment" vbW={600} vbH={240}>
            {res && (() => {
              const maxF = Math.max(...res.f.map(Math.abs), 1e-9);
              const maxM = Math.max(...res.M.map(Math.abs), 1e-9);
              const n = res.z.length - 1;
              const yOf = (i: number) => 220 - (res.z[i] / res.H) * 200;
              const fPts: [number, number][] = res.z.map((_, i) => (
                [80 + (res.f[i] / maxF) * 180, yOf(i)] as [number, number]
              ));
              const mPts: [number, number][] = res.z.map((_, i) => (
                [360 + (Math.abs(res.M[i]) / maxM) * 200, yOf(i)] as [number, number]
              ));
              return (
                <>
                  <line x1={80} y1={10} x2={80} y2={220} stroke="#999" strokeWidth={0.5} />
                  <DiagramOverlay type="deflection" points={fPts} />
                  <text x={170} y={15} fontSize={9} fill="#6366F1" textAnchor="middle">flèche</text>
                  <line x1={360} y1={10} x2={360} y2={220} stroke="#999" strokeWidth={0.5} />
                  <DiagramOverlay type="moment" points={mPts} color="#F59E0B" />
                  <text x={460} y={15} fontSize={9} fill="#F59E0B" textAnchor="middle">|M|</text>
                  <AxisTicks
                    origin={[80, 220]} end={[260, 220]}
                    values={[0, maxF / 2, maxF]}
                    map={(v) => [80 + (v / maxF) * 180, 220]}
                    unit="mm" side="below" decimals={1}
                  />
                  <AxisTicks
                    origin={[360, 220]} end={[560, 220]}
                    values={[0, maxM * 0.5, maxM]}
                    map={(v) => [360 + (v / maxM) * 200, 220]}
                    unit="kN·m" side="below" decimals={0}
                  />
                  <InlineLegend items={[{ label: 'Flèche', color: '#6366F1' }, { label: '|M|', color: '#F59E0B' }]} x={80} y={225} />
                  {res.z.map((zz, i) => (
                    i % Math.max(1, Math.floor(n / 5)) === 0 || i === n ? (
                      <text key={i} x={55} y={yOf(i) + 3} fontSize={7} fill="#94A3B8" textAnchor="end">{zz.toFixed(1)}m</text>
                    ) : null
                  ))}
                </>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['V pied', `${res.V_base.toFixed(1)} kN`],
                  ['M pied', `${res.M_base.toFixed(0)} kN·m`],
                  ['Flèche tête', `${res.f_top.toFixed(1)} mm`],
                  ['Ieq', `${res.Ieq.toFixed(3)} m⁴`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Voile : inertie équivalente"
                latex={String.raw`I_{eq} = \frac{f_{ref}}{f}`}
                description="Cantilever à inerties d'étages"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`I_{eq}`, meaning: 'Inertie uniforme équivalente', value: res.Ieq.toFixed(3), unit: 'm⁴' },
                  { symbol: String.raw`f`, meaning: 'Flèche en tête', value: res.f_top.toFixed(1), unit: 'mm' },
                  { symbol: String.raw`M_{pied}`, meaning: 'Moment en pied', value: res.M_base.toFixed(0), unit: 'kN·m' },
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
