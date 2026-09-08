import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ReservoirCirculaireInputs, ReservoirCirculaireOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

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
  const [res, setRes] = useState<ReservoirCirculaireOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof ReservoirCirculaireInputs) => (v: number | string) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<ReservoirCirculaireOutput>('calculate_reservoir_circulaire_145', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">145 Réservoir Circulaire <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Réservoirs circulaires béton armé — EC2</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={1000} max={50000} step={500} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={1000} step={10} />
          <NumField label="e" unit="mm" value={inp.e} onChange={S('e')} min={50} max={500} step={10} />
          <NumField label="L" unit="mm" value={inp.l} onChange={S('l')} min={500} max={20000} step={100} />
          <NumField label="h_eau" unit="mm" value={inp.h_eau} onChange={S('h_eau')} min={0} max={20000} step={100} />
          <NumField label="hw" unit="mm" value={inp.hw} onChange={S('hw')} min={0} max={20000} step={100} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Nb liserés" unit="-" value={inp.nli} onChange={S('nli')} min={1} max={20} step={1} />
          <NumField label="φ armature" unit="mm" value={inp.phi_s} onChange={S('phi_s')} min={6} max={40} step={1} />
          <NumField label="s" unit="mm" value={inp.s} onChange={S('s')} min={50} max={500} step={10} />
          <NumField label="c" unit="mm" value={inp.c} onChange={S('c')} min={10} max={100} step={5} />
          <NumField label="a0" unit="mm" value={inp.a0} onChange={S('a0')} min={10} max={100} step={5} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
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

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupe réservoir</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
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
      </div>
    </div>
  );
}
