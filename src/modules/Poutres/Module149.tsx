import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { NFilesOuvertures3Inputs, NFilesOuvertures3Output } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: NFilesOuvertures3Inputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  gh: 3000, h: 200, l: 4000,
  net: 4, nu: 3,
  i1: 0.001, i2: 0.001, i3: 0.001,
  s1: 0.1, s2: 0.1, s3: 0.1,
  e: 200, p1: 100, e1: 50,
  p2: 100, e2: 50, p3: 100, e3: 50,
};

export default function Module149() {
  const [inp, setInp] = useState<NFilesOuvertures3Inputs>(DEFAULT);
  const [res, setRes] = useState<NFilesOuvertures3Output | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof NFilesOuvertures3Inputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<NFilesOuvertures3Output>('calculate_n_files_ouvertures_3_149', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">149 N Files Ouvertures <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Voile 3 refends — Henry Thonier</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="GH" unit="mm" value={inp.gh} onChange={S('gh')} min={500} max={20000} step={100} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={50} max={500} step={10} />
          <NumField label="L" unit="mm" value={inp.l} onChange={S('l')} min={500} max={20000} step={100} />
          <NumField label="Net" unit="-" value={inp.net} onChange={S('net')} min={1} max={20} step={1} />
          <NumField label="Nu" unit="-" value={inp.nu} onChange={S('nu')} min={1} max={10} step={1} />
          <NumField label="I1" unit="m⁴" value={inp.i1} onChange={S('i1')} min={0.0001} max={0.1} step={0.001} />
          <NumField label="I2" unit="m⁴" value={inp.i2} onChange={S('i2')} min={0.0001} max={0.1} step={0.001} />
          <NumField label="I3" unit="m⁴" value={inp.i3} onChange={S('i3')} min={0.0001} max={0.1} step={0.001} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="P1" unit="kN" value={inp.p1} onChange={S('p1')} min={0} max={1000} step={10} />
          <NumField label="P2" unit="kN" value={inp.p2} onChange={S('p2')} min={0} max={1000} step={10} />
          <NumField label="P3" unit="kN" value={inp.p3} onChange={S('p3')} min={0} max={1000} step={10} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>s_Rd = <b>{res.s_rd.toFixed(2)}</b> MPa</div>
              <div>M1_max = <b>{res.m1_max.toFixed(2)}</b> kN·m | M2_max = <b>{res.m2_max.toFixed(2)}</b> kN·m</div>
              <div>N1_max = <b>{res.n1_max.toFixed(2)}</b> kN | N2_max = <b>{res.n2_max.toFixed(2)}</b> kN</div>
              <div>V_max = <b>{res.v_max.toFixed(2)}</b> kN</div>
              <div>f_max = <b>{res.f_max.toFixed(3)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupe — 3 Refends</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const s = 0.08;
              const ghPx = (inp.gh / 1000) * s * 1000;
              const hPx = (inp.h / 1000) * s * 1000;

              return (
                <g>
                  <rect x={ox} y={oy} width={w} height={hPx * 3 + 40} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <rect x={ox} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />
                  <rect x={ox + w / 2 - hPx / 2} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />
                  <rect x={ox + w - hPx} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />

                  <text x={ox + w / 2} y={oy + hPx * 3 + 50} textAnchor="middle" fontSize={7} fill="#64748b">
                    3 refends | GH={(inp.gh / 1000).toFixed(1)}m | L={(inp.l / 1000).toFixed(1)}m
                  </text>
                  <text x={ox + w / 2} y={oy + hPx * 3 + 60} textAnchor="middle" fontSize={7} fill="#64748b">
                    V_max={res.v_max.toFixed(2)}kN | f_max={res.f_max.toFixed(3)}mm
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
              <li className={res.ratio_s <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_s <= 1.0 ? '✓' : '✗'} V/V_Rd = {(res.ratio_s * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_f <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_f <= 1.0 ? '✓' : '✗'} f/f_lim = {(res.ratio_f * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• s_Rd = {res.s_rd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• M1_max = {res.m1_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• M2_max = {res.m2_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• M3_max = {res.m3_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• N1_max = {res.n1_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• V_max = {res.v_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• f_max = {res.f_max.toFixed(3)} mm</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
