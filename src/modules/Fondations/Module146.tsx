import { useState } from 'react';
import type { PoinconnementTremieInputs, PoinconnementTremieOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: PoinconnementTremieInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  h: 600, a0: 60, c1: 1000, c2: 1000,
  d_pile: 800, d_tremie: 1200,
  ed: 500, n_ed: 500, gamma_f: 1.0,
};


export default function Module146() {
  const [inp, setInp] = useState<PoinconnementTremieInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PoinconnementTremieInputs, PoinconnementTremieOutput>(
    'calculate_poinconnement_tremie_146', inp,
  );
  const S = (k: keyof PoinconnementTremieInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : res.ratio <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof PoinconnementTremieInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="146 Poinç. Trémie"
      subtitle="Poinçonnement semelle sur trémie — EC2 §6.4"
      eurocode="EC2 §6.4"
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
          {slider('h', 'h', 'mm', 100, 2000, 50)}
          {slider('a0', 'a0', 'mm', 10, 200, 5)}
          {slider('c1', 'c1', 'mm', 100, 5000, 50)}
          {slider('c2', 'c2', 'mm', 100, 5000, 50)}
          {slider('d_pile', 'D pile', 'mm', 100, 3000, 50)}
          {slider('d_tremie', 'D trémie', 'mm', 100, 3000, 50)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ed', 'Ed', 'kN', 0, 10000, 10)}
          {slider('n_ed', 'NEd', 'kN', 0, 10000, 10)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe — Poinçonnement trémie" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const s = 0.08;
              const c1Px = (inp.c1 / 1000) * s * 1000;
              const c2Px = (inp.c2 / 1000) * s * 1000;
              const pilePx = (inp.d_pile / 1000) * s * 1000;
              const tremiePx = (inp.d_tremie / 1000) * s * 1000;

              return (
                <g>
                  <rect x={cx - c1Px / 2 - 40} y={cy - c2Px / 2 - 20} width={c1Px + 80} height={c2Px + 40} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />
                  <circle cx={cx} cy={cy} r={tremiePx / 2} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />
                  <circle cx={cx} cy={cy} r={pilePx / 2} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />

                  <circle cx={cx} cy={cy} r={res.u1 / 2 * 1000 * s} fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="6,3" />

                  <text x={cx + tremiePx / 2 + 5} y={cy - 5} fontSize={7} fill="#94a3b8">D_t={(inp.d_tremie / 1000).toFixed(1)}m</text>
                  <text x={cx + pilePx / 2 + 5} y={cy + 5} fontSize={7} fill="#2563eb">D_p={(inp.d_pile / 1000).toFixed(1)}m</text>
                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    NEd={inp.n_ed}kN | τ={res.vr_ed.toFixed(2)}MPa | u1={res.u1.toFixed(2)}m
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
              <div>u0 = <b>{res.u0.toFixed(3)}</b> m | u1 = <b>{res.u1.toFixed(3)}</b> m</div>
              <div>τ_ED = <b>{res.vr_ed.toFixed(2)}</b> MPa</div>
              <div>τ_RD,c = <b>{res.vr_d_c.toFixed(2)}</b> MPa | τ_RD,max = {res.vr_d_max.toFixed(2)} MPa</div>
              <div>α_ED = {res.alpha_ed.toFixed(2)} | ρ_l = {res.rho_l.toFixed(3)}</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Poinçonnement pieu-trémie"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}`}
                description="Fût de pieu et trémie"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort transmis', value: inp.ed },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre', value: res.u1.toFixed(3) },
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
              <li className={res.ratio <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio <= 1.0 ? '✓' : '✗'} τ_ED/τ_RD = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• u0 = {res.u0.toFixed(3)} m</li>
              <li className="text-slate-500">• u1 = {res.u1.toFixed(3)} m</li>
              <li className="text-slate-500">• τ_ED = {res.vr_ed.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_RD,c = {res.vr_d_c.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_RD,max = {res.vr_d_max.toFixed(2)} MPa</li>
              <li className="text-slate-500">• α_ED = {res.alpha_ed.toFixed(2)}</li>
              <li className="text-slate-500">• ρ_l = {res.rho_l.toFixed(3)}</li>
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
