import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import NumField from '../../components/NumField';

interface InputState {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  bw: number;
  h: number;
  d: number;
  asw: number;
  s: number;
  rho_l: number;
  cot_theta: number;
  ned: number;
  ved: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  fyk: 500.0,
  gc: 1.5,
  gs: 1.15,
  b: 300.0,
  bw: 200.0,
  h: 500.0,
  d: 440.0,
  asw: 100.0,
  s: 200.0,
  rho_l: 0.01,
  cot_theta: 2.5,
  ned: 0.0,
  ved: 80.0,
};

export default function Module155() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke('calculate_eff_tr_compar_ec2_bael_155', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const maxVal = res ? Math.max(res.vrdc, res.vrds, res.vrd_max, res.vrd_bael, inp.ved) * 1.2 : 100;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* --- Input Panel --- */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            155 Eff Tr compar EC2 BAEL
            <span className="font-mono text-[11px] text-emerald-500"> RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'apres EGF N=155 (c) Henry Thonier
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
        <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={100} max={2000} step={10} />
        <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
        <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Armatures tranchantes
        </div>
        <NumField label="Asw" unit="mm2" value={inp.asw} onChange={S('asw')} min={0} max={2000} step={10} />
        <NumField label="s" unit="mm" value={inp.s} onChange={S('s')} min={50} max={500} step={10} />
        <NumField label="rho_l" unit="-" value={inp.rho_l} onChange={S('rho_l')} min={0} max={0.05} step={0.001} />
        <NumField label="cot(theta)" unit="-" value={inp.cot_theta} onChange={S('cot_theta')} min={1.0} max={3.0} step={0.1} />

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
          Sollicitation
        </div>
        <NumField label="VEd" unit="kN" value={inp.ved} onChange={S('ved')} min={0} max={500} step={5} />
        <NumField label="NEd" unit="kN" value={inp.ned} onChange={S('ned')} min={-1000} max={1000} step={10} />

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
                <div className="text-slate-500">VRd,c</div>
                <div className={`font-bold ${res.vrdc > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                  {res.vrdc.toFixed(2)} kN
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">VRd,s</div>
                <div className="font-bold">{res.vrds.toFixed(2)} kN</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">VRd,max</div>
                <div className={`font-bold ${res.vrd_max > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                  {res.vrd_max.toFixed(2)} kN
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">VRd (BAEL)</div>
                <div className={`font-bold ${res.vrd_bael > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                  {res.vrd_bael.toFixed(2)} kN
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">tau_ed</div>
                <div className="font-bold">{res.tau_ed.toFixed(2)} MPa</div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                <div className="text-slate-500">acw</div>
                <div className="font-bold">{res.acw.toFixed(3)}</div>
              </div>
            </div>
          )}
        </div>

        {/* --- SVG comparison bar chart --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Comparaison EC2 vs BAEL</h2>
          <svg viewBox="0 0 300 160" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && maxVal > 0 && (() => {
              const barW = 45;
              const gap = 15;
              const startX = 30;
              const baseY = 130;
              const scale = 100 / maxVal;

              const bars = [
                { label: 'VEd', val: inp.ved, color: '#ef4444' },
                { label: 'VRd,c', val: res.vrdc, color: '#3b82f6' },
                { label: 'VRd,s', val: res.vrds, color: '#8b5cf6' },
                { label: 'VRd,max', val: res.vrd_max, color: '#f59e0b' },
                { label: 'BAEL', val: res.vrd_bael, color: '#22c55e' },
              ];

              return (
                <>
                  {bars.map((bar, i) => {
                    const x = startX + i * (barW + gap);
                    const barH = Math.max(2, bar.val * scale);
                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={baseY - barH}
                          width={barW}
                          height={barH}
                          fill={bar.color}
                          opacity={0.8}
                          rx={2}
                        />
                        <text
                          x={x + barW / 2}
                          y={baseY + 12}
                          textAnchor="middle"
                          fontSize={8}
                          fill="#94a3b8"
                        >
                          {bar.label}
                        </text>
                        <text
                          x={x + barW / 2}
                          y={baseY - barH - 4}
                          textAnchor="middle"
                          fontSize={8}
                          fill={bar.color}
                          fontWeight="bold"
                        >
                          {bar.val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* VEd reference line */}
                  {inp.ved > 0 && (
                    <line
                      x1={20}
                      y1={baseY - inp.ved * scale}
                      x2={280}
                      y2={baseY - inp.ved * scale}
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                    />
                  )}
                </>
              );
            })()}
          </svg>
        </div>

        {/* --- Shear stress diagram --- */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme de cisaillement</h2>
          <svg viewBox="0 0 300 120" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const baseY = 100;
              const startX = 40;
              const endX = 260;
              const scale = 80 / Math.max(res.tau_ed, res.vrdc, 1.0);

              return (
                <>
                  {/* Section outline */}
                  <rect x={startX} y={10} width={endX - startX} height={baseY - 10} fill="#60a5fa" opacity={0.1} stroke="#3b82f6" strokeWidth={1} />

                  {/* VRd,c level */}
                  <line
                    x1={startX}
                    y1={baseY - res.vrdc * scale}
                    x2={endX}
                    y2={baseY - res.vrdc * scale}
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <text x={endX + 5} y={baseY - res.vrdc * scale + 3} fontSize={8} fill="#3b82f6">
                    VRd,c
                  </text>

                  {/* tau_ed level */}
                  <line
                    x1={startX}
                    y1={baseY - res.tau_ed * scale}
                    x2={endX}
                    y2={baseY - res.tau_ed * scale}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                  <text x={endX + 5} y={baseY - res.tau_ed * scale + 3} fontSize={8} fill="#ef4444">
                    tau_ed
                  </text>

                  {/* Labels */}
                  <text x={startX - 5} y={baseY + 12} fontSize={8} fill="#94a3b8" textAnchor="end">0</text>
                  <text x={startX - 5} y={12} fontSize={8} fill="#94a3b8" textAnchor="end">
                    {Math.max(res.tau_ed, res.vrdc).toFixed(1)}
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
            <li className="font-mono text-slate-600 dark:text-slate-400">
              Mode: {res.governing}
            </li>
            <li className="font-mono text-slate-600 dark:text-slate-400">
              EC2 ratio: {res.ratio_ec2.toFixed(3)}
            </li>
            <li className="font-mono text-slate-600 dark:text-slate-400">
              BAEL ratio: {res.ratio_bael.toFixed(3)}
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
