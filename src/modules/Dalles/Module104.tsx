import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { Punching104Inputs, Punching104Output } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEF: Punching104Inputs = {
  fck: 25, fyk: 500, gc: 1.5,
  c1: 0.8, c2: 0.4, h: 0.2, d: 0.17,
  asx: 7, asy: 7, ved: 0.9641, beta: 1.15, sigcp: 0,
};

export default function Module104() {
  const [inp, setInp] = useState<Punching104Inputs>(DEF);
  const [res, setRes] = useState<Punching104Output | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof Punching104Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<Punching104Output>('calculate_punching_104', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const bars = res
    ? [
        { n: 'vEd0/vRd,max', v: res.ratio0 },
        { n: 'vEd/vRdc', v: res.ratio1 },
      ]
    : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold">
            104 Poinçonnement{' '}
            <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'après EGF N°104 © Henry Thonier — EC2 §6.4
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="c1 (≥c2)" unit="m" value={inp.c1} onChange={S('c1')} min={0.1} max={3} />
          <NumField label="c2" unit="m" value={inp.c2} onChange={S('c2')} min={0.1} max={3} />
          <NumField label="h" unit="m" value={inp.h} onChange={S('h')} min={0.1} max={1} />
          <NumField label="d" unit="m" value={inp.d} onChange={S('d')} min={0.05} max={1} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="Asx total" unit="cm²" value={inp.asx} onChange={S('asx')} min={0} max={200} step={0.5} />
          <NumField label="Asy total" unit="cm²" value={inp.asy} onChange={S('asy')} min={0} max={200} step={0.5} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="VEd" unit="MN" value={inp.ved} onChange={S('ved')} min={0} max={10} step={0.01} />
          <NumField label="β" unit="–" value={inp.beta} onChange={S('beta')} min={1} max={1.6} step={0.01} />
        </div>

        <NumField label="σcp" unit="MPa" value={inp.sigcp} onChange={S('sigcp')} min={0} max={5} step={0.1} />

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
      </div>

      {/* ─── Charts + Results ─── */}
      <div className="col-span-5 space-y-4">
        {/* Bar chart */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Ratios (seuil 1.0)</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={1} stroke="red" strokeDasharray="4 4" />
                <Bar dataKey="v">
                  {bars.map((b, i) => (
                    <Cell key={i} fill={b.v <= 1 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {res && (
            <div className="mt-3 font-mono text-xs space-y-1">
              <div>
                u0={res.u0.toFixed(2)}m · u1={res.u1.toFixed(2)}m · uout={res.uout.toFixed(2)}m (rout={res.rout.toFixed(2)}m)
              </div>
              <div>
                vEd0={res.ved0.toFixed(3)} / vRd,max={res.vrdmax.toFixed(3)} →{' '}
                <b className={res.verdict0 === 'OK' ? 'text-green-600' : 'text-red-600'}>
                  {res.verdict0}
                </b>
              </div>
              <div>
                vEd={res.ved.toFixed(3)} / vRdc={res.vrdc.toFixed(3)} →{' '}
                <b className={res.verdict1 === 'OK' ? 'text-green-600' : 'text-red-600'}>
                  {res.verdict1}
                </b>{' '}
                · Asw={res.asw_req.toFixed(1)}cm²/m · {res.nr}×{res.nt}={res.total_pins} pins
              </div>
              {res.chap_c1 && (
                <div className="text-amber-500">
                  Chapiteau estimé: {res.chap_c1.toFixed(2)}×{res.chap_c2?.toFixed(2)}m
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plan SVG */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan (live SVG)</h2>
          <svg viewBox="0 0 280 220" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const s = 90;
              const cx = 140;
              const cy = 110;
              const w = inp.c1 * s;
              const hh = inp.c2 * s;
              const e1 = 2 * inp.d * s;
              const eo = (res?.rout ?? 1) * s;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={eo} fill="none" stroke="#16a34a" strokeDasharray="4 3" />
                  <rect
                    x={cx - w / 2 - e1} y={cy - hh / 2 - e1}
                    width={w + 2 * e1} height={hh + 2 * e1}
                    fill="none" stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1.6}
                  />
                  <rect
                    x={cx - w / 2} y={cy - hh / 2}
                    width={w} height={hh}
                    fill="#1F3864" opacity={0.9}
                  />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#fff">
                    {inp.c1.toFixed(2)}×{inp.c2.toFixed(2)}
                  </text>
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
            <li className={res.ratio0 <= 1 ? 'text-green-600' : 'text-red-600'}>
              {res.ratio0 <= 1
                ? '✓ Pas d\'écrasement au nu (vEd0 ≤ vRd,max).'
                : '✗ Écrasement au nu: chapiteau obligatoire (armatures seules insuffisantes).'}
            </li>
            <li className={res.ratio1 <= 1 ? 'text-green-600' : res.ratio1 <= 1.5 ? 'text-amber-500' : 'text-red-600'}>
              {res.ratio1 <= 1
                ? `✓ Vérifié sans armatures poinçonnement (ρl=${(res.rhol * 100).toFixed(3)}%).`
                : res.ratio1 <= 1.5
                  ? `• Armer nécessaire: épingles 1er cours à 0.5d, sr≤0.6d, Asw=${res.asw_req.toFixed(1)}cm²/m.`
                  : '✗ Ratio très élevé: préférer chapiteau ou augmenter h.'}
            </li>
            <li className="text-slate-500">
              • uout={res.uout.toFixed(2)}m: arrêter les armatures au-delà de cette périmètre.
            </li>
            <li className="text-slate-500">
              • k={res.k.toFixed(3)} · ρl={(res.rhol * 100).toFixed(3)}% · vmin={res.vmin.toFixed(4)} MPa
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
