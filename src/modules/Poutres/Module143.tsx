import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { TorsionMultitubInputs, TorsionMultitubOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: TorsionMultitubInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bn: 490, h0: 300, e_pm: 50, e_pl: 50,
  a0: 50, c0: 50, v0: 60, n_v: 4,
  t_ed: 100, n_r: 2,
};

export default function Module143() {
  const [inp, setInp] = useState<TorsionMultitubInputs>(DEFAULT);
  const [res, setRes] = useState<TorsionMultitubOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof TorsionMultitubInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<TorsionMultitubOutput>('calculate_torsion_multitub_143', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">143 Torsion Multitub <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Torsion sections multitubulaires — EC2 §6.3</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Bn" unit="mm" value={inp.bn} onChange={S('bn')} min={100} max={3000} step={10} />
          <NumField label="H0" unit="mm" value={inp.h0} onChange={S('h0')} min={50} max={1000} step={10} />
          <NumField label="e_pm" unit="mm" value={inp.e_pm} onChange={S('e_pm')} min={10} max={200} step={5} />
          <NumField label="e_pl" unit="mm" value={inp.e_pl} onChange={S('e_pl')} min={10} max={200} step={5} />
          <NumField label="A0" unit="mm" value={inp.a0} onChange={S('a0')} min={10} max={200} step={5} />
          <NumField label="C0" unit="mm" value={inp.c0} onChange={S('c0')} min={10} max={200} step={5} />
          <NumField label="V0" unit="mm" value={inp.v0} onChange={S('v0')} min={10} max={200} step={5} />
          <NumField label="Nb alvéoles" unit="-" value={inp.n_v} onChange={S('n_v')} min={1} max={20} step={1} />
          <NumField label="Nb rect." unit="-" value={inp.n_r} onChange={S('n_r')} min={1} max={10} step={1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="TEd" unit="kN·m" value={inp.t_ed} onChange={S('t_ed')} min={0} max={1000} step={5} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>ω_total = <b>{res.omega_total.toFixed(4)}</b> m²</div>
              <div>K_total = <b>{res.k_total.toFixed(4)}</b></div>
              <div>τ_max = <b>{res.cis_max.toFixed(2)}</b> MPa</div>
              <div>fctd = <b>{res.fctd.toFixed(2)}</b> MPa | τ_Rds = <b>{res.tau_rds.toFixed(2)}</b> MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section multitubulaire</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const scale = Math.min(w / inp.bn, h / inp.h0) * 0.8;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const bPx = inp.bn * scale;
              const hPx = inp.h0 * scale;

              return (
                <g>
                  <rect x={cx - bPx / 2} y={cy - hPx / 2} width={bPx} height={hPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  {Array.from({ length: inp.n_v }, (_, i) => {
                    const voidW = (inp.v0 * scale);
                    const totalInner = inp.bn - 2 * inp.e_pm - (inp.n_v - 1) * inp.e_pl;
                    const voidW_actual = (totalInner / inp.n_v) * scale;
                    const startX = cx - bPx / 2 + inp.e_pm * scale;
                    const voidH = (inp.h0 - inp.a0 - inp.c0) * scale;
                    const voidY = cy - hPx / 2 + inp.a0 * scale;

                    return Array.from({ length: inp.n_v }, (_, j) => {
                      const x = startX + j * (voidW_actual + inp.e_pl * scale);
                      return (
                        <g key={`${i}-${j}`}>
                          <rect x={x} y={voidY} width={voidW_actual} height={voidH} fill="white" stroke="#94a3b8" strokeWidth={0.5} />
                          <text x={x + voidW_actual / 2} y={voidY + voidH / 2 + 3} textAnchor="middle" fontSize={6} fill="#94a3b8">
                            {j + 1}
                          </text>
                        </g>
                      );
                    });
                  })}

                  {res.cisame.map((tau, i) => (
                    <g key={i}>
                      <text x={cx - bPx / 2 - 10} y={cy + i * 12 - (res.cisame.length - 1) * 6} textAnchor="end" fontSize={7} fill="#ef4444">
                        τ={tau.toFixed(2)}
                      </text>
                    </g>
                  ))}

                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    TEd={inp.t_ed}kN·m | τ_max={res.cis_max.toFixed(2)}MPa | ω={res.omega_total.toFixed(4)}m²
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
              <li className={res.ratio_torsion <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_torsion <= 1.0 ? '✓' : '✗'} τ_max/τ_Rds = {(res.ratio_torsion * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• ω_total = {res.omega_total.toFixed(4)} m²</li>
              <li className="text-slate-500">• K_total = {res.k_total.toFixed(4)}</li>
              <li className="text-slate-500">• τ_max = {res.cis_max.toFixed(2)} MPa</li>
              <li className="text-slate-500">• fctd = {res.fctd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_Rds = {res.tau_rds.toFixed(2)} MPa</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
