import { useState } from 'react';
import type { PoutreCloisonInputs, PoutreCloisonOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend, AxisTicks } from '../../components/drafting';

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

  const status = err ? 'fail' : !res ? 'computing' : res.ratio >= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof PoutreCloisonInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="147 Poutre Cloison"
      subtitle="Poutre cloison 2 ou 3 appuis — BAEL/EC2"
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

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('h', 'h', 'mm', 50, 500, 10)}
            {slider('b', 'b', 'mm', 50, 300, 10)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Portées</div>
          <div className="grid grid-cols-3 gap-2">
            {slider('l1', 'L₁', 'mm', 500, 10000, 100)}
            {slider('l2', 'L₂', 'mm', 500, 10000, 100)}
            {slider('l3', 'L₃', 'mm', 500, 10000, 100)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slider('nb_appuis', 'Nb appuis', '-', 2, 3, 1)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('q_panneau', 'q panneau', 'kN/m²', 0, 5, 0.1)}
            {slider('q_piedroit', 'q piedroit', 'kN/m', 0, 10, 0.1)}
          </div>

          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Coupe — Poutre cloison" vbW={500} vbH={300}>
            {res && (() => {
              const ox = 60, oy = 30, w = 380, h = 200;
              const totalL = inp.l1 + inp.l2 + (inp.nb_appuis >= 3 ? inp.l3 : 0);
              const sc = w / totalL;
              const baseY = oy + h * 0.4;
              const secH = Math.min(h * 0.25, 40);
              const secW = Math.min(30, inp.b * sc / 1000 * 2);

              return (
                <g>
                  {/* Beam outline */}
                  <rect x={ox} y={baseY - secH / 2} width={w} height={secH}
                    fill="#e2e8f0" stroke="#3b82f6" strokeWidth={1.5} rx={2} />

                  {/* Supports */}
                  {[0, inp.l1, inp.l1 + inp.l2].slice(0, inp.nb_appuis).map((pos, i) => {
                    const sx = ox + pos * sc;
                    return (
                      <g key={`sup${i}`}>
                        <polygon
                          points={`${sx - 6},${baseY + secH / 2 + 8} ${sx + 6},${baseY + secH / 2 + 8} ${sx},${baseY + secH / 2}`}
                          fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
                        <text x={sx} y={baseY + secH / 2 + 18} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight="600">
                          A{i + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Span labels */}
                  <text x={ox + (inp.l1 * sc) / 2} y={baseY - secH / 2 - 6} textAnchor="middle" fontSize={8} fill="#64748b">
                    L₁ = {inp.l1} mm
                  </text>
                  <text x={ox + (inp.l1 + inp.l2 / 2) * sc} y={baseY - secH / 2 - 6} textAnchor="middle" fontSize={8} fill="#64748b">
                    L₂ = {inp.l2} mm
                  </text>
                  {inp.nb_appuis >= 3 && (
                    <text x={ox + (inp.l1 + inp.l2 + inp.l3 / 2) * sc} y={baseY - secH / 2 - 6} textAnchor="middle" fontSize={8} fill="#64748b">
                      L₃ = {inp.l3} mm
                    </text>
                  )}

                  {/* Section callout */}
                  <rect x={ox + w / 2 - secW / 2} y={baseY + secH / 2 + 30} width={secW} height={secH * 1.5}
                    fill="#dbeafe" stroke="#3b82f6" strokeWidth={1} rx={1} />
                  <text x={ox + w / 2} y={baseY + secH / 2 + 30 + secH * 1.5 + 12} textAnchor="middle" fontSize={7} fill="#64748b">
                    b={inp.b}mm × h={inp.h}mm
                  </text>

                  {/* Load arrows */}
                  {Array.from({ length: 8 }, (_, i) => {
                    const lx = ox + (i + 0.5) * w / 8;
                    return (
                      <g key={`ld${i}`}>
                        <line x1={lx} y1={baseY - secH / 2 - 20} x2={lx} y2={baseY - secH / 2 - 6}
                          stroke="#ef4444" strokeWidth={0.8} markerEnd="url(#arrowRed)" />
                      </g>
                    );
                  })}
                  <defs>
                    <marker id="arrowRed" viewBox="0 0 6 6" refX="3" refY="3" markerWidth={4} markerHeight={4} orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                    </marker>
                  </defs>
                  <text x={ox + w / 2} y={baseY - secH / 2 - 24} textAnchor="middle" fontSize={7} fill="#ef4444" fontWeight="600">
                    q = {inp.q_panneau} kN/m² + {inp.q_piedroit} kN/m
                  </text>

                  {/* Axes */}
                  <AxisTicks
                    origin={[ox, baseY + secH / 2 + 30]}
                    end={[ox + w, baseY + secH / 2 + 30]}
                    values={Array.from({ length: Math.floor(totalL / 1000) + 1 }, (_, i) => i * 1000)}
                    map={(v) => [ox + (v / totalL) * w, baseY + secH / 2 + 30]}
                    unit="mm"
                    side="below"
                    decimals={0}
                  />

                  <InlineLegend
                    items={[
                      { label: 'Poutre', color: '#3b82f6' },
                      { label: 'Charge', color: '#ef4444' },
                    ]}
                    x={ox}
                    y={oy}
                  />
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
                  ['L totale', `${res.l_totale.toFixed(2)} m`],
                  ['L portée', `${res.l_portee.toFixed(2)} m`],
                  ['p total', `${res.p_total.toFixed(2)} kN/m`],
                  ['M_Ed', `${res.m_ed.toFixed(2)} kN·m`],
                  ['V_Ed', `${res.v_ed.toFixed(2)} kN`],
                  ['μ', res.mu.toFixed(3)],
                  ['As', `${res.as_prov.toFixed(1)} cm²`],
                  ['As_min', `${res.as_min.toFixed(1)} cm²`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Poutre cloison — BAEL/EC2"
                latex={String.raw`M_{Ed} = \frac{p \cdot L^2}{8} \quad A_s = \frac{M_{Ed}}{f_{yd} \cdot z}`}
                description="Dimensionnement flexion + cisaillement poutre portant panneau"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{Ed}`, meaning: 'Moment sollicitant', value: res.m_ed.toFixed(2), unit: 'kN·m' },
                  { symbol: String.raw`V_{Ed}`, meaning: 'Cisaillement', value: res.v_ed.toFixed(2), unit: 'kN' },
                  { symbol: String.raw`p`, meaning: 'Charge totale', value: res.p_total.toFixed(2), unit: 'kN/m' },
                  { symbol: String.raw`z`, meaning: 'Bras de levier', value: res.z_arm.toFixed(3), unit: 'm' },
                  { symbol: String.raw`f_{yd}`, meaning: 'Résistance acier', value: res.fyd.toFixed(0), unit: 'MPa' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.ratio >= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Charges</div>
                <div className="font-mono space-y-0.5">
                  <div>q panneau = {inp.q_panneau} kN/m² · q piedroit = {inp.q_piedroit} kN/m</div>
                  <div>p total = {res.p_total.toFixed(2)} kN/m</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Sollicitations</div>
                <div className="font-mono space-y-0.5">
                  <div>M_Ed = {res.m_ed.toFixed(2)} kN·m · V_Ed = {res.v_ed.toFixed(2)} kN</div>
                  <div>L portée = {res.l_portee.toFixed(2)} m</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Armatures</div>
                <div className="font-mono space-y-0.5">
                  <div>As = {res.as_prov.toFixed(1)} cm² {'\u2265'} As,min = {res.as_min.toFixed(1)} cm² → {res.ratio >= 1 ? 'OK' : 'Insuffisant'}</div>
                  <div>μ = {res.mu.toFixed(3)} · ω = {res.omega.toFixed(3)}</div>
                  <div>z = {res.z_arm.toFixed(3)} m · fyd = {res.fyd.toFixed(0)} MPa</div>
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
