import { useState } from 'react';
import type { InteracCircInputs, InteracCircOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: InteracCircInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15, euk: 0.02,
  phi: 400, n_bars: 8, d_bar: 20, cover: 40,
  n_sec: 50, m_ed: 500, n_ed: 2000,
  diagram: 'parabola',
};


export default function Module137() {
  const [inp, setInp] = useState<InteracCircInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InteracCircInputs, InteracCircOutput>(
    'calculate_interac_circ_137', inp,
  );
  const S = (k: keyof InteracCircInputs) => (v: number | string) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : res.ratio_nm <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof InteracCircInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="137 Interac. Circulaire"
      subtitle="Courbe N-M section circulaire — EC2 §6.1"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
          <ParamSlider label="εuk" unit="‰" value={inp.euk * 1000} min={10} max={50} step={1} onChange={(v) => S('euk')(v / 1000)} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('phi', 'φ', 'mm', 100, 2000, 10)}
          {slider('n_bars', 'Nb barres', '-', 4, 32, 1)}
          {slider('d_bar', 'φ barre', 'mm', 6, 50, 2)}
          {slider('cover', 'Couverture', 'mm', 15, 100, 5)}
          {slider('n_sec', 'Nb sections', '-', 20, 200, 5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n_ed', 'NEd', 'kN', 0, 50000, 100)}
          {slider('m_ed', 'MEd', 'kN·m', 0, 5000, 10)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Courbe d'interaction N-M" vbW={400} vbH={250}>
            {res && (() => {
              const ox = 50, oy = 120, w = 320, h = 200;
              const maxN = Math.max(...res.n_resist.map(Math.abs), 1);
              const maxM = Math.max(...res.m_resist.map(Math.abs), 1);
              const scN = h / maxN / 2;
              const scM = w / maxM / 2;
              const cx = ox + w / 2;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={cx} y1={10} x2={cx} y2={240} stroke="#94a3b8" strokeWidth={0.5} />

                  {res.n_resist.map((n, i) => {
                    if (i === 0) return null;
                    const m1 = res.m_resist[i - 1] * scM;
                    const n1 = res.n_resist[i - 1] * scN;
                    const m2 = res.m_resist[i] * scM;
                    const n2 = res.n_resist[i] * scN;
                    return (
                      <line
                        key={i}
                        x1={cx + m1} y1={oy - n1}
                        x2={cx + m2} y2={oy - n2}
                        stroke="#2563eb" strokeWidth={1.5}
                      />
                    );
                  })}

                  {res.m_demand.length > 1 && (
                    <polyline
                      points={res.m_demand.map((m, i) => `${cx + m * scM},${oy - res.n_demand[i] * scN}`).join(' ')}
                      fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,2"
                    />
                  )}

                  <circle cx={cx + res.m_demand[res.m_demand.length - 1] * scM} cy={oy - res.n_demand[res.n_demand.length - 1] * scN} r={3} fill="#ef4444" />

                  <text x={cx} y={248} textAnchor="middle" fontSize={6} fill="#64748b">M (kN·m)</text>
                  <text x={15} y={oy + 3} textAnchor="middle" fontSize={6} fill="#64748b">N (kN)</text>
                  <text x={cx + w / 2} y={248} textAnchor="middle" fontSize={5} fill="#2563eb">Courbe N-M</text>
                  <text x={cx + w / 2} y={240} textAnchor="middle" fontSize={5} fill="#ef4444">Point de calcul</text>
                </g>
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
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>N₀ = <b>{res.n0.toFixed(0)}</b> kN</div>
              <div>ρ_prov = <b>{res.rho_prov.toFixed(2)}</b>% | ρ_min = <b>{res.rho_min.toFixed(0)}</b> mm²</div>
              <div>μ = <b>{res.mu.toFixed(2)}</b> | ν = <b>{res.nu.toFixed(2)}</b></div>
              <div>Ratio NM = <b>{res.ratio_nm.toFixed(2)}</b></div>
              <div>Ratio N = <b>{res.ratio_n.toFixed(2)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Interaction circulaire"
                latex={String.raw`N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}`}
                description="Poteau circulaire, Sargin + P-R"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N_{Ed}`, meaning: 'Effort normal', value: res.n0.toFixed(0) },
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment', value: res.rho_prov.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <div className="space-y-2">
            {res.diag.map((d, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className={res.ratio_nm <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_nm <= 1.0 ? '✓' : '✗'} Ratio NM = {res.ratio_nm.toFixed(2)}
              </li>
              <li className={res.ratio_n <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_n <= 1.0 ? '✓' : '✗'} Ratio N = {res.ratio_n.toFixed(2)}
              </li>
              <li className={res.rho_prov >= res.rho_min ? 'text-green-600' : 'text-red-600'}>
                {res.rho_prov >= res.rho_min ? '✓' : '✗'} ρ = {res.rho_prov.toFixed(2)}% ≥ ρ_min = {res.rho_min.toFixed(0)} mm²
              </li>
              <li className="text-slate-500">• N₀ = {res.n0.toFixed(0)} kN</li>
              <li className="text-slate-500">• μ = {res.mu.toFixed(2)} | ν = {res.nu.toFixed(2)}</li>
              <li className="text-slate-500">• Nb sections = {res.n_resist.length}</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
