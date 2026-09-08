import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { CentreTorsionGeneralInputs, CentreTorsionGeneralOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: CentreTorsionGeneralInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  n_voiles: 3, h: 200, l_totale: 6000,
  e1: 200, h1: 3000, e2: 200, h2: 3000,
  e3: 200, h3: 3000, l12: 3000, l23: 3000,
  vx: 100, vy: 50, mt: 200,
};

export default function Module151() {
  const [inp, setInp] = useState<CentreTorsionGeneralInputs>(DEFAULT);
  const [res, setRes] = useState<CentreTorsionGeneralOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof CentreTorsionGeneralInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<CentreTorsionGeneralOutput>('calculate_centre_torsion_general_151', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">151 Centre Torsion <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Centre de torsion général — Henry Thonier</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Nb voiles" unit="-" value={inp.n_voiles} onChange={S('n_voiles')} min={1} max={5} step={1} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={50} max={500} step={10} />
          <NumField label="L_tot" unit="mm" value={inp.l_totale} onChange={S('l_totale')} min={500} max={20000} step={100} />
          <NumField label="e1" unit="mm" value={inp.e1} onChange={S('e1')} min={50} max={500} step={10} />
          <NumField label="h1" unit="mm" value={inp.h1} onChange={S('h1')} min={100} max={10000} step={100} />
          <NumField label="e2" unit="mm" value={inp.e2} onChange={S('e2')} min={50} max={500} step={10} />
          <NumField label="h2" unit="mm" value={inp.h2} onChange={S('h2')} min={100} max={10000} step={100} />
          <NumField label="L12" unit="mm" value={inp.l12} onChange={S('l12')} min={500} max={20000} step={100} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Vx" unit="kN" value={inp.vx} onChange={S('vx')} min={0} max={10000} step={10} />
          <NumField label="Vy" unit="kN" value={inp.vy} onChange={S('vy')} min={0} max={10000} step={10} />
          <NumField label="Mt" unit="kN·m" value={inp.mt} onChange={S('mt')} min={0} max={50000} step={100} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>IGx = <b>{res.igx.toFixed(4)}</b> m⁴ | IGy = <b>{res.igy.toFixed(4)}</b> m⁴</div>
              <div>α = <b>{res.alpha.toFixed(3)}</b> rad</div>
              <div>xG = <b>{res.xg.toFixed(3)}</b> m | yG = <b>{res.yg.toFixed(3)}</b> m</div>
              <div>xC = <b>{res.xc.toFixed(3)}</b> m | yC = <b>{res.yc.toFixed(3)}</b> m</div>
              <div>ZA = <b>{res.za.toFixed(3)}</b> m²</div>
              <div>σ_max = <b>{res.sigma_max.toFixed(2)}</b> MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan — Centre de torsion</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const cx = ox + w / 2;
              const cy = oy + h / 2;
              const s = 0.08;

              return (
                <g>
                  <rect x={ox} y={oy} width={w} height={h} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <line x1={cx} y1={oy} x2={cx} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />
                  <line x1={ox} y1={cy} x2={ox + w} y2={cy} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />

                  <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
                  <circle cx={cx} cy={cy} r={2} fill="#ef4444" />

                  <text x={cx + 8} y={cy - 5} fontSize={7} fill="#2563eb">G ({res.xg.toFixed(2)}, {res.yg.toFixed(2)})</text>
                  <text x={cx + 8} y={cy + 5} fontSize={7} fill="#ef4444">C ({res.xc.toFixed(2)}, {res.yc.toFixed(2)})</text>

                  <text x={ox + 5} y={oy + 15} fontSize={7} fill="#64748b">IGx={res.igx.toFixed(4)} m⁴</text>
                  <text x={ox + 5} y={oy + 25} fontSize={7} fill="#64748b">IGy={res.igy.toFixed(4)} m⁴</text>
                  <text x={ox + 5} y={oy + 35} fontSize={7} fill="#64748b">α={res.alpha.toFixed(3)} rad</text>
                  <text x={ox + w / 2} y={oy + h + 12} textAnchor="middle" fontSize={8} fill="#64748b">
                    ZA={res.za.toFixed(3)}m² | σ_max={res.sigma_max.toFixed(2)}MPa
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
                {res.ratio <= 1.0 ? '✓' : '✗'} σ_max/f_ctd = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• IGx = {res.igx.toFixed(4)} m⁴</li>
              <li className="text-slate-500">• IGy = {res.igy.toFixed(4)} m⁴</li>
              <li className="text-slate-500">• IGxy = {res.igxy.toFixed(4)} m⁴</li>
              <li className="text-slate-500">• α = {res.alpha.toFixed(3)} rad</li>
              <li className="text-slate-500">• xG = {res.xg.toFixed(3)} m</li>
              <li className="text-slate-500">• yG = {res.yg.toFixed(3)} m</li>
              <li className="text-slate-500">• σ_max = {res.sigma_max.toFixed(2)} MPa</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
