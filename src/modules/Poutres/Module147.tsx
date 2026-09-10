import { useState } from 'react';
import type { PoutreCloisonInputs, PoutreCloisonOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: PoutreCloisonInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  h: 200, b: 100, l1: 3000, l2: 3000, l3: 3000,
  nb_appuis: 3, q_panneau: 0.5, q_piedroit: 1.0,
  cnom: 15, phi_trans: 8, code: 1,
};


export default function Module147() {
  const [inp, setInp] = useState<PoutreCloisonInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PoutreCloisonInputs, PoutreCloisonOutput>(
    'calculate_poutre_cloison_147', inp,
  );
  const S = (k: keyof PoutreCloisonInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio >= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof PoutreCloisonInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="147 Poutre Cloison"
      subtitle="Poutre cloison 2 et 3 appuis — BAEL/EC2"
      eurocode="EC2"
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
          {slider('h', 'h', 'mm', 50, 500, 10)}
          {slider('b', 'b', 'mm', 50, 300, 10)}
          {slider('l1', 'L1', 'mm', 500, 10000, 100)}
          {slider('l2', 'L2', 'mm', 500, 10000, 100)}
          {slider('l3', 'L3', 'mm', 500, 10000, 100)}
          {slider('nb_appuis', 'Nb appuis', '-', 2, 3, 1)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('q_panneau', 'q_panneau', 'kN/m²', 0, 5, 0.1)}
          {slider('q_piedroit', 'q_piedroit', 'kN/m', 0, 10, 0.1)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe — Poutre cloison" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const s = 0.08;
              const bPx = (inp.b / 1000) * s * 1000;
              const hPx = (inp.h / 1000) * s * 1000;

              return (
                <g>
                  <rect x={cx - bPx / 2} y={cy - hPx / 2} width={bPx} height={hPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <circle cx={cx - bPx / 2 + 5} cy={cy + hPx / 2 + 5} r={3} fill="#94a3b8" />
                  <circle cx={cx + bPx / 2 - 5} cy={cy + hPx / 2 + 5} r={3} fill="#94a3b8" />

                  <text x={cx} y={cy - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    b={(inp.b / 1000).toFixed(2)}m | h={(inp.h / 1000).toFixed(2)}m
                  </text>
                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    M_Ed={res.m_ed.toFixed(2)}kN·m | As={res.as_prov.toFixed(1)}cm²/m
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
              <div>L_totale = <b>{res.l_totale.toFixed(2)}</b> m | L_portée = {res.l_portee.toFixed(2)} m</div>
              <div>p_total = <b>{res.p_total.toFixed(2)}</b> kN/m</div>
              <div>M_Ed = <b>{res.m_ed.toFixed(2)}</b> kN·m | V_Ed = <b>{res.v_ed.toFixed(2)}</b> kN</div>
              <div>μ = <b>{res.mu.toFixed(3)}</b> | ω = {res.omega.toFixed(3)}</div>
              <div>As = <b>{(res.as_prov / 100).toFixed(1)}</b> cm² | As_min = {(res.as_min / 100).toFixed(1)} cm²</div>
              <div>z_arm = {res.z_arm.toFixed(3)} m | fyd = {res.fyd.toFixed(0)} MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Poutre-cloison"
                latex={String.raw`F_{tirant} = \frac{M_{Ed}}{z}`}
                description="Poutre profonde, bielles-tirants"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment', value: res.m_ed.toFixed(2) },
                    { symbol: String.raw`z`, meaning: 'Bras de levier', value: res.l_totale.toFixed(2) },
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
              <li className={res.ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio >= 1.0 ? '✓' : '✗'} As/As_min = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• L_totale = {res.l_totale.toFixed(2)} m</li>
              <li className="text-slate-500">• L_portée = {res.l_portee.toFixed(2)} m</li>
              <li className="text-slate-500">• p_total = {res.p_total.toFixed(2)} kN/m</li>
              <li className="text-slate-500">• M_Ed = {res.m_ed.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• V_Ed = {res.v_ed.toFixed(2)} kN</li>
              <li className="text-slate-500">• μ = {res.mu.toFixed(3)}</li>
              <li className="text-slate-500">• As_prov = {res.as_prov.toFixed(1)} cm²</li>
              <li className="text-slate-500">• As_min = {res.as_min.toFixed(1)} cm²</li>
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
