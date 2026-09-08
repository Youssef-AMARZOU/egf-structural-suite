import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Ec1VentInputs, Ec1VentOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: Ec1VentInputs = {
  vb0: 27, rho: 1.25, z0: 1.0, zt: 200, lt: 300,
  cdir: 1.0, cseason: 1.0, c0z: 1.0,
  z: 10, ze: 10, zs: 6,
  b: 15, d: 10, h: 30,
  n1: 1.0, masseq: 100, phi: 0.5,
  terrain_cat: 3,
};

export default function Module141() {
  const [inp, setInp] = useState<Ec1VentInputs>(DEFAULT);
  const [res, setRes] = useState<Ec1VentOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof Ec1VentInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<Ec1VentOutput>('calculate_ec1_vent_141', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">141 EC1 Vent <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Eurocode 1 — Actions vent — EN 1991-1-4</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Vent de base</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="vb,0" unit="m/s" value={inp.vb0} onChange={S('vb0')} min={10} max={50} step={1} />
          <NumField label="ρ" unit="kg/m³" value={inp.rho} onChange={S('rho')} min={1} max={1.5} step={0.01} />
          <NumField label="z0" unit="m" value={inp.z0} onChange={S('z0')} min={0.001} max={5} step={0.01} />
          <NumField label="zt" unit="m" value={inp.zt} onChange={S('zt')} min={1} max={500} step={10} />
          <NumField label="Lt" unit="m" value={inp.lt} onChange={S('lt')} min={10} max={1000} step={10} />
          <NumField label="cdir" unit="-" value={inp.cdir} onChange={S('cdir')} min={0.5} max={2} step={0.01} />
          <NumField label="cseason" unit="-" value={inp.cseason} onChange={S('cseason')} min={0.5} max={2} step={0.01} />
          <NumField label="c0,z" unit="-" value={inp.c0z} onChange={S('c0z')} min={0.5} max={2} step={0.01} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="b" unit="m" value={inp.b} onChange={S('b')} min={1} max={100} step={0.5} />
          <NumField label="d" unit="m" value={inp.d} onChange={S('d')} min={1} max={100} step={0.5} />
          <NumField label="h" unit="m" value={inp.h} onChange={S('h')} min={1} max={200} step={0.5} />
          <NumField label="z" unit="m" value={inp.z} onChange={S('z')} min={0.1} max={200} step={0.5} />
          <NumField label="ze" unit="m" value={inp.ze} onChange={S('ze')} min={0.1} max={200} step={0.5} />
          <NumField label="zs" unit="m" value={inp.zs} onChange={S('zs')} min={0.1} max={200} step={0.5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dynamique</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="n1" unit="Hz" value={inp.n1} onChange={S('n1')} min={0.1} max={10} step={0.1} />
          <NumField label="masse" unit="t/m" value={inp.masseq} onChange={S('masseq')} min={10} max={1000} step={10} />
          <NumField label="φ" unit="-" value={inp.phi} onChange={S('phi')} min={0.01} max={1} step={0.01} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>vm,z = <b>{res.vmz.toFixed(1)}</b> m/s | vm,ze = <b>{res.vmze.toFixed(1)}</b> m/s</div>
              <div>cr,z = <b>{res.crz.toFixed(2)}</b> | cr,ze = <b>{res.crze.toFixed(2)}</b></div>
              <div>Iv,z = <b>{res.ivz.toFixed(3)}</b> | Iv,ze = <b>{res.ivze.toFixed(3)}</b></div>
              <div>q0,z = <b>{res.q0z.toFixed(1)}</b> N/m² | q0,ze = <b>{res.q0ze.toFixed(1)}</b> N/m²</div>
              <div>Cf = <b>{res.cf.toFixed(2)}</b> | Cscd = <b>{res.cscd.toFixed(2)}</b></div>
              <div>fw = <b>{res.fw.toFixed(2)}</b> kN/m²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Profil de vitesse du vent</h2>
          <svg viewBox="0 0 400 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 320, h = 160;
              const maxV = Math.max(res.vmz, res.vmze, res.vmzs, 1);
              const sc = w / maxV;
              const maxZ = inp.h;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />

                  {[0, 0.25, 0.5, 0.75, 1.0].map((t) => (
                    <g key={t}>
                      <line x1={ox} y1={oy + h - t * h} x2={ox + w} y2={oy + h - t * h} stroke="#94a3b8" strokeWidth={0.3} />
                      <text x={ox - 5} y={oy + h - t * h + 3} textAnchor="end" fontSize={5} fill="#64748b">
                        {(t * maxZ).toFixed(0)}m
                      </text>
                    </g>
                  ))}

                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => {
                      const z = (i / 19) * maxZ;
                      const v = res.vmz * Math.pow(z / inp.z, 0.14);
                      return `${ox + v * sc},${oy + h - (z / maxZ) * h}`;
                    }).join(' ')}
                    fill="none" stroke="#2563eb" strokeWidth={1.5}
                  />

                  <circle cx={ox + res.vmzs * sc} cy={oy + h - (inp.zs / maxZ) * h} r={3} fill="#ef4444" />
                  <circle cx={ox + res.vmze * sc} cy={oy + h - (inp.ze / maxZ) * h} r={3} fill="#22c55e" />
                  <circle cx={ox + res.vmz * sc} cy={oy + h - (inp.z / maxZ) * h} r={3} fill="#2563eb" />

                  <text x={ox + res.vmz * sc + 5} y={oy + h - (inp.z / maxZ) * h - 3} fontSize={5} fill="#2563eb">vm,z={res.vmz.toFixed(1)}</text>
                  <text x={ox + res.vmze * sc + 5} y={oy + h - (inp.ze / maxZ) * h - 3} fontSize={5} fill="#22c55e">vm,ze={res.vmze.toFixed(1)}</text>
                  <text x={ox + res.vmzs * sc + 5} y={oy + h - (inp.zs / maxZ) * h - 3} fontSize={5} fill="#ef4444">vm,zs={res.vmzs.toFixed(1)}</text>

                  <text x={ox + w / 2} y={oy + h + 14} textAnchor="middle" fontSize={5} fill="#64748b">
                    fw={res.fw.toFixed(2)}kN/m² | Cf={res.cf.toFixed(2)} | Cscd={res.cscd.toFixed(2)}
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
              <li className={res.fw <= 1.0 ? 'text-green-600' : 'text-yellow-600'}>
                {res.fw <= 1.0 ? '✓' : '!'} fw = {res.fw.toFixed(2)} kN/m²
              </li>
              <li className="text-slate-500">• vm,z = {res.vmz.toFixed(1)} m/s</li>
              <li className="text-slate-500">• cr,z = {res.crz.toFixed(2)}</li>
              <li className="text-slate-500">• Iv,z = {res.ivz.toFixed(3)}</li>
              <li className="text-slate-500">• q0,z = {res.q0z.toFixed(1)} N/m²</li>
              <li className="text-slate-500">• Cf = {res.cf.toFixed(2)}</li>
              <li className="text-slate-500">• Cscd = {res.cscd.toFixed(2)}</li>
              <li className="text-slate-500">• kn = {res.kn.toFixed(2)}</li>
              <li className="text-slate-500">• R² = {res.r2.toFixed(2)}</li>
              <li className="text-slate-500">• ν = {res.nu.toFixed(2)} Hz</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
