import { useState } from 'react';
import type { PlancherDallePoinconnementInputs, PlancherDallePoinconnementOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

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
      subtitle="Poinçonnement dalle — EC2 §6.4, périmètres + β + armatures"
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

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poteau</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('c1', 'c1', 'mm', 100, 1000, 10)}
          {slider('c2', 'c2', 'mm', 100, 1000, 10)}
          {slider('c3', 'c3', 'mm', 500, 5000, 50)}
          {slider('c4', 'c4', 'mm', 500, 5000, 50)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Type</div>
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

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('h', 'h', 'mm', 100, 500, 5)}
          {slider('d', 'd', 'mm', 80, 400, 5)}
          <ParamSlider label="ρ" unit="%" value={inp.rho * 100} min={0.1} max={5} step={0.1} onChange={(v) => S('rho')(v / 100)} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('v_ed', 'VEd', 'kN', 0, 5000, 10)}
          {slider('m_ed_x', 'MEd,x', 'kN·m', 0, 500, 5)}
          {slider('m_ed_y', 'MEd,y', 'kN·m', 0, 500, 5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures poinç.</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('asw', 'Asw', 'cm²/m', 0, 5, 0.05)}
          {slider('s_max', 's,max', 'mm', 50, 400, 10)}
          {slider('phi_link', 'φ lien', 'mm', 6, 16, 1)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan — Périmètres de contrôle" vbW={350} vbH={300}>
            {res && (() => {
              const ox = 175, oy = 140;
              const sc = 0.15;
              const hw = inp.c1 * sc / 2;
              const hh = inp.c2 * sc / 2;
              const u1r = res.u1 / (2 * Math.PI) * sc;
              const u0r = res.u0 / 4 * sc;
              const dropW = inp.c3 * sc;
              const dropH = inp.c4 * sc;

              const isCorner = inp.cas >= 6 && inp.cas <= 9;
              const isEdge = inp.cas >= 2 && inp.cas <= 5;

              return (
                <g>
                  <rect x={ox - dropW} y={oy - dropH} width={dropW * 2} height={dropH * 2} fill="#e0f2fe" stroke="#7dd3fc" strokeWidth={0.8} rx={2} />
                  <text x={ox + dropW + 4} y={oy - dropH + 8} fontSize={5} fill="#0284c7">Drop panel</text>

                  <circle cx={ox} cy={oy} r={u1r} fill="none" stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4,2" />
                  <text x={ox + u1r + 4} y={oy - 2} fontSize={5} fill="#d97706">u1</text>

                  {inp.cas === 1 && (
                    <>
                      <circle cx={ox} cy={oy} r={u0r} fill="none" stroke="#2563eb" strokeWidth={1} strokeDasharray="2,2" />
                      <text x={ox + u0r + 4} y={oy + 12} fontSize={5} fill="#1d4ed8">u0</text>
                    </>
                  )}

                  <rect x={ox - hw} y={oy - hh} width={inp.c1 * sc} height={inp.c2 * sc} fill="#1e293b" rx={1} />
                  <text x={ox} y={oy + 2} textAnchor="middle" fontSize={5} fill="white">{inp.c1}×{inp.c2}</text>

                  {res.n_rings > 0 && res.ring_radii.length > 0 && res.ring_radii.map((r, i) => (
                    <circle key={i} cx={ox} cy={oy} r={r * sc} fill="none" stroke="#2563eb" strokeWidth={0.5} strokeDasharray="1.5,1.5" opacity={0.5} />
                  ))}

                  {Array.from({ length: Math.min(res.n_rays, 12) }, (_, i) => {
                    const angle = (i / Math.min(res.n_rays, 12)) * Math.PI * 2;
                    const r1 = hw + 5;
                    const r2 = u1r;
                    return (
                      <line
                        key={i}
                        x1={ox + r1 * Math.cos(angle)}
                        y1={oy + r1 * Math.sin(angle)}
                        x2={ox + r2 * Math.cos(angle)}
                        y2={oy + r2 * Math.sin(angle)}
                        stroke="#2563eb"
                        strokeWidth={0.4}
                        opacity={0.4}
                      />
                    );
                  })}

                  <text x={ox} y={oy + dropH + 14} textAnchor="middle" fontSize={6} fill="#64748b">
                    VEd={inp.v_ed}kN | β={res.beta.toFixed(2)}
                  </text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Anneaux de renfort</h2>
          {res && res.asw_per_ring.length > 0 && (
            <div className="h-28">
              <SectionCanvas title="Anneaux de renfort" vbW={350} vbH={80}>
                {(() => {
                  const maxA = Math.max(...res.asw_per_ring, 0.01);
                  const barH = 50;
                  const w = 350 / res.asw_per_ring.length - 2;
                  return res.asw_per_ring.map((a, i) => {
                    const h = (a / maxA) * barH;
                    const x = (i / res.asw_per_ring.length) * 350;
                    return (
                      <g key={i}>
                        <rect x={x + 1} y={70 - h} width={w} height={h} fill="#2563eb" rx={2} opacity={0.8} />
                        <text x={x + w / 2 + 1} y={75} textAnchor="middle" fontSize={5} fill="#64748b">{res.ring_radii[i]?.toFixed(0) || '-'}</text>
                        <text x={x + w / 2 + 1} y={65 - h} textAnchor="middle" fontSize={5} fill="#1e293b">{a.toFixed(2)}</text>
                      </g>
                    );
                  });
                })()}
              </SectionCanvas>
            </div>
          )}
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats — {caseLabel}</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>u0 = <b>{res.u0.toFixed(0)}</b> mm</div>
              <div>u1 = <b>{res.u1.toFixed(0)}</b> mm | β = <b>{res.beta.toFixed(3)}</b></div>
              <div>u_out = <b>{res.u_out.toFixed(0)}</b> mm</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>vRd,c*β = <b>{res.v_rdc.toFixed(1)}</b> kN</div>
              <div>vRd,c,max = <b>{res.v_rdc_max.toFixed(1)}</b> MPa</div>
              {inp.asw > 0 && <div>vRd,s = <b>{res.v_rds.toFixed(1)}</b> kN</div>}
              <div>Asw,req = <b>{res.asw_req.toFixed(2)}</b> cm²/m</div>
              <div>Nb anneaux = <b>{res.n_rings}</b> | Nb rayons = <b>{res.n_rays}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>


              <FormulaCard
                title="Poinçonnement plancher-dalle"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,cs}`}
                description="Avec armatures de poinçonnement"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Réaction d’appui', value: inp.v_ed },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.u1.toFixed(0) },
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
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} vEd/vRd,c*β = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• u0 = {res.u0.toFixed(0)}mm</li>
              <li className="text-slate-500">• u1 = {res.u1.toFixed(0)}mm</li>
              <li className="text-slate-500">• β = {res.beta.toFixed(3)}</li>
              <li className="text-slate-500">• vRd,c = {res.v_rdc.toFixed(1)}kN</li>
              <li className="text-slate-500">• vRd,c,max = {res.v_rdc_max.toFixed(1)}MPa</li>
              <li className="text-slate-500">• Asw,req = {res.asw_req.toFixed(2)}cm²/m</li>
              <li className="text-slate-500">• Anneaux = {res.n_rings} × Rayons = {res.n_rays}</li>
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
