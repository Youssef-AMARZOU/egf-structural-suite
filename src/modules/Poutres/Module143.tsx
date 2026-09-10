import { useState } from 'react';
import type { TorsionMultitubInputs, TorsionMultitubOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: TorsionMultitubInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bn: 490, h0: 300, e_pm: 50, e_pl: 50,
  a0: 50, c0: 50, v0: 60, n_v: 4,
  t_ed: 100, n_r: 2,
};


export default function Module143() {
  const [inp, setInp] = useState<TorsionMultitubInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<TorsionMultitubInputs, TorsionMultitubOutput>(
    'calculate_torsion_multitub_143', inp,
  );
  const S = (k: keyof TorsionMultitubInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio_torsion <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof TorsionMultitubInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="143 Torsion Multitub"
      subtitle="Torsion sections multitubulaires — EC2 §6.3"
      eurocode="EC2 §6.3"
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
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('bn', 'Bn', 'mm', 100, 3000, 10)}
          {slider('h0', 'H0', 'mm', 50, 1000, 10)}
          {slider('e_pm', 'e_pm', 'mm', 10, 200, 5)}
          {slider('e_pl', 'e_pl', 'mm', 10, 200, 5)}
          {slider('a0', 'A0', 'mm', 10, 200, 5)}
          {slider('c0', 'C0', 'mm', 10, 200, 5)}
          {slider('v0', 'V0', 'mm', 10, 200, 5)}
          {slider('n_v', 'Nb alvéoles', '-', 1, 20, 1)}
          {slider('n_r', 'Nb rect.', '-', 1, 10, 1)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('t_ed', 'TEd', 'kN·m', 0, 1000, 5)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Section multitubulaire" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const scale = Math.min(w / inp.bn, h / inp.h0) * 0.8;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const bPx = inp.bn * scale;
              const hPx = inp.h0 * scale;

              return (
                <g>
                  <rect x={cx - bPx / 2} y={cy - hPx / 2} width={bPx} height={hPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  {Array.from({ length: inp.n_v }, (_, i) => {
                    const voidW = (inp.v0 * scale);
                    const totalInner = inp.bn - 2 * inp.e_pm - (inp.n_v - 1) * inp.e_pl;
                    const voidW_actual = (totalInner / inp.n_v) * scale;
                    const startX = cx - bPx / 2 + inp.e_pm * scale;
                    const voidH = (inp.h0 - inp.a0 - inp.c0) * scale;
                    const voidY = cy - hPx / 2 + inp.a0 * scale;

                    return Array.from({ length: inp.n_v }, (_, j) => {
                      const x = startX + j * (voidW_actual + inp.e_pl * scale);
                      return (
                        <g key={`${i}-${j}`}>
                          <rect x={x} y={voidY} width={voidW_actual} height={voidH} fill="white" stroke="#94a3b8" strokeWidth={0.5} />
                          <text x={x + voidW_actual / 2} y={voidY + voidH / 2 + 3} textAnchor="middle" fontSize={6} fill="#94a3b8">
                            {j + 1}
                          </text>
                        </g>
                      );
                    });
                  })}

                  {res.cisame.map((tau, i) => (
                    <g key={i}>
                      <text x={cx - bPx / 2 - 10} y={cy + i * 12 - (res.cisame.length - 1) * 6} textAnchor="end" fontSize={7} fill="#ef4444">
                        τ={tau.toFixed(2)}
                      </text>
                    </g>
                  ))}

                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    TEd={inp.t_ed}kN·m | τ_max={res.cis_max.toFixed(2)}MPa | ω={res.omega_total.toFixed(4)}m²
                  </text>
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
              <div>ω_total = <b>{res.omega_total.toFixed(4)}</b> m²</div>
              <div>K_total = <b>{res.k_total.toFixed(4)}</b></div>
              <div>τ_max = <b>{res.cis_max.toFixed(2)}</b> MPa</div>
              <div>fctd = <b>{res.fctd.toFixed(2)}</b> MPa | τ_Rds = <b>{res.tau_rds.toFixed(2)}</b> MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Torsion multitubulaire"
                latex={String.raw`\tau_t = \frac{T_{Ed}}{2 A_k t_{ef}}`}
                description="Tubes minces fermés, Bredt"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`T_{Ed}`, meaning: 'Moment de torsion', value: inp.t_ed },
                    { symbol: String.raw`A_k`, meaning: 'Aire du contour', value: res.omega_total.toFixed(4) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <div className="space-y-2">
            {res.diag.map((d, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className={res.ratio_torsion <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_torsion <= 1.0 ? '✓' : '✗'} τ_max/τ_Rds = {(res.ratio_torsion * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• ω_total = {res.omega_total.toFixed(4)} m²</li>
              <li className="text-slate-500">• K_total = {res.k_total.toFixed(4)}</li>
              <li className="text-slate-500">• τ_max = {res.cis_max.toFixed(2)} MPa</li>
              <li className="text-slate-500">• fctd = {res.fctd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_Rds = {res.tau_rds.toFixed(2)} MPa</li>
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
