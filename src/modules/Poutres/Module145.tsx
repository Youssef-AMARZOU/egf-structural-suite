import { useState } from 'react';
import type { ReservoirCirculaireInputs, ReservoirCirculaireOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend } from '../../components/drafting';

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
      subtitle="Réservoir circulaire béton armé — EC2"
      eurocode="EC2"
      category="Poutres"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('fck', 'fck', 'MPa', 12, 90, 1)}
            {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
            {slider('gc', 'γc', '-', 1, 2, 0.05)}
            {slider('gs', 'γs', '-', 1, 2, 0.05)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('phi', 'φ int.', 'mm', 1000, 50000, 500)}
            {slider('h', 'h', 'mm', 100, 1000, 10)}
            {slider('e', 'e', 'mm', 50, 500, 10)}
            {slider('l', 'L panneau', 'mm', 500, 20000, 100)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slider('h_eau', 'h eau', 'mm', 0, 20000, 100)}
            {slider('hw', 'hw', 'mm', 0, 20000, 100)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Armatures</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('nli', 'Nb liserés', '-', 1, 20, 1)}
            {slider('phi_s', 'φ arm.', 'mm', 6, 40, 1)}
            {slider('s', 's', 'mm', 50, 500, 10)}
            {slider('c', 'c', 'mm', 10, 100, 5)}
            {slider('a0', 'a0', 'mm', 10, 100, 5)}
          </div>

          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Coupe — Réservoir circulaire" vbW={500} vbH={340}>
            {res && (() => {
              const cx = 250, cy = 160;
              const maxR = 180;
              const scale = maxR / (inp.phi / 2000);
              const rOuter = (inp.phi / 2000) * scale;
              const rInner = rOuter - (inp.e / 1000) * scale;
              const hWall = (inp.h / 1000) * scale * 2;
              const waterLevel = (inp.h_eau / inp.l) * hWall;

              return (
                <g>
                  {/* Outer wall */}
                  <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#3b82f6" strokeWidth={2} />
                  {/* Inner wall */}
                  <circle cx={cx} cy={cy} r={rInner} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} />

                  {/* Water level fill */}
                  {waterLevel > 0 && (
                    <clipPath id="tankClip">
                      <circle cx={cx} cy={cy} r={rInner - 1} />
                    </clipPath>
                  )}
                  {waterLevel > 0 && (
                    <rect x={cx - rInner} y={cy + rInner - waterLevel} width={rInner * 2} height={waterLevel}
                      fill="#3b82f6" opacity={0.15} clipPath="url(#tankClip)" />
                  )}

                  {/* Center line */}
                  <line x1={cx} y1={cy - rOuter - 10} x2={cx} y2={cy + rOuter + 10}
                    stroke="#64748b" strokeWidth={0.3} strokeDasharray="4,4" />
                  <line x1={cx - rOuter - 10} y1={cy} x2={cx + rOuter + 10} y2={cy}
                    stroke="#64748b" strokeWidth={0.3} strokeDasharray="4,4" />

                  {/* Dimension — diameter */}
                  <line x1={cx - rOuter} y1={cy - rOuter - 12} x2={cx + rOuter} y2={cy - rOuter - 12}
                    stroke="#64748b" strokeWidth={0.6} />
                  <line x1={cx - rOuter} y1={cy - rOuter - 16} x2={cx - rOuter} y2={cy - rOuter - 8}
                    stroke="#64748b" strokeWidth={0.6} />
                  <line x1={cx + rOuter} y1={cy - rOuter - 16} x2={cx + rOuter} y2={cy - rOuter - 8}
                    stroke="#64748b" strokeWidth={0.6} />
                  <text x={cx} y={cy - rOuter - 16} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight="600">
                    φ = {(inp.phi / 1000).toFixed(1)} m
                  </text>

                  {/* Dimension — wall thickness */}
                  <line x1={cx + rInner} y1={cy - 20} x2={cx + rOuter} y2={cy - 20}
                    stroke="#f59e0b" strokeWidth={0.6} />
                  <line x1={cx + rInner} y1={cy - 24} x2={cx + rInner} y2={cy - 16}
                    stroke="#f59e0b" strokeWidth={0.6} />
                  <line x1={cx + rOuter} y1={cy - 24} x2={cx + rOuter} y2={cy - 16}
                    stroke="#f59e0b" strokeWidth={0.6} />
                  <text x={cx + (rInner + rOuter) / 2} y={cy - 26} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight="600">
                    e = {(inp.e)} mm
                  </text>

                  {/* Water level */}
                  {waterLevel > 0 && (
                    <g>
                      <line x1={cx - rInner - 20} y1={cy + rInner - waterLevel}
                        x2={cx - rInner - 5} y2={cy + rInner - waterLevel}
                        stroke="#3b82f6" strokeWidth={1} />
                      <text x={cx - rInner - 24} y={cy + rInner - waterLevel + 3} textAnchor="end" fontSize={8} fill="#3b82f6" fontWeight="600">
                        h_eau
                      </text>
                    </g>
                  )}

                  {/* Labels */}
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#1e293b" fontWeight="600">
                    {(inp.phi / 1000).toFixed(1)}m
                  </text>

                  {/* Legend */}
                  <InlineLegend
                    items={[
                      { label: 'Paroi béton', color: '#3b82f6' },
                      { label: `e = ${inp.e} mm`, color: '#f59e0b' },
                    ]}
                    x={cx - rOuter}
                    y={cy + rOuter + 20}
                  />

                  {/* Bottom info */}
                  <text x={cx} y={cy + rOuter + 38} textAnchor="middle" fontSize={8} fill="#64748b">
                    μ = {res.mu.toFixed(3)} · As = {res.as_prov.toFixed(1)} cm²/m · wk = {res.wk.toFixed(3)} mm
                  </text>
                </g>
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
                  ['μ', res.mu.toFixed(3)],
                  ['μ_max', res.omega_max.toFixed(3)],
                  ['ω', res.omega.toFixed(3)],
                  ['ξ', res.ns.toFixed(3)],
                  ['As', `${res.as_prov.toFixed(1)} cm²/m`],
                  ['wk', `${res.wk.toFixed(3)} mm`],
                  ['wk_lim', `${res.wk_lim.toFixed(1)} mm`],
                  ['fctd', `${res.fctd.toFixed(2)} MPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Réservoir circulaire — Fissuration EC2"
                latex={String.raw`w_k = s_{r,max} (\varepsilon_{sm} - \varepsilon_{cm})`}
                description="Ouverture caractéristique des fissures sous charges quasi-permanentes"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`w_k`, meaning: 'Ouverture fissure', value: res.wk.toFixed(3), unit: 'mm' },
                  { symbol: String.raw`w_{k,lim}`, meaning: 'Limite', value: res.wk_lim.toFixed(1), unit: 'mm' },
                  { symbol: String.raw`\mu`, meaning: 'Ratio armature', value: res.mu.toFixed(3), unit: '-' },
                  { symbol: String.raw`\mu_{max}`, meaning: 'Ratio max', value: res.omega_max.toFixed(3), unit: '-' },
                  { symbol: String.raw`A_s`, meaning: 'Armature fournie', value: res.as_prov.toFixed(1), unit: 'cm²/m' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.wk <= res.wk_lim ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Géométrie</div>
                <div className="font-mono space-y-0.5">
                  <div>φ = {(inp.phi / 1000).toFixed(1)} m · h = {inp.h} mm · e = {inp.e} mm</div>
                  <div>L panneau = {inp.l} mm · h eau = {inp.h_eau} mm</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Fissuration</div>
                <div className="font-mono space-y-0.5">
                  <div>wk = {res.wk.toFixed(3)} mm {'\u2264'} wk,lim = {res.wk_lim.toFixed(1)} mm → {res.wk <= res.wk_lim ? 'Vérifié' : 'Non vérifié'}</div>
                  <div>μ = {res.mu.toFixed(3)} {'\u2264'} μ_max = {res.omega_max.toFixed(3)} → {res.mu <= res.omega_max ? 'OK' : 'Dépassé'}</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Matériaux</div>
                <div className="font-mono space-y-0.5">
                  <div>fctd = {res.fctd.toFixed(2)} MPa · fyd = {res.fyd.toFixed(0)} MPa</div>
                  <div>As = {res.as_prov.toFixed(1)} cm²/m {'\u2265'} As,min = {res.as_min.toFixed(1)} cm²/m</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
