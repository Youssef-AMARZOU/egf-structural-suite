import { useState } from 'react';
import type { ReservoirCirculaireInputs, ReservoirCirculaireOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: ReservoirCirculaireInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  phi: 10000, h: 300, e: 200, l: 4000,
  h_eau: 3500, hw: 3500, gamma_eau: 9.81,
  gamma_beton: 25, pe: 0.12, rb: 4000,
  nli: 4, phi_s: 12, s: 200, c: 25,
  rh: 70, t0: 28, tphi: 180,
  clas: "32.5N", a0: 30, d0: 50, gs0: 1.15,
  ecap: 0.8, qf: 0.3, qv: 0.3,
};


export default function Module145() {
  const [inp, setInp] = useState<ReservoirCirculaireInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<ReservoirCirculaireInputs, ReservoirCirculaireOutput>(
    'calculate_reservoir_circulaire_145', inp,
  );
  const S = (k: keyof ReservoirCirculaireInputs) => (v: number | string) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof ReservoirCirculaireInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="145 Réservoir Circulaire"
      subtitle="Réservoirs circulaires béton armé — EC2"
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
          {slider('phi', 'φ', 'mm', 1000, 50000, 500)}
          {slider('h', 'h', 'mm', 100, 1000, 10)}
          {slider('e', 'e', 'mm', 50, 500, 10)}
          {slider('l', 'L', 'mm', 500, 20000, 100)}
          {slider('h_eau', 'h_eau', 'mm', 0, 20000, 100)}
          {slider('hw', 'hw', 'mm', 0, 20000, 100)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('nli', 'Nb liserés', '-', 1, 20, 1)}
          {slider('phi_s', 'φ armature', 'mm', 6, 40, 1)}
          {slider('s', 's', 'mm', 50, 500, 10)}
          {slider('c', 'c', 'mm', 10, 100, 5)}
          {slider('a0', 'a0', 'mm', 10, 100, 5)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe réservoir" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const scale = Math.min(w / (inp.phi / 1000), h / (inp.h / 1000)) * 0.8;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const rPx = (inp.phi / 2000) * scale;
              const hPx = (inp.h / 1000) * scale;
              const ePx = (inp.e / 1000) * scale;

              return (
                <g>
                  <circle cx={cx} cy={cy} r={rPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} />
                  <circle cx={cx} cy={cy} r={rPx - ePx} fill="white" stroke="#94a3b8" strokeWidth={0.5} />

                  <text x={cx + rPx + 5} y={cy} fontSize={7} fill="#64748b">
                    φ={(inp.phi / 1000).toFixed(1)}m
                  </text>
                  <text x={cx - rPx / 2} y={oy + h - 5} textAnchor="middle" fontSize={7} fill="#64748b">
                    h={(inp.h / 1000).toFixed(1)}m | e={(inp.e / 1000).toFixed(2)}m
                  </text>

                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    μ={res.mu.toFixed(3)} | As={res.as_prov.toFixed(1)}cm²/m | wk={res.wk.toFixed(3)}mm
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
              <div>μ = <b>{res.mu.toFixed(3)}</b> | μ_max = {res.omega_max.toFixed(3)}</div>
              <div>ω = <b>{res.omega.toFixed(3)}</b> | ξ = {res.ns.toFixed(3)}</div>
              <div>As = <b>{(res.as_prov / 100).toFixed(1)}</b> cm²/m | z = {res.z_arm.toFixed(3)} m</div>
              <div>wk = <b>{res.wk.toFixed(3)}</b> mm | wk_lim = {res.wk_lim.toFixed(1)} mm</div>
              <div>fctd = {res.fctd.toFixed(2)} MPa | fyd = {res.fyd.toFixed(0)} MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Réservoir circulaire"
                latex={String.raw`w_k = s_{r,max}(\varepsilon_{sm} - \varepsilon_{cm})`}
                description="Ouverture des fissures + retrait"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`w_k`, meaning: 'Ouverture caractéristique', value: res.wk.toFixed(3) },
                    { symbol: String.raw`\varepsilon_{sm}`, meaning: 'Déformation acier', value: res.ns.toFixed(3) },
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
              <li className={res.mu <= res.omega_max ? 'text-green-600' : 'text-red-600'}>
                {res.mu <= res.omega_max ? '✓' : '✗'} μ = {res.mu.toFixed(3)} / μ_max = {res.omega_max.toFixed(3)}
              </li>
              <li className="text-slate-500">• As_prov = {res.as_prov.toFixed(1)} cm²/m</li>
              <li className="text-slate-500">• As_min = {res.as_min.toFixed(1)} cm²/m</li>
              <li className="text-slate-500">• z_arm = {res.z_arm.toFixed(3)} m</li>
              <li className="text-slate-500">• wk = {res.wk.toFixed(3)} mm</li>
              <li className="text-slate-500">• wk_lim = {res.wk_lim.toFixed(1)} mm</li>
              <li className="text-slate-500">• fctd = {res.fctd.toFixed(2)} MPa</li>
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
