import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { PlancherDallePoinconnementInputs, PlancherDallePoinconnementOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

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
  const [res, setRes] = useState<PlancherDallePoinconnementOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof PlancherDallePoinconnementInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<PlancherDallePoinconnementOutput>('calculate_plancher_dalle_poinconnement_130', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const caseLabel = CASES.find((c) => c.val === inp.cas)?.label || '?';

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">130 Plancher Dalle Poinç. <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Poinçonnement dalle — EC2 §6.4, périmètres + β + armatures</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poteau</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="c1" unit="mm" value={inp.c1} onChange={S('c1')} min={100} max={1000} step={10} />
          <NumField label="c2" unit="mm" value={inp.c2} onChange={S('c2')} min={100} max={1000} step={10} />
          <NumField label="c3" unit="mm" value={inp.c3} onChange={S('c3')} min={500} max={5000} step={50} />
          <NumField label="c4" unit="mm" value={inp.c4} onChange={S('c4')} min={500} max={5000} step={50} />
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
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={500} step={5} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={80} max={400} step={5} />
          <NumField label="ρ" unit="%" value={inp.rho * 100} onChange={(v) => S('rho')(v / 100)} min={0.1} max={5} step={0.1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="VEd" unit="kN" value={inp.v_ed} onChange={S('v_ed')} min={0} max={5000} step={10} />
          <NumField label="MEd,x" unit="kN·m" value={inp.m_ed_x} onChange={S('m_ed_x')} min={0} max={500} step={5} />
          <NumField label="MEd,y" unit="kN·m" value={inp.m_ed_y} onChange={S('m_ed_y')} min={0} max={500} step={5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures poinç.</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Asw" unit="cm²/m" value={inp.asw} onChange={S('asw')} min={0} max={5} step={0.05} />
          <NumField label="s,max" unit="mm" value={inp.s_max} onChange={S('s_max')} min={50} max={400} step={10} />
          <NumField label="φ lien" unit="mm" value={inp.phi_link} onChange={S('phi_link')} min={6} max={16} step={1} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
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

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan — Périmètres de contrôle</h2>
          <svg viewBox="0 0 350 300" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
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
          </svg>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Anneaux de renfort</h2>
          {res && res.asw_per_ring.length > 0 && (
            <div className="h-28">
              <svg viewBox="0 0 350 80" className="w-full">
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
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
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
      </div>
    </div>
  );
}
