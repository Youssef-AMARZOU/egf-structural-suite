import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { Wall121Inputs, Wall121Output } from '../../types/engineering';
import NumField from '../../components/NumField';

interface LoadCase {
  eps: number;
  lc: number;
  q: number;
  is_maxi: boolean;
}

const DEFAULT_CASES: LoadCase[] = [
  { eps: 0, lc: 1.5, q: 10, is_maxi: false },
  { eps: 0, lc: 2.0, q: 15, is_maxi: false },
  { eps: 0, lc: 2.5, q: 20, is_maxi: true },
  { eps: 0, lc: 3.0, q: 25, is_maxi: true },
  { eps: 1, lc: 0.5, q: 0, is_maxi: false },
  { eps: 1, lc: 1.0, q: 5, is_maxi: false },
  { eps: 1, lc: 1.5, q: 10, is_maxi: false },
  { eps: 1, lc: 2.0, q: 15, is_maxi: false },
];

const DEF: Wall121Inputs = {
  h_tot: 3.5, l1: 2.5, l2: 0.8, l3: 1.5, e_predalle: 0.3, l_fond: 2.8,
  fck: 25, fyk: 500, gc: 1.5, gs: 1.15, gG: 1.35, gQ: 1.5,
  phi: 30, delta: 15, gamma_sol: 18, gamma_beton: 25,
  ks: 0.333, kp: 3.0,
  cases: DEFAULT_CASES,
  n5: 50, n6: 30, n1: 40, n2: 20,
};

