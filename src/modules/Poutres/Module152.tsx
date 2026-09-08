import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import NumField from '../../components/NumField';

interface InputState {
  fck: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  t1: number;
  too: number;
  cement_class: string;
  rh: number;
  ecm: number;
  pl: number;
  m: number;
  n0: number;
  aci: number;
  acs: number;
  d: number;
  dp: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  b: 300.0,
  h: 500.0,
  bw: 200.0,
  hf: 0.0,
  t1: 365.0,
  too: 28.0,
  cement_class: '42,5',
  rh: 60.0,
  ecm: 33.0,
  pl: 1400.0,
  m: 100.0,
  n0: 0.0,
  aci: 300.0,
  acs: 600.0,
  d: 440.0,
  dp: 60.0,
};

export default function Module152() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke('calculate_fleche_recom_prof_152', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const beamH = inp.h;
  const beamB = inp.b;
  const hfPx = Math.max(0, Math.min(40, (inp.hf / beamH) * 120));
  const bwPx = Math.max(20, (inp.bw / beamB) * 100);
  const hPx = 120;

  const xNaPx = res ? Math.max(0, Math.min(hPx, (res.x_na / beamH) * hPx)) : hPx / 2;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* --- Input Panel --- */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            152 Flèche recommandée prof
            <span className="font-mono text-[11px] text-emerald-500"> RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'apres EGF N=152 (c) Henry Thonier
          </p>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Section
        </div>
        <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={10} max={80} step={1} />
        <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={10} />
        <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
        <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={0} max={2000} step={10} />
        <NumField label="hf" unit="mm" value={inp.hf} onChange={S('hf')} min={0} max={500} step={10} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Matériau
        </div>
        <div className="text-[10px] text-slate-500 mb-1">Ciment</div>
        <div className="flex gap-1">
          {['R', '32,5', '42,5', '42,5N', '52,5'].map((c) => (
            <button
              key={c}
              onClick={() => setInp((p) => ({ ...p, cement_class: c }))}
              className={`px-2 py-1 rounded text-[10px] border transition ${
                inp.cement_class === c
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <NumField label="RH" unit="%" value={inp.rh} onChange={S('rh')} min={20} max={100} step={5} />
        <NumField label="Ecm" unit="GPa" value={inp.ecm} onChange={S('ecm')} min={10} max={50} step={0.5} />
        <NumField label="Périmètre pl" unit="mm" value={inp.pl} onChange={S('pl')} min={0} max={50000} step={100} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Maturité
        </div>
        <NumField label="t1" unit="j" value={inp.t1} onChange={S('t1')} min={1} max={99999} step={1} />
        <NumField label="too" unit="j" value={inp.too} onChange={S('too')} min={1} max={9999} step={1} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Sollicitation
        </div>
        <NumField label="M" unit="kN.m" value={inp.m} onChange={S('m')} min={0} max={10000} step={5} />
        <NumField label="N0" unit="kN" value={inp.n0} onChange={S('n0')} min={-5000} max={5000} step={10} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Armatures
        </div>
        <NumField label="As com" unit="mm2" value={inp.aci} onChange={S('aci')} min={0} max={5000} step={50} />
        <NumField label="As ten" unit="mm2" value={inp.acs} onChange={S('acs')} min={0} max={5000} step={50} />
        <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />
        <NumField label="d'" unit="mm" value={inp.dp} onChange={S('dp')} min={20} max={500} step={5} />

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
                <div className="text-slate-500">Ec_eff</div>
                <div className="font-bold">{res.ec_eff.toFixed(1)} GPa</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">neq</div>
                <div className="font-bold">{res.neq.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">phi (fluage)</div>
                <div className="font-bold">{res.phi.toFixed(3)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">bh</div>
                <div className="font-bold">{res.bh.toFixed(0)} mm</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">x_NA</div>
                <div className="font-bold">{res.x_na.toFixed(2)} mm</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">I_cr</div>
                <div className="font-bold">{res.i_cr.toFixed(0)} mm4</div>
              </div>
            </div>
          )}
        </div>

        {/* --- SVG cross-section diagram --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section fissuree</h2>
          <svg viewBox="0 0 300 160" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {/* T-beam cross section */}
            {hfPx > 0 ? (
              <>
                {/* Flange */}
                <rect x={150 - 50} y={10} width={100} height={hfPx} fill="#60a5fa" opacity={0.3} stroke="#3b82f6" strokeWidth={1} />
                {/* Web */}
                <rect x={150 - bwPx / 2} y={10 + hfPx} width={bwPx} height={hPx - hfPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
              </>
            ) : (
              <rect x={150 - 50} y={10} width={100} height={hPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
            )}

            {/* Neutral axis */}
            {res && res.x_na > 0 && res.x_na < beamH && (
              <>
                <line x1={80} y1={10 + xNaPx} x2={220} y2={10 + xNaPx} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                <text x={225} y={14 + xNaPx} fontSize={10} fill="#ef4444" fontWeight="bold">
                  x={res.x_na.toFixed(1)}
                </text>
              </>
            )}

            {/* Compression steel */}
            {inp.aci > 0 && (
              <>
                <circle cx={150 - bwPx / 4} cy={25} r={4} fill="#f59e0b" />
                <circle cx={150 + bwPx / 4} cy={25} r={4} fill="#f59e0b" />
                <text x={150 + bwPx / 2 + 10} y={28} fontSize={8} fill="#f59e0b">As com</text>
              </>
            )}

            {/* Tension steel */}
            {inp.acs > 0 && (
              <>
                <circle cx={150 - bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
                <circle cx={150 + bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
                <text x={150 + bwPx / 2 + 10} y={10 + hPx - 12} fontSize={8} fill="#22c55e">As ten</text>
              </>
            )}

            {/* Dimensions */}
            <text x={150} y={10 + hPx + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">
              b={inp.b}
            </text>
            <text x={20} y={10 + hPx / 2} textAnchor="middle" fontSize={9} fill="#94a3b8" transform={`rotate(-90 20 ${10 + hPx / 2})`}>
              h={inp.h}
            </text>
          </svg>
        </div>

        {/* --- Creep diagram --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Fluage vs. Temps</h2>
          <svg viewBox="0 0 300 120" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {/* Axes */}
            <line x1={40} y1={100} x2={280} y2={100} stroke="#475569" strokeWidth={1} />
            <line x1={40} y1={10} x2={40} y2={100} stroke="#475569" strokeWidth={1} />
            <text x={160} y={115} textAnchor="middle" fontSize={8} fill="#94a3b8">Temps (jours)</text>
            <text x={12} y={55} textAnchor="middle" fontSize={8} fill="#94a3b8" transform="rotate(-90 12 55)">phi(t)</text>

            {/* Creep curve */}
            {res && res.phi > 0 && (() => {
              const phiMax = res.phi * 1.5;
              const bhVal = res.bh;
              const too = inp.too;
              const points: string[] = [];
              for (let t = 1; t <= 365; t += 5) {
                const xPx = 40 + (t / 365) * 240;
                const bctto = t <= too ? 0.0 : (t - too) / (bhVal + t - too);
                const phiT = res.phi * Math.max(0, bctto);
                const yPx = 100 - (phiT / phiMax) * 90;
                points.push(`${xPx},${yPx}`);
              }
              return (
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              );
            })()}

            {/* Final phi marker */}
            {res && res.phi > 0 && (() => {
              const phiMax = res.phi * 1.5;
              const yPx = 100 - (res.phi / phiMax) * 90;
              return (
                <>
                  <circle cx={280} cy={yPx} r={3} fill="#ef4444" />
                  <text x={285} y={yPx + 3} fontSize={8} fill="#ef4444">
                    phi={res.phi.toFixed(2)}
                  </text>
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* --- AI Diagnostics --- */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA -- Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing...</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className="text-slate-500">
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
