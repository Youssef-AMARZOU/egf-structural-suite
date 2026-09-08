import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { PoutreCloisonInputs, PoutreCloisonOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: PoutreCloisonInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  h: 200, b: 100, l1: 3000, l2: 3000, l3: 3000,
  nb_appuis: 3, q_panneau: 0.5, q_piedroit: 1.0,
  cnom: 15, phi_trans: 8, code: 1,
};

export default function Module147() {
  const [inp, setInp] = useState<PoutreCloisonInputs>(DEFAULT);
  const [res, setRes] = useState<PoutreCloisonOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof PoutreCloisonInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<PoutreCloisonOutput>('calculate_poutre_cloison_147', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">147 Poutre Cloison <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Poutre cloison 2 et 3 appuis — BAEL/EC2</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={50} max={500} step={10} />
          <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={50} max={300} step={10} />
          <NumField label="L1" unit="mm" value={inp.l1} onChange={S('l1')} min={500} max={10000} step={100} />
          <NumField label="L2" unit="mm" value={inp.l2} onChange={S('l2')} min={500} max={10000} step={100} />
          <NumField label="L3" unit="mm" value={inp.l3} onChange={S('l3')} min={500} max={10000} step={100} />
          <NumField label="Nb appuis" unit="-" value={inp.nb_appuis} onChange={S('nb_appuis')} min={2} max={3} step={1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="q_panneau" unit="kN/m²" value={inp.q_panneau} onChange={S('q_panneau')} min={0} max={5} step={0.1} />
          <NumField label="q_piedroit" unit="kN/m" value={inp.q_piedroit} onChange={S('q_piedroit')} min={0} max={10} step={0.1} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>L_totale = <b>{res.l_totale.toFixed(2)}</b> m | L_portée = {res.l_portee.toFixed(2)} m</div>
              <div>p_total = <b>{res.p_total.toFixed(2)}</b> kN/m</div>
              <div>M_Ed = <b>{res.m_ed.toFixed(2)}</b> kN·m | V_Ed = <b>{res.v_ed.toFixed(2)}</b> kN</div>
              <div>μ = <b>{res.mu.toFixed(3)}</b> | ω = {res.omega.toFixed(3)}</div>
              <div>As = <b>{(res.as_prov / 100).toFixed(1)}</b> cm² | As_min = {(res.as_min / 100).toFixed(1)} cm²</div>
              <div>z_arm = {res.z_arm.toFixed(3)} m | fyd = {res.fyd.toFixed(0)} MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupe — Poutre cloison</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const s = 0.08;
              const bPx = (inp.b / 1000) * s * 1000;
              const hPx = (inp.h / 1000) * s * 1000;

              return (
                <g>
                  <rect x={cx - bPx / 2} y={cy - hPx / 2} width={bPx} height={hPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <circle cx={cx - bPx / 2 + 5} cy={cy + hPx / 2 + 5} r={3} fill="#94a3b8" />
                  <circle cx={cx + bPx / 2 - 5} cy={cy + hPx / 2 + 5} r={3} fill="#94a3b8" />

                  <text x={cx} y={cy - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    b={(inp.b / 1000).toFixed(2)}m | h={(inp.h / 1000).toFixed(2)}m
                  </text>
                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    M_Ed={res.m_ed.toFixed(2)}kN·m | As={res.as_prov.toFixed(1)}cm²/m
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
              <li className={res.ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio >= 1.0 ? '✓' : '✗'} As/As_min = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• L_totale = {res.l_totale.toFixed(2)} m</li>
              <li className="text-slate-500">• L_portée = {res.l_portee.toFixed(2)} m</li>
              <li className="text-slate-500">• p_total = {res.p_total.toFixed(2)} kN/m</li>
              <li className="text-slate-500">• M_Ed = {res.m_ed.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• V_Ed = {res.v_ed.toFixed(2)} kN</li>
              <li className="text-slate-500">• μ = {res.mu.toFixed(3)}</li>
              <li className="text-slate-500">• As_prov = {res.as_prov.toFixed(1)} cm²</li>
              <li className="text-slate-500">• As_min = {res.as_min.toFixed(1)} cm²</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
