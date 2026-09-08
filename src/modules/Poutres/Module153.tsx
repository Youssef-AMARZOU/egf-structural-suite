import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import NumField from '../../components/NumField';

interface InputState {
  fck: number;
  fyk: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  d: number;
  dp: number;
  med: number;
  ned: number;
  hx: number;
  ln: number;
  p_uni: number;
  mg: number;
  md: number;
  neq: number;
  fctm: number;
  n_ite: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  fyk: 500.0,
  b: 300.0,
  h: 500.0,
  bw: 200.0,
  hf: 120.0,
  d: 440.0,
  dp: 60.0,
  med: 150.0,
  ned: 0.0,
  hx: 250.0,
  ln: 6.0,
  p_uni: 20.0,
  mg: 50.0,
  md: 80.0,
  neq: 6.0,
  fctm: 2.6,
  n_ite: 100,
};

export default function Module153() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke('calculate_flexion_as_flech_153', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const beamH = inp.h;
  const beamB = inp.b;
  const hfPx = Math.max(0, Math.min(50, (inp.hf / beamH) * 140));
  const bwPx = Math.max(20, (inp.bw / beamB) * 120);
  const hPx = 140;
  const xNaPx = res ? Math.max(0, Math.min(hPx, (res.x_na / beamH) * hPx)) : hPx / 2;

  // Moment envelope SVG points
  const envPoints = (() => {
    const pts: string[] = [];
    const ln = inp.ln;
    const p = inp.p_uni;
    const mg = inp.mg;
    const md = inp.md;
    const n = 50;
    let mx = 0;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * ln;
      const m = p * x * (ln - x) / 2 + (1 - x / ln) * mg + (x / ln) * md;
      if (m > mx) mx = m;
      const xPx = 30 + (i / n) * 240;
      pts.push(`${xPx},${90}`);
    }
    // actual curve
    const curve: string[] = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * ln;
      const m = p * x * (ln - x) / 2 + (1 - x / ln) * mg + (x / ln) * md;
      const xPx = 30 + (i / n) * 240;
      const yPx = 90 - (mx > 0 ? (m / mx) * 70 : 0);
      curve.push(`${xPx},${yPx}`);
    }
    return { baseline: pts.join(' '), curve: curve.join(' '), mx };
  })();

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* --- Input Panel --- */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            153 Flexion As flech
            <span className="font-mono text-[11px] text-emerald-500"> RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'apres EGF N=153 (c) Henry Thonier
          </p>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Materiau
        </div>
        <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={10} max={80} step={1} />
        <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
        <NumField label="fctm" unit="MPa" value={inp.fctm} onChange={S('fctm')} min={1} max={6} step={0.1} />
        <NumField label="neq" unit="-" value={inp.neq} onChange={S('neq')} min={1} max={15} step={0.5} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Section
        </div>
        <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={10} />
        <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
        <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={0} max={2000} step={10} />
        <NumField label="hf" unit="mm" value={inp.hf} onChange={S('hf')} min={0} max={500} step={10} />
        <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />
        <NumField label="d'" unit="mm" value={inp.dp} onChange={S('dp')} min={20} max={500} step={5} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Sollicitation
        </div>
        <NumField label="MEd" unit="kN.m" value={inp.med} onChange={S('med')} min={0} max={10000} step={5} />
        <NumField label="NEd" unit="kN" value={inp.ned} onChange={S('ned')} min={-5000} max={5000} step={10} />
        <NumField label="hx" unit="mm" value={inp.hx} onChange={S('hx')} min={0} max={2000} step={5} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Enveloppe de moment
        </div>
        <NumField label="Ln" unit="m" value={inp.ln} onChange={S('ln')} min={1} max={30} step={0.5} />
        <NumField label="p uni" unit="kN/m" value={inp.p_uni} onChange={S('p_uni')} min={0} max={200} step={2} />
        <NumField label="Mg" unit="kN.m" value={inp.mg} onChange={S('mg')} min={0} max={500} step={5} />
        <NumField label="Md" unit="kN.m" value={inp.md} onChange={S('md')} min={0} max={500} step={5} />

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
                <div className="text-slate-500">x_NA</div>
                <div className="font-bold">{res.x_na.toFixed(1)} mm</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">As ten</div>
                <div className="font-bold">{res.acs.toFixed(0)} mm2</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">As com</div>
                <div className="font-bold">{res.aci.toFixed(0)} mm2</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">As_min</div>
                <div className="font-bold">{res.ac_min.toFixed(0)} mm2</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">sigma_c</div>
                <div className="font-bold">{res.sigma_c.toFixed(2)} MPa</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">sigma_s</div>
                <div className="font-bold">{res.sigma_s.toFixed(2)} MPa</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2 col-span-2">
                <div className="text-slate-500">Mx_max</div>
                <div className="font-bold">{res.mx_max.toFixed(2)} kN.m</div>
              </div>
            </div>
          )}
        </div>

        {/* --- SVG cross section --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section</h2>
          <svg viewBox="0 0 300 180" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {hfPx > 0 ? (
              <>
                <rect x={150 - 60} y={10} width={120} height={hfPx} fill="#60a5fa" opacity={0.3} stroke="#3b82f6" strokeWidth={1} />
                <rect x={150 - bwPx / 2} y={10 + hfPx} width={bwPx} height={hPx - hfPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
              </>
            ) : (
              <rect x={150 - 60} y={10} width={120} height={hPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
            )}

            {res && res.x_na > 0 && res.x_na < beamH && (
              <>
                <line x1={70} y1={10 + xNaPx} x2={230} y2={10 + xNaPx} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                <text x={235} y={14 + xNaPx} fontSize={10} fill="#ef4444" fontWeight="bold">
                  x={res.x_na.toFixed(1)}
                </text>
              </>
            )}

            {res && res.acs > 0 && (
              <>
                <circle cx={150 - bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
                <circle cx={150 + bwPx / 4} cy={10 + hPx - 15} r={4} fill="#22c55e" />
                <text x={150 + bwPx / 2 + 10} y={10 + hPx - 12} fontSize={8} fill="#22c55e">
                  As={res.acs.toFixed(0)}
                </text>
              </>
            )}

            <text x={150} y={10 + hPx + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">
              b={inp.b} mm
            </text>
            <text x={18} y={10 + hPx / 2} textAnchor="middle" fontSize={9} fill="#94a3b8" transform={`rotate(-90 18 ${10 + hPx / 2})`}>
              h={inp.h} mm
            </text>
          </svg>
        </div>

        {/* --- Moment envelope --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Enveloppe de moment</h2>
          <svg viewBox="0 0 300 110" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <line x1={30} y1={90} x2={270} y2={90} stroke="#475569" strokeWidth={1} />
            <line x1={30} y1={10} x2={30} y2={90} stroke="#475569" strokeWidth={1} />
            <text x={150} y={105} textAnchor="middle" fontSize={8} fill="#94a3b8">x (m)</text>
            <text x={10} y={50} textAnchor="middle" fontSize={8} fill="#94a3b8" transform="rotate(-90 10 50)">M (kN.m)</text>

            <polyline points={envPoints.curve} fill="none" stroke="#3b82f6" strokeWidth={2} />
            <polyline points={envPoints.baseline} fill="none" stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="2 2" />

            {res && envPoints.mx > 0 && (
              <>
                <circle cx={30 + (res.xr_max / inp.ln) * 240} cy={90 - (res.mx_max / envPoints.mx) * 70} r={3} fill="#ef4444" />
                <text x={35 + (res.xr_max / inp.ln) * 240} y={85 - (res.mx_max / envPoints.mx) * 70} fontSize={8} fill="#ef4444">
                  M={res.mx_max.toFixed(1)}
                </text>
              </>
            )}
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
            <li className="font-mono text-slate-600 dark:text-slate-400">
              Mode: {res.mode}
            </li>
            {res.is_balanced && (
              <li className="font-mono text-red-500">
                ATTENTION: Section proche de l'equilibre
              </li>
            )}
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
