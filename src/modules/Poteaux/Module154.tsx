import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import NumField from '../../components/NumField';

interface InputState {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  h: number;
  d: number;
  dp: number;
  aci: number;
  acs: number;
  ned: number;
  med: number;
  ec2: number;
  nex: number;
  n_layers: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  fyk: 500.0,
  gc: 1.5,
  gs: 1.15,
  b: 300.0,
  h: 500.0,
  d: 440.0,
  dp: 60.0,
  aci: 300.0,
  acs: 600.0,
  ned: 500.0,
  med: 100.0,
  ec2: 0.002,
  nex: 2.0,
  n_layers: 6,
};

export default function Module154() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke('calculate_non_fragilite_section_qq_154', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const beamH = inp.h;
  const beamB = inp.b;
  const hPx = 140;
  const bwPx = Math.max(30, (inp.b / 600) * 120);

  const xNaPx = res ? Math.max(0, Math.min(hPx, (res.x_na / beamH) * hPx)) : hPx / 2;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* --- Input Panel --- */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            154 Non fragilite section QQ
            <span className="font-mono text-[11px] text-emerald-500"> RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'apres EGF N=154 (c) Henry Thonier
          </p>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Materiau
        </div>
        <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={10} max={80} step={1} />
        <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
        <NumField label="gc" unit="-" value={inp.gc} onChange={S('gc')} min={1.0} max={2.0} step={0.05} />
        <NumField label="gs" unit="-" value={inp.gs} onChange={S('gs')} min={1.0} max={2.0} step={0.05} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Section
        </div>
        <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={10} />
        <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
        <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />
        <NumField label="d'" unit="mm" value={inp.dp} onChange={S('dp')} min={20} max={500} step={5} />
        <NumField label="As com" unit="mm2" value={inp.aci} onChange={S('aci')} min={0} max={5000} step={50} />
        <NumField label="As ten" unit="mm2" value={inp.acs} onChange={S('acs')} min={0} max={5000} step={50} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Sollicitation
        </div>
        <NumField label="NEd" unit="kN" value={inp.ned} onChange={S('ned')} min={0} max={10000} step={50} />
        <NumField label="MEd" unit="kN.m" value={inp.med} onChange={S('med')} min={0} max={1000} step={5} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Integration
        </div>
        <NumField label="ec2" unit="-" value={inp.ec2} onChange={S('ec2')} min={0.001} max={0.004} step={0.0001} />
        <NumField label="nex" unit="-" value={inp.nex} onChange={S('nex')} min={1.0} max={3.0} step={0.1} />
        <NumField label="Couches" unit="-" value={inp.n_layers} onChange={S('n_layers')} min={2} max={20} step={1} />

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
      </div>

      {/* --- Charts / Results --- */}
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Resultats</h2>
          {res && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">N_Rd</div>
                <div className="font-bold">{res.n_rd.toFixed(1)} kN</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">M_Rd</div>
                <div className="font-bold">{res.m_rd.toFixed(1)} kN.m</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">x/d</div>
                <div className={`font-bold ${res.xd_ratio > res.xd_limit ? 'text-red-500' : 'text-green-500'}`}>
                  {res.xd_ratio.toFixed(3)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">x/d limit</div>
                <div className="font-bold">{res.xd_limit.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">eps_s</div>
                <div className={`font-bold ${res.is_ductile ? 'text-green-500' : 'text-red-500'}`}>
                  {res.eps_s.toFixed(5)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">eps_y</div>
                <div className="font-bold">{res.eps_y.toFixed(5)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2 col-span-2">
                <div className="text-slate-500">Utilisation</div>
                <div className={`font-bold ${res.utilisation > 1.0 ? 'text-red-500' : 'text-green-500'}`}>
                  {(res.utilisation * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- SVG cross section with strain diagram --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section + Diagramme de deformations</h2>
          <svg viewBox="0 0 300 180" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {/* Section */}
            <rect x={150 - bwPx / 2} y={10} width={bwPx} height={hPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />

            {/* Neutral axis */}
            {res && res.x_na > 0 && res.x_na < beamH && (
              <>
                <line x1={70} y1={10 + xNaPx} x2={150 - bwPx / 2 - 5} y2={10 + xNaPx} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                <text x={55} y={14 + xNaPx} fontSize={9} fill="#ef4444" fontWeight="bold">
                  x={res.x_na.toFixed(0)}
                </text>
              </>
            )}

            {/* Compression steel */}
            {inp.aci > 0 && (
              <>
                <circle cx={150 - bwPx / 4} cy={25} r={4} fill="#f59e0b" />
                <circle cx={150 + bwPx / 4} cy={25} r={4} fill="#f59e0b" />
              </>
            )}

            {/* Tension steel */}
            {inp.acs > 0 && (
              <>
                <circle cx={150 - bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
                <circle cx={150 + bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
              </>
            )}

            {/* Strain diagram (right side) */}
            {res && (
              <>
                <line x1={220} y1={10} x2={220} y2={10 + hPx} stroke="#475569" strokeWidth={1} />
                {/* Strain line */}
                <line
                  x1={220 + (res.eps_s < 0 ? 30 : -30)}
                  y1={10 + hPx}
                  x2={220 + 30}
                  y2={10}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
                <text x={225 + 30} y={15} fontSize={8} fill="#8b5cf6">eh</text>
                <text x={225 + (res.eps_s < 0 ? -35 : 5)} y={10 + hPx + 4} fontSize={8} fill="#8b5cf6">eb</text>

                {/* Yield strain marker */}
                {res.eps_y > 0 && (
                  <>
                    <line
                      x1={220 + 30}
                      y1={10 + (1 - res.eps_y / Math.max(res.eps_s.abs(), res.eps_y)) * hPx}
                      x2={255}
                      y2={10 + (1 - res.eps_y / Math.max(res.eps_s.abs(), res.eps_y)) * hPx}
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  </>
                )}
              </>
            )}

            <text x={150} y={10 + hPx + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">
              b={inp.b}
            </text>
          </svg>
        </div>

        {/* --- Utilisation bar --- */}
        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <h2 className="text-sm font-bold mb-2">Taux d'utilisation</h2>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  res.utilisation > 1.0 ? 'bg-red-500' : res.utilisation > 0.8 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, res.utilisation * 100)}%` }}
              />
            </div>
            <div className="text-xs mt-1 font-mono text-slate-500">
              {(res.utilisation * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* --- AI Diagnostics --- */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA -- Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing...</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className={`font-bold ${res.xd_ratio > res.xd_limit ? 'text-red-500' : 'text-green-500'}`}>
              -- verdict: {res.verdict}
            </li>
            {res.diag && res.diag.map((d: string, i: number) => (
              <li key={i} className="font-mono text-slate-600 dark:text-slate-400">
                {d}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