export default function Module121() {
  const [inp, setInp] = useState<Wall121Inputs>(DEF);
  const [res, setRes] = useState<Wall121Output | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCases, setShowCases] = useState(false);

  const S = (k: keyof Wall121Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const updateCase = (i: number, field: keyof LoadCase, val: number | boolean) => {
    setInp((p) => {
      const cases = [...p.cases];
      cases[i] = { ...cases[i], [field]: val };
      return { ...p, cases };
    });
  };

  useEffect(() => {
    let dead = false;
    invoke<Wall121Output>('calculate_wall_121', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const bars = res
    ? [
        { n: 'Overturn', v: Math.max(0, res.over_turn_dm) },
        { n: 'σ1 (max)', v: res.sig1 },
        { n: 'σ2 (min)', v: res.sig2 },
      ]
    : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            121 Mur de soutènement{' '}
            <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'après EGF N°121 © Henry Thonier — EC2/RRA
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="H total" unit="m" value={inp.h_tot} onChange={S('h_tot')} min={1} max={10} />
          <NumField label="L1 (jambe)" unit="m" value={inp.l1} onChange={S('l1')} min={0.5} max={8} />
          <NumField label="L2 (talon)" unit="m" value={inp.l2} onChange={S('l2')} min={0.1} max={3} />
          <NumField label="L3 (talon arrière)" unit="m" value={inp.l3} onChange={S('l3')} min={0.1} max={5} />
          <NumField label="Ép. predalle" unit="m" value={inp.e_predalle} onChange={S('e_predalle')} min={0.1} max={1} />
          <NumField label="L fondation" unit="m" value={inp.l_fond} onChange={S('l_fond')} min={0.5} max={10} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="φ" unit="deg" value={inp.phi} onChange={S('phi')} min={10} max={45} step={1} />
          <NumField label="δ" unit="deg" value={inp.delta} onChange={S('delta')} min={0} max={30} step={1} />
          <NumField label="γ sol" unit="kN/m³" value={inp.gamma_sol} onChange={S('gamma_sol')} min={10} max={25} step={0.5} />
          <NumField label="γ béton" unit="kN/m³" value={inp.gamma_beton} onChange={S('gamma_beton')} min={20} max={26} step={0.5} />
          <NumField label="Ka" unit="–" value={inp.ks} onChange={S('ks')} min={0.1} max={1} step={0.01} />
          <NumField label="Kp" unit="–" value={inp.kp} onChange={S('kp')} min={1} max={10} step={0.1} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="N5 (tige)" unit="kN" value={inp.n5} onChange={S('n5')} min={0} max={500} step={1} />
          <NumField label="N6 (talon arrière)" unit="kN" value={inp.n6} onChange={S('n6')} min={0} max={500} step={1} />
          <NumField label="N1 (talon avant)" unit="kN" value={inp.n1} onChange={S('n1')} min={0} max={500} step={1} />
          <NumField label="N2 (talon arrière)" unit="kN" value={inp.n2} onChange={S('n2')} min={0} max={500} step={1} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="γG" unit="–" value={inp.gG} onChange={S('gG')} min={1.0} max={1.6} step={0.05} />
          <NumField label="γQ" unit="–" value={inp.gQ} onChange={S('gQ')} min={1.0} max={1.8} step={0.05} />
        </div>

        {/* Load cases toggle */}
        <button
          onClick={() => setShowCases(!showCases)}
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
        >
          {showCases ? '▼ Masquer' : '▶'} Cas de charge ({inp.cases.length})
        </button>

        {showCases && (
          <div className="space-y-2">
            {inp.cases.map((c, i) => (
              <div key={i} className="flex gap-1 items-end text-[10px]">
                <label className="block flex-1">
                  <span className="text-slate-500">eps</span>
                  <select value={c.eps} onChange={(e) => updateCase(i, 'eps', Number(e.target.value))}
                    className="w-full rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1 py-0.5 text-[11px] font-mono">
                    <option value={0}>Actif</option>
                    <option value={1}>Passif</option>
                  </select>
                </label>
                <label className="block flex-1">
                  <span className="text-slate-500">Lc</span>
                  <input type="number" value={c.lc} step={0.1}
                    onChange={(e) => updateCase(i, 'lc', Number(e.target.value))}
                    className="w-full rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1 py-0.5 text-[11px] font-mono" />
                </label>
                <label className="block flex-1">
                  <span className="text-slate-500">q</span>
                  <input type="number" value={c.q} step={1}
                    onChange={(e) => updateCase(i, 'q', Number(e.target.value))}
                    className="w-full rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 px-1 py-0.5 text-[11px] font-mono" />
                </label>
                <label className="flex items-center gap-1 pb-0.5">
                  <input type="checkbox" checked={c.is_maxi}
                    onChange={(e) => updateCase(i, 'is_maxi', e.target.checked)}
                    className="rounded" />
                  <span className="text-slate-500">maxi</span>
                </label>
              </div>
            ))}
          </div>
        )}

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
      </div>

      {/* ─── Charts + Results ─── */}
      <div className="col-span-5 space-y-4">
        {/* Wall SVG Profile */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupe du mur (live SVG)</h2>
          <svg viewBox="0 0 320 240" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 50;
              const ox = 80, oy = 20;
              const h_wall = inp.l1;
              const h_fond = inp.e_predalle;
              const w_stem = 0.25;
              const total_h = h_wall + h_fond;
              const total_w = inp.l2 + w_stem + inp.l3;

              return (
                <g>
                  {/* Soil hatching (back) */}
                  <rect x={ox + (inp.l2 + w_stem) * sc} y={oy}
                    width={inp.l3 * sc} height={h_wall * sc}
                    fill="#d4c4a0" opacity={0.3} />
                  <text x={ox + (inp.l2 + w_stem + inp.l3 / 2) * sc} y={oy + h_wall * sc / 2}
                    textAnchor="middle" fontSize={8} fill="#8b7355">Sol arrière</text>

                  {/* Foundation slab */}
                  <rect x={ox} y={oy + h_wall * sc}
                    width={total_w * sc} height={h_fond * sc}
                    fill="#6b7280" stroke="#374151" strokeWidth={1.5} />
                  <text x={ox + total_w * sc / 2} y={oy + (h_wall + h_fond / 2) * sc + 3}
                    textAnchor="middle" fontSize={7} fill="#fff">Predalle</text>

                  {/* Stem */}
                  <rect x={ox + inp.l2 * sc} y={oy}
                    width={w_stem * sc} height={h_wall * sc}
                    fill="#1F3864" stroke="#1e3a5f" strokeWidth={1.5} />
                  <text x={ox + (inp.l2 + w_stem / 2) * sc} y={oy + h_wall * sc / 2 + 3}
                    textAnchor="middle" fontSize={7} fill="#fff" transform={`rotate(-90, ${ox + (inp.l2 + w_stem / 2) * sc}, ${oy + h_wall * sc / 2})`}>
                    {inp.l1.toFixed(1)}m
                  </text>

                  {/* Dimensions */}
                  <line x1={ox} y1={oy + total_h * sc + 15} x2={ox + total_w * sc} y2={oy + total_h * sc + 15}
                    stroke="#94a3b8" strokeWidth={0.8} />
                  <text x={ox + inp.l2 * sc / 2} y={oy + total_h * sc + 25}
                    textAnchor="middle" fontSize={7} fill="#94a3b8">L2={inp.l2.toFixed(1)}</text>
                  <text x={ox + (inp.l2 + w_stem + inp.l3 / 2) * sc} y={oy + total_h * sc + 25}
                    textAnchor="middle" fontSize={7} fill="#94a3b8">L3={inp.l3.toFixed(1)}</text>

                  {/* Earth pressure arrows */}
                  {[0.2, 0.5, 0.8].map((f, i) => (
                    <g key={i}>
                      <line x1={ox - 15} y1={oy + f * h_wall * sc}
                        x2={ox + inp.l2 * sc - 3} y2={oy + f * h_wall * sc}
                        stroke="#ef4444" strokeWidth={1.5} markerEnd="url(#arrow)" />
                    </g>
                  ))}
                  <defs>
                    <marker id="arrow" markerWidth={6} markerHeight={4} refX={6} refY={2} orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
                    </marker>
                  </defs>
                  <text x={ox - 20} y={oy + 10} textAnchor="end" fontSize={7} fill="#ef4444">Ka·γ·z</text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Bar chart */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="v">
                  {bars.map((b, i) => (
                    <Cell key={i} fill={i === 0 ? '#2563eb' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {res && (
            <div className="mt-3 font-mono text-xs space-y-1">
              <div>
                Cas actif #{res.ma_case} · M56={res.ma_m56.toFixed(1)} kNm · Mm={res.ma_mm.toFixed(1)} kNm
              </div>
              <div>
                Cas passif #{res.mp_case} · M12Q={res.mp_m12q.toFixed(1)} kNm · Mm={res.mp_mm.toFixed(1)} kNm
              </div>
              <div>
                σ1={res.sig1.toFixed(2)} MPa · σ2={res.sig2.toFixed(2)} MPa · Lc={res.lc_cont.toFixed(2)}m
              </div>
              <div>
                Excentricité e={res.eccentricity.toFixed(3)} · ea={res.ea.toFixed(3)}m ·{' '}
                <b className={res.in_middle_third ? 'text-green-600' : 'text-red-600'}>
                  {res.in_middle_third ? '✓ Tiers central' : '✗ Hors tiers central'}
                </b>
              </div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── AI Diagnostics ─── */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing…</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className={res.in_middle_third ? 'text-green-600' : 'text-red-600'}>
              {res.in_middle_third
                ? `✓ Résultante dans le tiers central (e=${res.eccentricity.toFixed(3)} ≤ 1/6).`
                : `✗ Résultante hors tiers central (e=${res.eccentricity.toFixed(3)} > 1/6): augmenter L fondation.`}
            </li>
            <li className={res.sig2 >= 0 ? 'text-green-600' : 'text-red-600'}>
              {res.sig2 >= 0
                ? `✓ Pas de décollement (σ2=${res.sig2.toFixed(2)} ≥ 0).`
                : `✗ Décollement: σ2 négatif, répartir les charges.`}
            </li>
            <li className="text-slate-500">
              • Cas actif critique: #{res.ma_case} (DM={res.ma_dm.toFixed(1)} kNm)
            </li>
            <li className="text-slate-500">
              • Cas passif critique: #{res.mp_case} (DM={res.mp_dm.toFixed(1)} kNm)
            </li>
            <li className="text-slate-500">
              • Marge basculement: {res.over_turn_dm.toFixed(1)} kNm
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
