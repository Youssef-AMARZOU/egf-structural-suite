import { useState } from 'react';
import type { CisaiCircInputs, CisaiCircOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend } from '../../components/drafting';

const DEFAULT: CisaiCircInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  phi: 400, d: 340, rho_l: 0.5,
  n_bars: 8, d_bar: 20, cover: 40,
  v_ed: [100, 200, 300, 250, 150],
  m_ed: [0, 150, 250, 200, 0],
  n_ed: 0,
  x_positions: [0, 2000, 4000, 6000, 8000],
  l_span: 8000, support_width: 250,
};

export default function Module140() {
  const [inp, setInp] = useState<CisaiCircInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<CisaiCircInputs, CisaiCircOutput>(
    'calculate_cisai_circ_140', inp,
  );
  const S = (k: keyof CisaiCircInputs) => (v: number | number[]) => setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof CisaiCircInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="140 Cisaillement Circulaire"
      subtitle="Cisaillement section circulaire — EC2 §6.2"
      eurocode="EC2 §6.2"
      category="Poteaux"
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
            {slider('phi', 'Diamètre φ', 'mm', 100, 2000, 10)}
            {slider('d', 'Hauteur utile d', 'mm', 50, 1900, 5)}
            {slider('rho_l', 'ρl', '%', 0.1, 5, 0.1)}
            {slider('n_bars', 'Nb barres', '-', 4, 32, 1)}
            {slider('d_bar', 'φ barre', 'mm', 6, 50, 2)}
            {slider('cover', 'Couverture', 'mm', 15, 100, 5)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Poutre</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('l_span', 'L travée', 'mm', 1000, 20000, 500)}
            {slider('support_width', 't appui', 'mm', 100, 1000, 10)}
            {slider('n_ed', 'NEd', 'kN', 0, 10000, 10)}
          </div>

          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="grid grid-cols-2 gap-3">
          {/* Croquis 1 : Section circulaire */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-3">
            <SectionCanvas title="Section circulaire" vbW={220} vbH={220}>
              {(() => {
                const cx = 110, cy = 110;
                const maxR = 90;
                const scale = maxR / (inp.phi / 2);
                const rOuter = (inp.phi / 2) * scale;
                const rInner = ((inp.d / 2)) * scale;
                const rBar = (inp.phi / 2 - inp.cover) * scale;

                return (
                  <g>
                    {/* Concrete circle */}
                    <circle cx={cx} cy={cy} r={rOuter} fill="#e2e8f0" stroke="#3b82f6" strokeWidth={1.5} />
                    {/* Effective depth circle */}
                    <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="3,3" />

                    {/* Rebar dots */}
                    {Array.from({ length: inp.n_bars }, (_, i) => {
                      const angle = (2 * Math.PI * i) / inp.n_bars - Math.PI / 2;
                      const bx = cx + rBar * Math.cos(angle);
                      const by = cy + rBar * Math.sin(angle);
                      return <circle key={i} cx={bx} cy={by} r={3} fill="#1e40af" stroke="#1e3a5f" strokeWidth={0.3} />;
                    })}

                    {/* Center lines */}
                    <line x1={cx - rOuter - 5} y1={cy} x2={cx + rOuter + 5} y2={cy}
                      stroke="#94a3b8" strokeWidth={0.3} strokeDasharray="2,2" />
                    <line x1={cx} y1={cy - rOuter - 5} x2={cx} y2={cy + rOuter + 5}
                      stroke="#94a3b8" strokeWidth={0.3} strokeDasharray="2,2" />

                    {/* φ dimension */}
                    <line x1={cx - rOuter} y1={cy - rOuter - 8} x2={cx + rOuter} y2={cy - rOuter - 8}
                      stroke="#64748b" strokeWidth={0.5} />
                    <line x1={cx - rOuter} y1={cy - rOuter - 12} x2={cx - rOuter} y2={cy - rOuter - 4}
                      stroke="#64748b" strokeWidth={0.5} />
                    <line x1={cx + rOuter} y1={cy - rOuter - 12} x2={cx + rOuter} y2={cy - rOuter - 4}
                      stroke="#64748b" strokeWidth={0.5} />
                    <text x={cx} y={cy - rOuter - 10} textAnchor="middle" fontSize={7} fill="#64748b" fontWeight="600">
                      φ = {inp.phi} mm
                    </text>

                    {/* d dimension (right side) */}
                    <line x1={cx + rOuter + 8} y1={cy} x2={cx + rOuter + 8} y2={cy - rInner}
                      stroke="#f59e0b" strokeWidth={0.5} />
                    <line x1={cx + rOuter + 4} y1={cy} x2={cx + rOuter + 12} y2={cy}
                      stroke="#f59e0b" strokeWidth={0.5} />
                    <line x1={cx + rOuter + 4} y1={cy - rInner} x2={cx + rOuter + 12} y2={cy - rInner}
                      stroke="#f59e0b" strokeWidth={0.5} />
                    <text x={cx + rOuter + 16} y={cy - rInner / 2 + 3} fontSize={6} fill="#f59e0b" fontWeight="600">
                      d={inp.d}
                    </text>

                    {/* Center label */}
                    <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7} fill="#1e293b" fontWeight="600">
                      Ac
                    </text>

                    {/* Legend */}
                    <InlineLegend
                      items={[
                        { label: 'Béton', color: '#3b82f6' },
                        { label: `φ${inp.d_bar}×${inp.n_bars}`, color: '#1e40af' },
                      ]}
                      x={cx - rOuter}
                      y={cy + rOuter + 14}
                    />
                  </g>
                );
              })()}
            </SectionCanvas>
          </div>

          {/* Croquis 2 : Enveloppe cisaillement */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-3">
            <SectionCanvas title="Enveloppe V" vbW={220} vbH={220}>
              {res && (() => {
                const ox = 35, oy = 15, w = 170, h = 170;
                const maxV = Math.max(...res.v_envelope, res.v_rdc, res.v_rdc_max, 1);
                const sc = h / (maxV * 1.1);

                return (
                  <g>
                    {/* Axes */}
                    <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />
                    <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />

                    {/* Envelope fill */}
                    <polygon
                      points={[
                        `${ox},${oy + h}`,
                        ...res.v_envelope_x.map((x, i) => {
                          const px = ox + (x / res.v_envelope_x[res.v_envelope_x.length - 1]) * w;
                          const py = oy + h - res.v_envelope[i] * sc;
                          return `${px},${py}`;
                        }),
                        `${ox + w},${oy + h}`,
                      ].join(' ')}
                      fill="#3b82f6" opacity={0.1}
                    />

                    {/* Envelope line */}
                    <polyline
                      points={res.v_envelope_x.map((x, i) => {
                        const px = ox + (x / res.v_envelope_x[res.v_envelope_x.length - 1]) * w;
                        const py = oy + h - res.v_envelope[i] * sc;
                        return `${px},${py}`;
                      }).join(' ')}
                      fill="none" stroke="#3b82f6" strokeWidth={1.5}
                    />

                    {/* VRd,c line */}
                    <line
                      x1={ox} y1={oy + h - res.v_rdc * sc}
                      x2={ox + w} y2={oy + h - res.v_rdc * sc}
                      stroke="#22c55e" strokeWidth={1} strokeDasharray="4,2"
                    />
                    <rect x={ox + w - 32} y={oy + h - res.v_rdc * sc - 9} width={32} height={9} rx={1} fill="#fff" fillOpacity={0.8} />
                    <text x={ox + w - 2} y={oy + h - res.v_rdc * sc - 1} textAnchor="end" fontSize={6} fill="#22c55e" fontWeight="600">
                      VRd,c
                    </text>

                    {/* VRd,max line */}
                    <line
                      x1={ox} y1={oy + h - res.v_rdc_max * sc}
                      x2={ox + w} y2={oy + h - res.v_rdc_max * sc}
                      stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2"
                    />
                    <rect x={ox + w - 40} y={oy + h - res.v_rdc_max * sc - 9} width={40} height={9} rx={1} fill="#fff" fillOpacity={0.8} />
                    <text x={ox + w - 2} y={oy + h - res.v_rdc_max * sc - 1} textAnchor="end" fontSize={6} fill="#ef4444" fontWeight="600">
                      VRd,max
                    </text>

                    {/* VEd,max annotation */}
                    <text x={ox + 4} y={oy + 10} fontSize={6} fill="#3b82f6" fontWeight="600">
                      VEd,max = {res.v_ed_max.toFixed(0)} kN
                    </text>

                    {/* Axis labels */}
                    <text x={ox + w / 2} y={oy + h + 12} textAnchor="middle" fontSize={5} fill="#64748b">x (mm)</text>
                    <text x={ox - 4} y={oy + h / 2} textAnchor="middle" fontSize={5} fill="#64748b" transform={`rotate(-90, ${ox - 4}, ${oy + h / 2})`}>V (kN)</text>

                    <InlineLegend
                      items={[
                        { label: 'Enveloppe V', color: '#3b82f6' },
                        { label: 'VRd,c', color: '#22c55e' },
                        { label: 'VRd,max', color: '#ef4444' },
                      ]}
                      x={ox}
                      y={oy + h + 18}
                    />
                  </g>
                );
              })()}
            </SectionCanvas>
          </div>
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
                  ['ρl,min', `${res.rho_min.toFixed(3)}%`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Cisaillement section circulaire — EC2 §6.2"
                latex={String.raw`V_{Rd,c} = C_{Rd,c} \cdot k \cdot (100 \rho_l f_{ck})^{1/3} \cdot \frac{A_c}{u_1}`}
                description="Résistance au cisaillement sans armure transversale — section circulaire"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`V_{Ed,max}`, meaning: 'Effort max', value: res.v_ed_max.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`V_{Rd,c}`, meaning: 'Résistance béton', value: res.v_rdc.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`V_{Rd,max}`, meaning: 'Plafond béton', value: res.v_rdc_max.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`k`, meaning: 'Facteur taille', value: res.k_factor.toFixed(2), unit: '-' },
                  { symbol: String.raw`\beta`, meaning: 'Facteur charge', value: res.beta_factor.toFixed(2), unit: '-' },
                  { symbol: String.raw`\sigma_{cd}`, meaning: 'Contrainte axiale', value: res.sigma_cd.toFixed(1), unit: 'MPa' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.ratio_v_max <= 1 && res.ratio_v <= 1 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Section</div>
                <div className="font-mono space-y-0.5">
                  <div>φ = {inp.phi} mm · d = {inp.d} mm · Ac = {res.area_concrete.toFixed(0)} mm²</div>
                  <div>u₁ = {res.perimeter_u1.toFixed(0)} mm · ρl = {inp.rho_l}%</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Vérifications</div>
                <div className="font-mono space-y-0.5">
                  <div>VEd,max = {res.v_ed_max.toFixed(1)} kN {'≤'} VRd,c = {res.v_rdc.toFixed(1)} kN → {res.ratio_v <= 1 ? '✓ Cisaillement non armé' : '✗ Cisaillement armé nécessaire'}</div>
                  <div>VEd,max = {res.v_ed_max.toFixed(1)} kN {'≤'} VRd,max = {res.v_rdc_max.toFixed(1)} kN → {res.ratio_v_max <= 1 ? '✓ Section OK' : '✗ Augmenter φ'}</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Paramètres</div>
                <div className="font-mono space-y-0.5">
                  <div>k = {res.k_factor.toFixed(2)} · β = {res.beta_factor.toFixed(2)} · σcd = {res.sigma_cd.toFixed(1)} MPa</div>
                  <div>ρl,min = {res.rho_min.toFixed(3)}% → {inp.rho_l >= res.rho_min ? '✓' : '✗ Insuffisant'}</div>
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
