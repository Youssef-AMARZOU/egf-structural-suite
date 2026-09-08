import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Punching103Inputs, Punching103Output } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: Punching103Inputs = {
  a: 400, b: 400, h: 250, d: 210,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  gved: 450, sigma_cp: 2.0, r_col: 0, del: 0,
  position: 2, c3: 200, c4: 200,
};

export default function Module103() {
  const [inp, setInp] = useState<Punching103Inputs>(DEFAULT);
  const [res, setRes] = useState<Punching103Output | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof Punching103Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<Punching103Output>('calculate_punching_103', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const stressData = res ? [
    { name: 'vEd0\n(col)', value: res.ved0, limit: res.vrdco },
    { name: 'vEd\n(u1)', value: res.ved, limit: res.vrdc },
    { name: 'vRd,min', value: res.vrd_min, limit: 0 },
  ] : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            103 Dalle BP6 <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">Poinçonnement dalle — EC2 §6.4</p>
        </div>

        {/* Column */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poteau</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="a" unit="mm" value={inp.a} onChange={S('a')} min={100} max={3000} step={50} />
          <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={3000} step={50} />
        </div>

        {/* Column head */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Chapiteau</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="r" unit="mm" value={inp.r_col} onChange={S('r_col')} min={0} max={2000} step={50} />
          <NumField label="del" unit="mm" value={inp.del} onChange={S('del')} min={0} max={1000} step={50} />
        </div>

        {/* Slab */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={800} step={10} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={80} max={700} step={10} />
        </div>

        {/* Materials */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1.0} max={2.0} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1.0} max={1.5} step={0.05} />
        </div>

        {/* Loading */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="GVEd" unit="kN" value={inp.gved} onChange={S('gved')} min={10} max={5000} step={10} />
          <NumField label="σcp" unit="MPa" value={inp.sigma_cp} onChange={S('sigma_cp')} min={0} max={20} step={0.5} />
        </div>

        {/* Position */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Position</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Type</label>
            <select
              value={inp.position}
              onChange={(e) => setInp((p) => ({ ...p, position: Number(e.target.value) as 1 | 2 }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5"
            >
              <option value={1}>Rive</option>
              <option value={2}>Intérieur</option>
            </select>
          </div>
          <NumField label="c3" unit="mm" value={inp.c3} onChange={S('c3')} min={0} max={5000} step={50} />
          <NumField label="c4" unit="mm" value={inp.c4} onChange={S('c4')} min={0} max={5000} step={50} />
        </div>

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
      </div>

      {/* ─── Charts ─── */}
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Contraintes de cisaillement (MPa)</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
                <Bar dataKey="limit" fill="#dc2626" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Results summary */}
        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <h2 className="text-sm font-bold mb-2">Résultats</h2>
            <div className="font-mono text-xs space-y-1">
              <div>β = <b>{res.beta}</b> | kc = <b>{res.kc}</b></div>
              <div>vRdc = <b>{res.vrdc.toFixed(2)}</b> MPa</div>
              <div>vEd (u₁) = <b>{res.ved.toFixed(2)}</b> MPa → {res.ved <= res.vrdc ? '✓' : '✗'}</div>
              <div>vEd0 (col) = <b>{res.ved0.toFixed(2)}</b> MPa | vRdco = {res.vrdco.toFixed(2)} MPa</div>
              {res.col_head_required && <div className="text-amber-500">⚠ Chapiteau requis</div>}
              {res.asw_req > 0 && (
                <div>Asw = <b>{res.asw_req.toFixed(1)}</b> mm²/m | φ{res.phi} e={res.sr.toFixed(0)}mm</div>
              )}
              <div className="font-bold">{res.verdict}</div>
            </div>
          </div>
        )}

        {/* SVG plan */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan (live SVG)</h2>
          <svg viewBox="0 0 300 300" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 0.3;
              const ox = 150, oy = 150;
              const a = inp.a * sc, b = inp.b * sc;
              const u1_m = res ? res.u1 / 1000.0 : 0;
              const r1 = (u1_m / (2.0 * Math.PI)) * sc * 1000;

              return (
                <g>
                  {/* Slab */}
                  <rect x={20} y={20} width={260} height={260}
                    fill="#e2e8f0" opacity={0.3} rx={4} />
                  {/* Control perimeter */}
                  <rect x={ox - r1 / 2} y={oy - r1 / 2} width={r1} height={r1}
                    fill="none" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 2" rx={4} />
                  {/* Column */}
                  <rect x={ox - a / 2} y={oy - b / 2} width={a} height={b}
                    fill="#1e40af" rx={2} />
                  {/* Column head */}
                  {inp.r_col > 0 && (
                    <circle cx={ox} cy={oy} r={inp.r_col * sc}
                      fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
                  )}
                  {/* Labels */}
                  <text x={ox} y={oy + 3} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                    {inp.a}×{inp.b}
                  </text>
                  <text x={ox} y={oy - a / 2 - 8} textAnchor="middle" fontSize={7} fill="#2563eb">
                    u₁={res?.u1.toFixed(0) ?? '?'}mm
                  </text>
                  {res?.col_head_required && (
                    <text x={ox} y={oy + b / 2 + 14} textAnchor="middle" fontSize={7} fill="#f59e0b">
                      ⚠ Chapiteau requis
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* ─── AI Diagnostics ─── */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing…</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className={res.ved <= res.vrdc ? 'text-green-600' : 'text-red-600'}>
              {res.ved <= res.vrdc
                ? `✓ Cisaillement: vEd=${res.ved.toFixed(2)} ≤ vRdc=${res.vrdc.toFixed(2)} MPa`
                : `✗ Cisaillement: vEd=${res.ved.toFixed(2)} > vRdc=${res.vrdc.toFixed(2)} MPa`}
            </li>
            <li className={res.ved0 <= res.vrdco ? 'text-green-600' : 'text-amber-500'}>
              {res.ved0 <= res.vrdco
                ? `✓ Face poteau: vEd0=${res.ved0.toFixed(2)} ≤ vRdco=${res.vrdco.toFixed(2)}`
                : `⚠ Chapiteau requis: vEd0=${res.ved0.toFixed(2)} > vRdco=${res.vrdco.toFixed(2)}`}
            </li>
            {res.asw_req > 0 && (
              <li className="text-slate-500">
                • Aciers: Asw={res.asw_req.toFixed(1)} mm²/m — φ{res.phi} e={res.sr.toFixed(0)}mm ({res.n_bars} barreaux)
              </li>
            )}
            <li className="text-slate-500">
              • Poteau: {inp.a}×{inp.b}mm, h={inp.h}mm, d={inp.d}mm
            </li>
            <li className="text-slate-500">
              • Matériaux: fck={inp.fck}MPa, fyk={inp.fyk}MPa
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
