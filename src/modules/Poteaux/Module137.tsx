import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { InteracCircInputs, InteracCircOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: InteracCircInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15, euk: 0.02,
  phi: 400, n_bars: 8, d_bar: 20, cover: 40,
  n_sec: 50, m_ed: 500, n_ed: 2000,
  diagram: 'parabola',
};

export default function Module137() {
  const [inp, setInp] = useState<InteracCircInputs>(DEFAULT);
  const [res, setRes] = useState<InteracCircOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof InteracCircInputs) => (v: number | string) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<InteracCircOutput>('calculate_interac_circ_137', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">137 Interac. Circulaire <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Courbe N-M section circulaire — EC2 §6.1</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
          <NumField label="εuk" unit="‰" value={inp.euk * 1000} onChange={(v) => S('euk')(v / 1000)} min={10} max={50} step={1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={100} max={2000} step={10} />
          <NumField label="Nb barres" unit="-" value={inp.n_bars} onChange={S('n_bars')} min={4} max={32} step={1} />
          <NumField label="φ barre" unit="mm" value={inp.d_bar} onChange={S('d_bar')} min={6} max={50} step={2} />
          <NumField label="Couverture" unit="mm" value={inp.cover} onChange={S('cover')} min={15} max={100} step={5} />
          <NumField label="Nb sections" unit="-" value={inp.n_sec} onChange={S('n_sec')} min={20} max={200} step={5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={0} max={50000} step={100} />
          <NumField label="MEd" unit="kN·m" value={inp.m_ed} onChange={S('m_ed')} min={0} max={5000} step={10} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>N₀ = <b>{res.n0.toFixed(0)}</b> kN</div>
              <div>ρ_prov = <b>{res.rho_prov.toFixed(2)}</b>% | ρ_min = <b>{res.rho_min.toFixed(0)}</b> mm²</div>
              <div>μ = <b>{res.mu.toFixed(2)}</b> | ν = <b>{res.nu.toFixed(2)}</b></div>
              <div>Ratio NM = <b>{res.ratio_nm.toFixed(2)}</b></div>
              <div>Ratio N = <b>{res.ratio_n.toFixed(2)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Courbe d'interaction N-M</h2>
          <svg viewBox="0 0 400 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 50, oy = 120, w = 320, h = 200;
              const maxN = Math.max(...res.n_resist.map(Math.abs), 1);
              const maxM = Math.max(...res.m_resist.map(Math.abs), 1);
              const scN = h / maxN / 2;
              const scM = w / maxM / 2;
              const cx = ox + w / 2;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={cx} y1={10} x2={cx} y2={240} stroke="#94a3b8" strokeWidth={0.5} />

                  {res.n_resist.map((n, i) => {
                    if (i === 0) return null;
                    const m1 = res.m_resist[i - 1] * scM;
                    const n1 = res.n_resist[i - 1] * scN;
                    const m2 = res.m_resist[i] * scM;
                    const n2 = res.n_resist[i] * scN;
                    return (
                      <line
                        key={i}
                        x1={cx + m1} y1={oy - n1}
                        x2={cx + m2} y2={oy - n2}
                        stroke="#2563eb" strokeWidth={1.5}
                      />
                    );
                  })}

                  {res.m_demand.length > 1 && (
                    <polyline
                      points={res.m_demand.map((m, i) => `${cx + m * scM},${oy - res.n_demand[i] * scN}`).join(' ')}
                      fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,2"
                    />
                  )}

                  <circle cx={cx + res.m_demand[res.m_demand.length - 1] * scM} cy={oy - res.n_demand[res.n_demand.length - 1] * scN} r={3} fill="#ef4444" />

                  <text x={cx} y={248} textAnchor="middle" fontSize={6} fill="#64748b">M (kN·m)</text>
                  <text x={15} y={oy + 3} textAnchor="middle" fontSize={6} fill="#64748b">N (kN)</text>
                  <text x={cx + w / 2} y={248} textAnchor="middle" fontSize={5} fill="#2563eb">Courbe N-M</text>
                  <text x={cx + w / 2} y={240} textAnchor="middle" fontSize={5} fill="#ef4444">Point de calcul</text>
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
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className={res.ratio_nm <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_nm <= 1.0 ? '✓' : '✗'} Ratio NM = {res.ratio_nm.toFixed(2)}
              </li>
              <li className={res.ratio_n <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_n <= 1.0 ? '✓' : '✗'} Ratio N = {res.ratio_n.toFixed(2)}
              </li>
              <li className={res.rho_prov >= res.rho_min ? 'text-green-600' : 'text-red-600'}>
                {res.rho_prov >= res.rho_min ? '✓' : '✗'} ρ = {res.rho_prov.toFixed(2)}% ≥ ρ_min = {res.rho_min.toFixed(0)} mm²
              </li>
              <li className="text-slate-500">• N₀ = {res.n0.toFixed(0)} kN</li>
              <li className="text-slate-500">• μ = {res.mu.toFixed(2)} | ν = {res.nu.toFixed(2)}</li>
              <li className="text-slate-500">• Nb sections = {res.n_resist.length}</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
