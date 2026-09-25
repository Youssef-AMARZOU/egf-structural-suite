import { useState } from 'react';
import type { CisaiRectInputs, CisaiRectOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend, AxisTicks } from '../../components/drafting';

const DEFAULT: CisaiRectInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bw: 250, h: 500, d: 440, rho_l: 0.8,
  v_ed: [100, 200, 300, 250, 150],
  m_ed: [0, 150, 250, 200, 0],
  n_ed: 0,
  x_positions: [0, 2000, 4000, 6000, 8000],
  l_span: 8000, support_width: 250,
};

export default function Module139() {
  const [inp, setInp] = useState<CisaiRectInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<CisaiRectInputs, CisaiRectOutput>(
    'calculate_cisai_rect_139', inp,
  );
  const S = (k: keyof CisaiRectInputs) => (v: number | number[]) => setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof CisaiRectInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="139 Cisaillement Rect"
      subtitle="Vérification cisaillement — EC2 §6.2"
      eurocode="EC2 §6.2"
      category="Poutres"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
            {slider('fyk', 'Acier fyk', 'MPa', 400, 600, 10)}
            {slider('gc', 'γc', '-', 1, 2, 0.05)}
            {slider('gs', 'γs', '-', 1, 2, 0.05)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('bw', 'Largeur âme bw', 'mm', 100, 1000, 10)}
            {slider('h', 'Hauteur h', 'mm', 100, 1500, 10)}
            {slider('d', 'Hauteur utile d', 'mm', 50, 1400, 5)}
            {slider('rho_l', 'ρl', '%', 0.1, 5, 0.1)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('l_span', 'L travée', 'mm', 1000, 20000, 500)}
            {slider('support_width', 't appui', 'mm', 100, 1000, 10)}
            {slider('n_ed', 'Effort axial NEd', 'kN', 0, 10000, 10)}
          </div>

          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Enveloppe de cisaillement" vbW={500} vbH={320}>
            {res && (() => {
              const ox = 70, oy = 20, w = 350, h = 230;
              const allV = [...res.v_envelope, res.v_rdc, res.v_rdc_max];
              const maxV = Math.max(...allV.map(v => Math.abs(v)), 1);
              const sc = h / (maxV * 1.15);
              const baseY = oy + h;

              const envX = res.v_envelope_x;
              const lastX = envX[envX.length - 1] || 1;

              const xVals = Array.from({ length: Math.floor(lastX / 2000) + 1 }, (_, i) => i * 2000);
              const yStep = maxV > 500 ? 200 : maxV > 200 ? 100 : maxV > 50 ? 50 : 20;
              const yVals = Array.from({ length: Math.floor(maxV / yStep) + 1 }, (_, i) => i * yStep);

              return (
                <g>
                  {/* Grid lines */}
                  {yVals.map(v => (
                    <line key={`gy${v}`} x1={ox} y1={baseY - v * sc} x2={ox + w} y2={baseY - v * sc}
                      stroke="#334155" strokeWidth={0.3} opacity={0.5} />
                  ))}

                  {/* Shear envelope */}
                  {res.v_envelope.map((v, i) => {
                    if (i === 0) return null;
                    const x1 = ox + (envX[i - 1] / lastX) * w;
                    const y1 = baseY - res.v_envelope[i - 1] * sc;
                    const x2 = ox + (envX[i] / lastX) * w;
                    const y2 = baseY - v * sc;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth={2} />;
                  })}

                  {/* Fill under envelope */}
                  {res.v_envelope.length > 1 && (
                    <polygon
                      points={[
                        `${ox},${baseY}`,
                        ...res.v_envelope.map((v, i) => `${ox + (envX[i] / lastX) * w},${baseY - v * sc}`),
                        `${ox + w},${baseY}`,
                      ].join(' ')}
                      fill="#3b82f6" opacity={0.08}
                    />
                  )}

                  {/* VRd,c line */}
                  <line x1={ox} y1={baseY - res.v_rdc * sc} x2={ox + w} y2={baseY - res.v_rdc * sc}
                    stroke="#22c55e" strokeWidth={1.5} strokeDasharray="6,3" />
                  <rect x={ox + w - 90} y={baseY - res.v_rdc * sc - 10} width={88} height={14} fill="#166534" rx={2} opacity={0.9} />
                  <text x={ox + w - 4} y={baseY - res.v_rdc * sc} fontSize={8} fill="#4ade80" fontWeight="600" textAnchor="end">
                    VRd,c={res.v_rdc.toFixed(0)}kN
                  </text>

                  {/* VRd,max line */}
                  <line x1={ox} y1={baseY - res.v_rdc_max * sc} x2={ox + w} y2={baseY - res.v_rdc_max * sc}
                    stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6,3" />
                  <rect x={ox + w - 100} y={baseY - res.v_rdc_max * sc - 10} width={98} height={14} fill="#7f1d1d" rx={2} opacity={0.9} />
                  <text x={ox + w - 4} y={baseY - res.v_rdc_max * sc} fontSize={8} fill="#fca5a5" fontWeight="600" textAnchor="end">
                    VRd,max={res.v_rdc_max.toFixed(0)}kN
                  </text>

                  {/* VEd max annotation */}
                  {res.v_ed_max > 0 && (
                    <g>
                      <line x1={ox + w * 0.4} y1={baseY - res.v_ed_max * sc + 4}
                        x2={ox + w * 0.4} y2={baseY - res.v_ed_max * sc - 8}
                        stroke="#f59e0b" strokeWidth={1.5} />
                      <rect x={ox + w * 0.4 - 40} y={baseY - res.v_ed_max * sc - 22} width={80} height={14} fill="#78350f" rx={2} opacity={0.9} />
                      <text x={ox + w * 0.4} y={baseY - res.v_ed_max * sc - 12} fontSize={8} fill="#fcd34d" fontWeight="600" textAnchor="middle">
                        VEd,max={res.v_ed_max.toFixed(0)}kN
                      </text>
                    </g>
                  )}

                  {/* Support rectangles */}
                  <rect x={ox} y={baseY} width={inp.support_width / lastX * w} height={3} fill="#94a3b8" rx={1} />
                  <rect x={ox + w - inp.support_width / lastX * w} y={baseY} width={inp.support_width / lastX * w} height={3} fill="#94a3b8" rx={1} />

                  {/* Axes */}
                  <AxisTicks
                    origin={[ox, baseY + 14]}
                    end={[ox + w, baseY + 14]}
                    values={xVals}
                    map={(v) => [ox + (v / lastX) * w, baseY + 14]}
                    unit="mm"
                    side="below"
                    decimals={0}
                  />
                  <AxisTicks
                    origin={[ox - 14, baseY]}
                    end={[ox - 14, oy]}
                    values={yVals}
                    map={(v) => [ox - 14, baseY - v * sc]}
                    unit="kN"
                    side="left"
                    decimals={0}
                  />

                  <InlineLegend
                    items={[
                      { label: 'Enveloppe VEd', color: '#3b82f6' },
                      { label: 'VRd,c', color: '#22c55e' },
                      { label: 'VRd,max', color: '#ef4444' },
                    ]}
                    x={ox + 4}
                    y={oy + 4}
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
                  ['VRd,c', `${res.v_rdc.toFixed(1)} kN`],
                  ['VRd,max', `${res.v_rdc_max.toFixed(1)} kN`],
                  ['VEd,max', `${res.v_ed_max.toFixed(1)} kN`],
                  ['Ratio', `${(res.ratio_v * 100).toFixed(0)}%`],
                  ['k', res.k_factor.toFixed(2)],
                  ['β', res.beta_factor.toFixed(2)],
                  ['σcd', `${res.sigma_cd.toFixed(1)} MPa`],
                  ['Espacement', `${res.stirrup_spacing.toFixed(0)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Cisaillement — EC2 §6.2"
                latex={String.raw`V_{Rd,c} = C_{Rd,c} \cdot k \cdot (100 \rho_l f_{ck})^{1/3} \cdot b_w \cdot d`}
                description="Résistance cisaillement sans armatures transversales"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`C_{Rd,c}`, meaning: 'Coefficient EC2', value: (0.18 / inp.gc).toFixed(3), unit: '-' },
                  { symbol: String.raw`k`, meaning: 'Effet d\'échelle', value: res.k_factor.toFixed(2), unit: '-' },
                  { symbol: String.raw`\rho_l`, meaning: 'Armature longitudinale', value: inp.rho_l.toFixed(1), unit: '%' },
                  { symbol: String.raw`f_{ck}`, meaning: 'Résistance caractéristique', value: inp.fck, unit: 'MPa' },
                  { symbol: String.raw`b_w`, meaning: 'Largeur âme', value: inp.bw, unit: 'mm' },
                  { symbol: String.raw`d`, meaning: 'Enfoncement', value: inp.d, unit: 'mm' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.ratio_v <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Capacité résistante</div>
                <div className="font-mono space-y-0.5">
                  <div>VRd,c = {res.v_rdc.toFixed(1)} kN (sans armatures transversales)</div>
                  <div>VRd,max = {res.v_rdc_max.toFixed(1)} kN (plafond béton)</div>
                  <div>k = {res.k_factor.toFixed(2)} · β = {res.beta_factor.toFixed(2)} · σcd = {res.sigma_cd.toFixed(1)} MPa</div>
                </div>
                {res.stirrup_spacing < inp.d && (
                  <>
                    <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Armatures transversales</div>
                    <div className="font-mono space-y-0.5">
                      <div>Espace étriers = {res.stirrup_spacing.toFixed(0)} mm</div>
                      <div>α_sw,min = {res.a_sw_min.toFixed(1)} mm²</div>
                    </div>
                  </>
                )}
                {res.rho_min > inp.rho_l && (
                  <div className="text-yellow-600 dark:text-yellow-400 pt-1">
                    ρl = {inp.rho_l.toFixed(1)}% &lt; ρl,min = {res.rho_min.toFixed(3)}%
                  </div>
                )}
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
