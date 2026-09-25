import { useState } from 'react';
import type { PlancherDallePoinconnementInputs, PlancherDallePoinconnementOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, InlineLegend } from '../../components/drafting';

const DEFAULT: PlancherDallePoinconnementInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  c1: 250, c2: 250, c3: 1500, c4: 1500,
  h: 220, d: 190,
  v_ed: 800, m_ed_x: 120, m_ed_y: 90,
  cas: 1, rho: 0.01, asw: 0.0, asw_min: 0.35,
  s_max: 200, phi_link: 10,
};

const CASES = [
  { val: 1, label: 'Intérieur' },
  { val: 2, label: 'Rive N' },
  { val: 3, label: 'Rive S' },
  { val: 4, label: 'Rive O' },
  { val: 5, label: 'Rive E' },
  { val: 6, label: 'Angle SO' },
  { val: 7, label: 'Angle NO' },
  { val: 8, label: 'Angle SE' },
  { val: 9, label: 'Angle NE' },
];

export default function Module130() {
  const [inp, setInp] = useState<PlancherDallePoinconnementInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PlancherDallePoinconnementInputs, PlancherDallePoinconnementOutput>(
    'calculate_plancher_dalle_poinconnement_130', inp,
  );
  const S = (k: keyof PlancherDallePoinconnementInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  const caseLabel = CASES.find((c) => c.val === inp.cas)?.label || '?';
  const status = err ? 'fail' : !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof PlancherDallePoinconnementInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="130 Plancher Dalle Poinç."
      subtitle="Poinçonnement dalle — EC2 §6.4"
      eurocode="EC2 §6.4"
      category="Dalles"
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

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Poteau</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('c1', 'c₁', 'mm', 100, 1000, 10)}
            {slider('c2', 'c₂', 'mm', 100, 1000, 10)}
            {slider('c3', 'c₃ (drop)', 'mm', 500, 5000, 50)}
            {slider('c4', 'c₄ (drop)', 'mm', 500, 5000, 50)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Position</div>
          <div className="grid grid-cols-3 gap-1">
            {CASES.map((c) => (
              <button
                key={c.val}
                onClick={() => S('cas')(c.val)}
                className={`text-[10px] px-1 py-0.5 rounded border transition-all ${
                  inp.cas === c.val
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Dalle</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('h', 'h', 'mm', 100, 500, 5)}
            {slider('d', 'd', 'mm', 80, 400, 5)}
            <ParamSlider label="ρ" unit="%" value={inp.rho * 100} min={0.1} max={5} step={0.1} onChange={(v) => S('rho')(v / 100)} />
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('v_ed', 'VEd', 'kN', 0, 5000, 10)}
            {slider('m_ed_x', 'MEd,x', 'kN·m', 0, 500, 5)}
            {slider('m_ed_y', 'MEd,y', 'kN·m', 0, 500, 5)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Armatures poinçonnement</div>
          <div className="grid grid-cols-2 gap-2">
            {slider('asw', 'Asw', 'cm²/m', 0, 5, 0.05)}
            {slider('s_max', 's,max', 'mm', 50, 400, 10)}
            {slider('phi_link', 'φ lien', 'mm', 6, 16, 1)}
          </div>

          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title={`Plan — ${caseLabel}`} vbW={500} vbH={440}>
            {res && (() => {
              const margin = 50;
              const drawW = 400, drawH = 360;
              const maxDim = Math.max(inp.c3, inp.c4, res.u1 / Math.PI);
              const sc = Math.min(drawW / maxDim, drawH / maxDim) * 0.85;
              const ox = margin + drawW / 2;
              const oy = margin + drawH / 2;

              const colW = inp.c1 * sc, colH = inp.c2 * sc;
              const dropW = inp.c3 * sc, dropH = inp.c4 * sc;
              const u1r = res.u1 / (2 * Math.PI) * sc;
              const u0r = res.u0 / 4 * sc;

              const halfDraw = Math.max(dropW, u1r * 2) / 2 + 30;
              const stepMm = halfDraw / sc > 1500 ? 500 : halfDraw / sc > 800 ? 200 : 100;
              const maxMm = Math.ceil(halfDraw / sc / stepMm) * stepMm;

              return (
                <g>
                  {/* Drop panel */}
                  <rect x={ox - dropW / 2} y={oy - dropH / 2} width={dropW} height={dropH}
                    fill="#e0f2fe" stroke="#7dd3fc" strokeWidth={1} rx={3} />

                  {/* u0 perimeter */}
                  <rect x={ox - u0r} y={oy - u0r} width={u0r * 2} height={u0r * 2}
                    fill="none" stroke="#2563eb" strokeWidth={0.8} strokeDasharray="3,2" rx={2} />

                  {/* u1 perimeter */}
                  <circle cx={ox} cy={oy} r={u1r} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6,3" />

                  {/* Radial shear reinforcement lines */}
                  {Array.from({ length: Math.min(res.n_rays, 16) }, (_, i) => {
                    const angle = (i / Math.min(res.n_rays, 16)) * Math.PI * 2;
                    const r1 = Math.max(colW, colH) / 2 + 4;
                    const r2 = u1r;
                    return (
                      <line key={i}
                        x1={ox + r1 * Math.cos(angle)} y1={oy + r1 * Math.sin(angle)}
                        x2={ox + r2 * Math.cos(angle)} y2={oy + r2 * Math.sin(angle)}
                        stroke="#2563eb" strokeWidth={0.6} opacity={0.5} />
                    );
                  })}

                  {/* Ring reinforcement circles */}
                  {res.ring_radii.map((r, i) => (
                    <circle key={i} cx={ox} cy={oy} r={r * sc}
                      fill="none" stroke="#2563eb" strokeWidth={0.4} strokeDasharray="2,2" opacity={0.4} />
                  ))}

                  {/* Column */}
                  <rect x={ox - colW / 2} y={oy - colH / 2} width={colW} height={colH}
                    fill="#1e293b" rx={2} />
                  <text x={ox} y={oy + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={8} fill="white" fontWeight="600">
                    {inp.c1}×{inp.c2}
                  </text>

                  {/* Labels */}
                  <text x={ox + u1r + 6} y={oy - 2} fontSize={9} fill="#d97706" fontWeight="600">u₁</text>
                  <text x={ox + u0r + 6} y={oy + 14} fontSize={9} fill="#1d4ed8" fontWeight="600">u₀</text>
                  <text x={ox + dropW / 2 + 4} y={oy - dropH / 2 - 4} fontSize={7} fill="#0284c7" fontWeight="600">
                    Drop {inp.c3}×{inp.c4}
                  </text>

                  {/* Legend */}
                  <InlineLegend
                    items={[
                      { label: `Poteau ${inp.c1}×${inp.c2}`, color: '#1e293b' },
                      { label: `u₁ = ${res.u1.toFixed(0)} mm`, color: '#f59e0b' },
                      { label: `u₀ = ${res.u0.toFixed(0)} mm`, color: '#2563eb' },
                    ]}
                    x={margin}
                    y={margin - 10}
                  />

                  {/* Axis X — bottom, 0 at center, positive right */}
                  {Array.from({ length: Math.floor(maxMm / stepMm) * 2 + 1 }, (_, i) => -maxMm + i * stepMm).map(v => (
                    <g key={`x${v}`}>
                      <line x1={ox + v * sc} y1={oy + halfDraw + 2} x2={ox + v * sc} y2={oy + halfDraw + 8} stroke="#94a3b8" strokeWidth={0.6} />
                      <text x={ox + v * sc} y={oy + halfDraw + 16} textAnchor="middle" fontSize={7} fill="#94a3b8">
                        {Math.abs(v)}
                      </text>
                    </g>
                  ))}
                  <line x1={ox - halfDraw} y1={oy + halfDraw + 2} x2={ox + halfDraw} y2={oy + halfDraw + 2} stroke="#94a3b8" strokeWidth={0.3} />

                  {/* Axis Y — left, 0 at center, positive up */}
                  {Array.from({ length: Math.floor(maxMm / stepMm) * 2 + 1 }, (_, i) => -maxMm + i * stepMm).map(v => (
                    <g key={`y${v}`}>
                      <line x1={ox - halfDraw - 8} y1={oy - v * sc} x2={ox - halfDraw - 2} y2={oy - v * sc} stroke="#94a3b8" strokeWidth={0.6} />
                      <text x={ox - halfDraw - 12} y={oy - v * sc + 2.5} textAnchor="end" fontSize={7} fill="#94a3b8">
                        {Math.abs(v)}
                      </text>
                    </g>
                  ))}
                  <line x1={ox - halfDraw - 2} y1={oy - halfDraw} x2={ox - halfDraw - 2} y2={oy + halfDraw} stroke="#94a3b8" strokeWidth={0.3} />

                  {/* Axis labels */}
                  <text x={ox} y={oy + halfDraw + 28} textAnchor="middle" fontSize={8} fill="#64748b">mm</text>
                  <text x={ox - halfDraw - 28} y={oy} textAnchor="middle" fontSize={8} fill="#64748b" transform={`rotate(-90 ${ox - halfDraw - 28} ${oy})`}>mm</text>

                  {/* Dimension annotations */}
                  <text x={ox} y={oy + Math.max(dropH, u1r * 2) / 2 + 36} textAnchor="middle" fontSize={8} fill="#64748b">
                    VEd = {inp.v_ed} kN · β = {res.beta.toFixed(2)}
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
                  ['u₀', `${res.u0.toFixed(0)} mm`],
                  ['u₁', `${res.u1.toFixed(0)} mm`],
                  ['β', res.beta.toFixed(3)],
                  ['vRd,c·β', `${res.v_rdc.toFixed(1)} kN`],
                  ['vRd,c,max', `${res.v_rdc_max.toFixed(1)} MPa`],
                  ['Asw,req', `${res.asw_req.toFixed(2)} cm²/m`],
                  ['Ratio', `${(res.ratio_v * 100).toFixed(0)}%`],
                  ['Anneaux', `${res.n_rings} × ${res.n_rays} rayons`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Poinçonnement dalle — EC2 §6.4"
                latex={String.raw`v_{Ed} = \frac{\beta \cdot V_{Ed}}{u_1 \cdot d} \le v_{Rd,cs}`}
                description="Vérification poinçonnement avec armatures de cisaillement"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`V_{Ed}`, meaning: 'Réaction d\'appui', value: inp.v_ed, unit: 'kN' },
                  { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.u1.toFixed(0), unit: 'mm' },
                  { symbol: String.raw`\beta`, meaning: 'Facteur de cisaillement', value: res.beta.toFixed(3), unit: '-' },
                  { symbol: String.raw`v_{Rd,c}`, meaning: 'Résistance béton', value: res.v_rdc.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`d`, meaning: 'Enfoncement', value: inp.d, unit: 'mm' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.ratio_v <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Périmètres de contrôle</div>
                <div className="font-mono">
                  <div>u₀ = 2(c₁ + c₂) = {res.u0.toFixed(0)} mm</div>
                  <div>u₁ = périmètre à 2d = {res.u1.toFixed(0)} mm</div>
                </div>
                <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Capacité résistante</div>
                <div className="font-mono">
                  <div>vRd,c·β = {res.v_rdc.toFixed(1)} kN</div>
                  <div>vRd,c,max = {res.v_rdc_max.toFixed(1)} MPa</div>
                  {inp.asw > 0 && <div>vRd,s = {res.v_rds.toFixed(1)} kN</div>}
                </div>
                {res.asw_req > 0 && (
                  <>
                    <div className="font-semibold text-blue-700 dark:text-blue-400 pt-1">Armatures requises</div>
                    <div className="font-mono">
                      <div>Asw,req = {res.asw_req.toFixed(2)} cm²/m</div>
                      <div>Asw,fourni = {res.asw_provided.toFixed(2)} cm²/m</div>
                      <div>Nb anneaux = {res.n_rings} · Rayons = {res.n_rays}</div>
                    </div>
                  </>
                )}
              </div>

              <ul className="text-xs space-y-1">
                {res.diag.map((d, i) => (
                  <li key={i} className={`font-mono px-2 py-1 rounded ${
                    d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                    d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' :
                    'bg-green-50 dark:bg-green-900/20 text-green-600'
                  }`}>{d}</li>
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
