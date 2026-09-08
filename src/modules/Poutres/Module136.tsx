import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AncrageTsInputs, AncrageTsOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: AncrageTsInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  phi: 8, pitch: 200, phi_transverse: 6,
  sigma_sd: 435, bond_condition: 'bon',
  n_transverse: 4, alpha_ct: 1.0,
};

export default function Module136() {
  const [inp, setInp] = useState<AncrageTsInputs>(DEFAULT);
  const [res, setRes] = useState<AncrageTsOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof AncrageTsInputs) => (v: number | string) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<AncrageTsOutput>('calculate_ancrage_ts_136', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">136 Ancrage TS <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Ancrage & recouvrement treillis soudés — EC2 §8.4.3</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
          <NumField label="αct" unit="-" value={inp.alpha_ct} onChange={S('alpha_ct')} min={0.5} max={1.5} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Treillis</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={4} max={16} step={1} />
          <NumField label="pas s" unit="mm" value={inp.pitch} onChange={S('pitch')} min={50} max={400} step={10} />
          <NumField label="φt transv." unit="mm" value={inp.phi_transverse} onChange={S('phi_transverse')} min={4} max={12} step={1} />
          <NumField label="Nb bras trans." unit="-" value={inp.n_transverse} onChange={S('n_transverse')} min={0} max={10} step={1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="σsd" unit="MPa" value={inp.sigma_sd} onChange={S('sigma_sd')} min={0} max={600} step={5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Conditions</div>
        <div className="flex gap-2">
          <button
            className={`flex-1 text-xs py-1.5 rounded-lg border transition ${inp.bond_condition === 'bon' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}
            onClick={() => setInp(p => ({ ...p, bond_condition: 'bon' }))}
          >Bon</button>
          <button
            className={`flex-1 text-xs py-1.5 rounded-lg border transition ${inp.bond_condition === 'mauvais' ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}
            onClick={() => setInp(p => ({ ...p, bond_condition: 'mauvais' }))}
          >Mauvais</button>
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fctd = <b>{res.fctd.toFixed(2)}</b> MPa | fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>lb,rqd = <b>{res.lb_rqd.toFixed(1)}</b> mm</div>
              <div>α1={res.alpha_1.toFixed(2)} α2={res.alpha_2.toFixed(2)} α3={res.alpha_3.toFixed(2)} α4={res.alpha_4.toFixed(2)} α5={res.alpha_5.toFixed(2)}</div>
              <div>lbd = <b>{res.lbd.toFixed(1)}</b> mm</div>
              <div>l0 = α6 × lbd = <b>{res.l0.toFixed(1)}</b> mm</div>
              <div>l0,min = max(0.3α6·lb,rqd, 15φ, 200) = <b>{res.l0_min.toFixed(1)}</b> mm</div>
              <hr className="border-slate-200 dark:border-white/10 my-1" />
              <div className="text-sm">l0,final = <b className="text-emerald-500">{res.l0_final.toFixed(0)} mm</b></div>
              <div>Bras transversaux requis: <b>{res.n_welded_min}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Schéma — Treillis soudés</h2>
          <svg viewBox="0 0 500 220" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 30, w = 420, h = 160;
              const scale = w / (res.l0_final * 1.8);
              const meshY = oy + h / 2;
              const lapLen = res.l0_final * scale;
              const pitchPx = inp.pitch * scale;

              return (
                <g>
                  <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8">
                      <path d="M0,8 L8,0" stroke="#94a3b8" strokeWidth="0.3" />
                    </pattern>
                  </defs>

                  <rect x={ox} y={oy} width={w} height={h} fill="url(#hatch)" rx={4} opacity={0.15} />

                  {Array.from({ length: Math.ceil(res.l0_final / inp.pitch) + 5 }, (_, i) => {
                    const x = ox + i * pitchPx;
                    return (
                      <g key={i}>
                        <line x1={x} y1={oy + 10} x2={x} y2={oy + h - 10} stroke="#2563eb" strokeWidth={1.5} />
                        {Array.from({ length: Math.ceil(h / 20) - 1 }, (_, j) => {
                          const y = oy + 15 + j * 20;
                          const inLap = x >= ox && x <= ox + lapLen;
                          return (
                            <circle
                              key={j}
                              cx={x}
                              cy={y}
                              r={inLap ? 3 : 2}
                              fill={inLap ? '#22c55e' : '#94a3b8'}
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  <line x1={ox} y1={meshY} x2={ox + w} y2={meshY} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="2,2" />

                  <g>
                    <line x1={ox} y1={oy + h + 5} x2={ox + lapLen} y2={oy + h + 5} stroke="#22c55e" strokeWidth={2} markerEnd="url(#arrowG)" markerStart="url(#arrowG)" />
                    <text x={ox + lapLen / 2} y={oy + h + 18} textAnchor="middle" fontSize={8} fill="#22c55e" fontWeight="bold">
                      l₀ = {res.l0_final.toFixed(0)} mm
                    </text>
                  </g>

                  <g>
                    <line x1={ox} y1={oy - 10} x2={ox + res.lbd * scale} y2={oy - 10} stroke="#2563eb" strokeWidth={1.5} />
                    <text x={ox + res.lbd * scale / 2} y={oy - 14} textAnchor="middle" fontSize={7} fill="#2563eb">
                      lbd = {res.lbd.toFixed(0)} mm
                    </text>
                  </g>

                  <g>
                    <line x1={ox} y1={oy - 22} x2={ox + res.lb_rqd * scale} y2={oy - 22} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2" />
                    <text x={ox + res.lb_rqd * scale / 2} y={oy - 26} textAnchor="middle" fontSize={7} fill="#ef4444">
                      lb,rqd = {res.lb_rqd.toFixed(0)} mm
                    </text>
                  </g>

                  <text x={ox + w / 2} y={oy + h + 30} textAnchor="middle" fontSize={8} fill="#64748b">
                    φ={inp.phi}mm | s={inp.pitch}mm | φt={inp.phi_transverse}mm | {res.n_welded_min} bras transversaux
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
                {res.ratio <= 1.0 ? '✓' : '✗'} σsd/fyd = {(res.ratio * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• fctd = {res.fctd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• fbd = {res.fbd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• lb,rqd = {res.lb_rqd.toFixed(1)} mm</li>
              <li className="text-slate-500">• α1={res.alpha_1.toFixed(2)} α2={res.alpha_2.toFixed(2)} α3={res.alpha_3.toFixed(2)}</li>
              <li className="text-slate-500">• α4={res.alpha_4.toFixed(2)} (treillis soudés)</li>
              <li className="text-slate-500">• lbd = {res.lbd.toFixed(1)} mm</li>
              <li className="text-slate-500">• l0 = {res.l0.toFixed(1)} mm</li>
              <li className="text-slate-500">• l0,min = {res.l0_min.toFixed(1)} mm</li>
              <li className="text-slate-500">• l0,final = {res.l0_final.toFixed(0)} mm</li>
              <li className="text-slate-500">• Bras transversaux: {res.n_welded_min}</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
