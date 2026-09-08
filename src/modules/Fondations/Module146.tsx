import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { PoinconnementTremieInputs, PoinconnementTremieOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: PoinconnementTremieInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  h: 600, a0: 60, c1: 1000, c2: 1000,
  d_pile: 800, d_tremie: 1200,
  ed: 500, n_ed: 500, gamma_f: 1.0,
};

export default function Module146() {
  const [inp, setInp] = useState<PoinconnementTremieInputs>(DEFAULT);
  const [res, setRes] = useState<PoinconnementTremieOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof PoinconnementTremieInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<PoinconnementTremieOutput>('calculate_poinconnement_tremie_146', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">146 Poinç. Trémie <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Poinçonnement semelle sur trémie — EC2 §6.4</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={50} />
          <NumField label="a0" unit="mm" value={inp.a0} onChange={S('a0')} min={10} max={200} step={5} />
          <NumField label="c1" unit="mm" value={inp.c1} onChange={S('c1')} min={100} max={5000} step={50} />
          <NumField label="c2" unit="mm" value={inp.c2} onChange={S('c2')} min={100} max={5000} step={50} />
          <NumField label="D pile" unit="mm" value={inp.d_pile} onChange={S('d_pile')} min={100} max={3000} step={50} />
          <NumField label="D trémie" unit="mm" value={inp.d_tremie} onChange={S('d_tremie')} min={100} max={3000} step={50} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Ed" unit="kN" value={inp.ed} onChange={S('ed')} min={0} max={10000} step={10} />
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={0} max={10000} step={10} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>u0 = <b>{res.u0.toFixed(3)}</b> m | u1 = <b>{res.u1.toFixed(3)}</b> m</div>
              <div>τ_ED = <b>{res.vr_ed.toFixed(2)}</b> MPa</div>
              <div>τ_RD,c = <b>{res.vr_d_c.toFixed(2)}</b> MPa | τ_RD,max = {res.vr_d_max.toFixed(2)} MPa</div>
              <div>α_ED = {res.alpha_ed.toFixed(2)} | ρ_l = {res.rho_l.toFixed(3)}</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupe — Poinçonnement trémie</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const s = 0.08;
              const c1Px = (inp.c1 / 1000) * s * 1000;
              const c2Px = (inp.c2 / 1000) * s * 1000;
              const pilePx = (inp.d_pile / 1000) * s * 1000;
              const tremiePx = (inp.d_tremie / 1000) * s * 1000;

              return (
                <g>
                  <rect x={cx - c1Px / 2 - 40} y={cy - c2Px / 2 - 20} width={c1Px + 80} height={c2Px + 40} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />
                  <circle cx={cx} cy={cy} r={tremiePx / 2} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />
                  <circle cx={cx} cy={cy} r={pilePx / 2} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />

                  <circle cx={cx} cy={cy} r={res.u1 / 2 * 1000 * s} fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="6,3" />

                  <text x={cx + tremiePx / 2 + 5} y={cy - 5} fontSize={7} fill="#94a3b8">D_t={(inp.d_tremie / 1000).toFixed(1)}m</text>
                  <text x={cx + pilePx / 2 + 5} y={cy + 5} fontSize={7} fill="#2563eb">D_p={(inp.d_pile / 1000).toFixed(1)}m</text>
                  <text x={cx} y={oy + h - 5} textAnchor="middle" fontSize={8} fill="#64748b">
                    NEd={inp.n_ed}kN | τ={res.vr_ed.toFixed(2)}MPa | u1={res.u1.toFixed(2)}m
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
              <li className={res.ratio <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio <= 1.0 ? '✓' : '✗'} τ_ED/τ_RD = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• u0 = {res.u0.toFixed(3)} m</li>
              <li className="text-slate-500">• u1 = {res.u1.toFixed(3)} m</li>
              <li className="text-slate-500">• τ_ED = {res.vr_ed.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_RD,c = {res.vr_d_c.toFixed(2)} MPa</li>
              <li className="text-slate-500">• τ_RD,max = {res.vr_d_max.toFixed(2)} MPa</li>
              <li className="text-slate-500">• α_ED = {res.alpha_ed.toFixed(2)}</li>
              <li className="text-slate-500">• ρ_l = {res.rho_l.toFixed(3)}</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
