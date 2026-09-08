import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { VerificationDallesPoinconnementInputs, VerificationDallesPoinconnementOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: VerificationDallesPoinconnementInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  c1: 250, c2: 250, h: 220, d_x: 190, d_y: 190,
  v_ed: 600, m_ed: 80, asx: 5.0, asy: 5.0, b_vd: 500,
  opening_l1: 200, opening_l2: 200, opening_x: 800, opening_y: 0,
  has_opening: false, has_shear_reinf: false, asw: 0,
};

export default function Module133() {
  const [inp, setInp] = useState<VerificationDallesPoinconnementInputs>(DEFAULT);
  const [res, setRes] = useState<VerificationDallesPoinconnementOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof VerificationDallesPoinconnementInputs) =>
    (v: number | boolean) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<VerificationDallesPoinconnementOutput>('calculate_verification_dalles_poinconnement_133', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">133 Vérif. Poinçonnement <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Vérification poinçonnement — ouvertures, η, périmètres</p>

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
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={500} step={5} />
          <NumField label="dx" unit="mm" value={inp.d_x} onChange={S('d_x')} min={80} max={400} step={5} />
          <NumField label="dy" unit="mm" value={inp.d_y} onChange={S('d_y')} min={80} max={400} step={5} />
          <NumField label="Bvd" unit="kN" value={inp.b_vd} onChange={S('b_vd')} min={0} max={5000} step={10} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="VEd" unit="kN" value={inp.v_ed} onChange={S('v_ed')} min={0} max={5000} step={10} />
          <NumField label="MEd" unit="kN·m" value={inp.m_ed} onChange={S('m_ed')} min={0} max={500} step={5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Asx" unit="cm²" value={inp.asx} onChange={S('asx')} min={0} max={100} step={0.5} />
          <NumField label="Asy" unit="cm²" value={inp.asy} onChange={S('asy')} min={0} max={100} step={0.5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Ouverture</div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={inp.has_opening}
            onChange={(e) => S('has_opening')(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs">Activer ouverture</span>
        </div>
        {inp.has_opening && (
          <div className="grid grid-cols-2 gap-2">
            <NumField label="l1" unit="mm" value={inp.opening_l1} onChange={S('opening_l1')} min={0} max={2000} step={50} />
            <NumField label="l2" unit="mm" value={inp.opening_l2} onChange={S('opening_l2')} min={0} max={2000} step={50} />
            <NumField label="x₀" unit="mm" value={inp.opening_x} onChange={S('opening_x')} min={-3000} max={3000} step={50} />
            <NumField label="y₀" unit="mm" value={inp.opening_y} onChange={S('opening_y')} min={-3000} max={3000} step={50} />
          </div>
        )}

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures poinç.</div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={inp.has_shear_reinf}
            onChange={(e) => S('has_shear_reinf')(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs">Armatures de poinçonnement</span>
        </div>
        {inp.has_shear_reinf && (
          <NumField label="Asw" unit="cm²/m" value={inp.asw} onChange={S('asw')} min={0} max={5} step={0.05} />
        )}

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>d = <b>{res.d_mean.toFixed(1)}</b> mm</div>
              <div>ρlx = <b>{res.rho_lx.toFixed(3)}</b>% | ρly = <b>{res.rho_ly.toFixed(3)}</b>% | ρl = <b>{res.rho_l.toFixed(3)}</b>%</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>u0 = <b>{res.u0.toFixed(0)}</b> mm</div>
              <div>u1 = <b>{res.u1.toFixed(0)}</b> mm</div>
              {res.delta_u > 0 && <div>Δu = <b>{res.delta_u.toFixed(0)}</b> mm | u1' = <b>{res.u1_deducted.toFixed(0)}</b> mm</div>}
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>vRd,c = <b>{res.v_rdc.toFixed(2)}</b> MPa</div>
              <div>vRd,c,max = <b>{res.v_rdc_max.toFixed(2)}</b> MPa</div>
              {inp.has_shear_reinf && <div>vRd,s = <b>{res.v_rds.toFixed(2)}</b> MPa</div>}
              {res.asw_sr > 0 && <div>Asw/s,req = <b>{res.asw_sr.toFixed(2)}</b> cm²/m</div>}
              {res.zr > 0 && <div>Zr = <b>{res.zr.toFixed(3)}</b> m</div>}
              {res.z_del > 0 && <div>δ = <b>{res.z_del.toFixed(3)}</b></div>}
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
              const u1dr = res.u1_deducted / (2 * Math.PI) * sc;

              const colAngle = Math.atan2(inp.opening_y, inp.opening_x);
              const openDist = Math.sqrt(inp.opening_x * inp.opening_x + inp.opening_y * inp.opening_y) * sc;

              return (
                <g>
                  <rect x={ox - u1r - 10} y={oy - u1r - 10} width={(u1r + 10) * 2} height={(u1r + 10) * 2} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />

                  {inp.has_opening && inp.opening_l1 > 0 && inp.opening_l2 > 0 && (
                    <g>
                      <rect
                        x={ox + inp.opening_x * sc - inp.opening_l1 * sc / 2}
                        y={oy + inp.opening_y * sc - inp.opening_l2 * sc / 2}
                        width={inp.opening_l1 * sc}
                        height={inp.opening_l2 * sc}
                        fill="#fecaca" stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3,2" rx={1}
                      />
                      <text
                        x={ox + inp.opening_x * sc}
                        y={oy + inp.opening_y * sc + 3}
                        textAnchor="middle" fontSize={5} fill="#dc2626"
                      >
                        Ouverture
                      </text>
                    </g>
                  )}

                  <circle cx={ox} cy={oy} r={u1r} fill="none" stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4,2" />
                  <text x={ox + u1r + 4} y={oy - 2} fontSize={5} fill="#d97706">u1</text>

                  {res.delta_u > 0 && (
                    <circle cx={ox} cy={oy} r={u1dr} fill="none" stroke="#ef4444" strokeWidth={0.8} strokeDasharray="2,2" />
                  )}

                  <circle cx={ox} cy={oy} r={u0r} fill="none" stroke="#2563eb" strokeWidth={1} strokeDasharray="2,2" />
                  <text x={ox + u0r + 4} y={oy + 12} fontSize={5} fill="#1d4ed8">u0</text>

                  <rect x={ox - hw} y={oy - hh} width={inp.c1 * sc} height={inp.c2 * sc} fill="#1e293b" rx={1} />
                  <text x={ox} y={oy + 2} textAnchor="middle" fontSize={5} fill="white">{inp.c1}×{inp.c2}</text>

                  {inp.has_opening && inp.opening_l1 > 0 && (
                    <line
                      x1={ox}
                      y1={oy}
                      x2={ox + inp.opening_x * sc}
                      y2={oy + inp.opening_y * sc}
                      stroke="#ef4444" strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5}
                    />
                  )}

                  <text x={ox} y={oy + u1r + 20} textAnchor="middle" fontSize={6} fill="#64748b">
                    η = {(res.eta_v * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })()}
          </svg>
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
              <li className={res.eta_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.eta_v <= 1.0 ? '✓' : '✗'} η = {(res.eta_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• d = {res.d_mean.toFixed(1)}mm</li>
              <li className="text-slate-500">• ρl = {res.rho_l.toFixed(3)}%</li>
              <li className="text-slate-500">• u0 = {res.u0.toFixed(0)}mm</li>
              <li className="text-slate-500">• u1 = {res.u1.toFixed(0)}mm</li>
              {res.delta_u > 0 && <li className="text-slate-500">• Δu = {res.delta_u.toFixed(0)}mm</li>}
              <li className="text-slate-500">• vRd,c = {res.v_rdc.toFixed(2)}MPa</li>
              <li className="text-slate-500">• vRd,c,max = {res.v_rdc_max.toFixed(2)}MPa</li>
              {inp.has_shear_reinf && <li className="text-slate-500">• vRd,s = {res.v_rds.toFixed(2)}MPa</li>}
              {res.asw_sr > 0 && <li className="text-slate-500">• Asw/s,req = {res.asw_sr.toFixed(2)}cm²/m</li>}
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
