import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { SemelleCirculaireInputs, SemelleCirculaireOutput } from '../../types/engineering';

export default function Module188() {
  const [inp, setInp] = useState<SemelleCirculaireInputs>({
    D: 2.4, h: 0.6, d: 0.54, c_col: 0.4, Df: 1.0, N_ed: 1200, M_ed: 150, V_ed: 60,
    gamma_sol: 19, c: 10, phi_deg: 28, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  });
  const { data: res, error: err, live } = useModuleCalc<SemelleCirculaireInputs, SemelleCirculaireOutput>(
    'calculate_semelle_circulaire_188', inp,
  );
  const S = (k: keyof SemelleCirculaireInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.verdict.startsWith('OK') ? 'pass' : 'fail';

  const slider = (
    key: keyof SemelleCirculaireInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="188 Semelle Circulaire"
      subtitle="EC7 + EC2, principes premiers (sans VBA : classeur à formules) — N+M, glissement, flexion, poinçonnement — RUST"
      eurocode="EC7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Semelle & charges</div>
          {slider('D', 'D', 'm', 1, 6, 0.1)}
          {slider('h', 'h', 'm', 0.2, 2, 0.05)}
          {slider('d', 'd', 'm', 0.2, 1.8, 0.05)}
          {slider('c_col', 'c_col (fût)', 'm', 0.2, 1, 0.05)}
          {slider('N_ed', 'N_ed', 'kN', 0, 5000, 50)}
          {slider('M_ed', 'M_ed', 'kN.m', 0, 1000, 10)}
          {slider('V_ed', 'V_ed', 'kN', 0, 500, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sol & matériaux</div>
          {slider('Df', 'Df (encastrement)', 'm', 0, 5, 0.1)}
          {slider('gamma_sol', 'γ_sol', 'kN/m³', 10, 25, 0.5)}
          {slider('c', "c'", 'kPa', 0, 100, 1)}
          {slider('phi_deg', "φ'", '°', 15, 40, 0.5)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Diagramme de contrainte sous la semelle" vbW={600} vbH={160}>
            {res && (() => {
              const qmax = Math.max(res.q_max, 1);
              const qmin = Math.max(res.q_min, 0);
              const h1 = 100 * res.q_max / qmax;
              const h2 = 100 * qmin / qmax;
              return (
                <>
                  <ellipse cx={300} cy={120} rx={220} ry={18} fill="#E2E8F0" stroke="#64748B" />
                  <polygon points={`80,120 520,120 520,${120 - h1} 80,${120 - h2}`} fill="#6366F1" opacity={0.55} />
                  <DimensionLine x1={80} y1={120} x2={520} y2={120} offset={28} text={`D = ${inp.D} m — contact ${res.contact}`} />
                  <text x={525} y={120 - h1} fontSize={9} fill="#6366F1">qmax={res.q_max.toFixed(0)}</text>
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
                  ['q_max', `${res.q_max.toFixed(1)} kPa`],
                  ['q_Ed / q_Rd', `${res.q_ed.toFixed(0)} / ${res.q_rd.toFixed(0)} kPa`],
                  ['As', `${res.As_req.toFixed(2)} cm²/m`],
                  ['Contact', `${res.contact} (e=${res.e.toFixed(3)}m)`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Semelle circulaire (EC7)"
                latex={String.raw`e = \frac{M_{Ed}}{N_{Ed}} \quad q = \frac{N}{A'} \le q_{Rd}`}
                description="Section réduite de Meyerhof"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`e`, meaning: 'Excentrement', value: res.e.toFixed(3), unit: 'm' },
                  { symbol: String.raw`q_{max}`, meaning: 'Contrainte max', value: res.q_max.toFixed(1), unit: 'kPa' },
                  { symbol: String.raw`q_{Rd}`, meaning: 'Contrainte admissible', value: res.q_rd.toFixed(0), unit: 'kPa' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.verdict.startsWith('OK') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
