import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { DallLignesDeRuptureInputs, DallLignesDeRuptureOutput } from '../../types/engineering';

export default function Module174() {
  const [inp, setInp] = useState<DallLignesDeRuptureInputs>({
    mu: 15.0, Lx: 6.0, Ly: 5.0, pas: 10, iter: 3,
  });
  const { data: res, error: err, live } = useModuleCalc<DallLignesDeRuptureInputs, DallLignesDeRuptureOutput>(
    'calculate_dall_lignes_de_rupture_174', inp,
  );
  const S = (k: keyof DallLignesDeRuptureInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DallLignesDeRuptureInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 20;
  const w = 350, h = w * inp.Ly / inp.Lx;

  return (
    <Workstation
      title="174 Dall lignes de rupture"
      subtitle="Méthode des lignes de rupture (yield line) — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie & Matériaux</div>
          {slider('mu', 'μ (moment/plage)', 'kN·m/m', 1, 100, 1)}
          {slider('Lx', 'Lx', 'm', 1, 15, 0.5)}
          {slider('Ly', 'Ly', 'm', 1, 15, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Paramètres numériques</div>
          {slider('pas', 'Pas', '', 2, 50, 1)}
          {slider('iter', 'Itérations', '', 1, 20, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Lignes de rupture" vbW={500} vbH={200}>
            <rect x={ox} y={oy} width={w} height={h} fill="#F3F4F6" stroke="#64748B" strokeWidth={2} />
            <line x1={ox} y1={oy} x2={ox + w} y2={oy + h} stroke="#EF4444" strokeWidth={2} strokeDasharray="6,3" />
            <line x1={ox + w} y1={oy} x2={ox} y2={oy + h} stroke="#EF4444" strokeWidth={2} strokeDasharray="6,3" />
            <DimensionLine x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} offset={14} text={`Lx = ${inp.Lx} m`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + h} offset={-24} text={`Ly = ${inp.Ly} m`} />
            <text x={ox + w + 10} y={oy + h / 2} fontSize={9} fill="#EF4444">
              μ = {inp.mu} kN·m/m
            </text>
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['M/mu', res.mom.toFixed(4)],
                  ['mu × M/mu', `${res.mu_mom.toFixed(2)} kN·m`],
                  ['Aire', `${res.area.toFixed(2)} m²`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Lignes de rupture"
                latex={String.raw`W_{ext} = W_{int} \;\Rightarrow\; m_p`}
                description="Travail virtuel, optimisation"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`m_p`, meaning: 'Moment plastique', value: res.mu_mom.toFixed(2), unit: 'kN·m' },
                  { symbol: String.raw`M/\mu`, meaning: 'Facteur', value: res.mom.toFixed(4) },
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
