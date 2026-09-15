import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { Wall121Inputs, Wall121Output } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

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
  const { data: res, error: err, live } = useModuleCalc<Wall121Inputs, Wall121Output>(
    'calculate_wall_121', inp,
  );
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


  const bars = res
    ? [
        { n: 'Overturn', v: Math.max(0, res.over_turn_dm) },
        { n: 'σ1 (max)', v: res.sig1 },
        { n: 'σ2 (min)', v: res.sig2 },
      ]
    : [];

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Wall121Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="121 Mur de soutènement"
      subtitle="D'après EGF N°121 © Henry Thonier — EC2/RRA"
      eurocode="EC2"
      status={status}
      live={live}
      params={
        <>

        <div className="grid grid-cols-2 gap-2">
          {slider('h_tot', 'H total', 'm', 1, 10, 0.1)}
          {slider('l1', 'L1 (jambe)', 'm', 0.5, 8, 0.1)}
          {slider('l2', 'L2 (talon)', 'm', 0.1, 3, 0.05)}
          {slider('l3', 'L3 (talon arrière)', 'm', 0.1, 5, 0.05)}
          {slider('e_predalle', 'Ép. predalle', 'm', 0.1, 1, 0.01)}
          {slider('l_fond', 'L fondation', 'm', 0.5, 10, 0.1)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('phi', 'φ', 'deg', 10, 45, 1)}
          {slider('delta', 'δ', 'deg', 0, 30, 1)}
          {slider('gamma_sol', 'γ sol', 'kN/m³', 10, 25, 0.5)}
          {slider('gamma_beton', 'γ béton', 'kN/m³', 20, 26, 0.5)}
          {slider('ks', 'Ka', '–', 0.1, 1, 0.01)}
          {slider('kp', 'Kp', '–', 1, 10, 0.1)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('n5', 'N5 (tige)', 'kN', 0, 500, 1)}
          {slider('n6', 'N6 (talon arrière)', 'kN', 0, 500, 1)}
          {slider('n1', 'N1 (talon avant)', 'kN', 0, 500, 1)}
          {slider('n2', 'N2 (talon arrière)', 'kN', 0, 500, 1)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('gG', 'γG', '–', 1.0, 1.6, 0.05)}
          {slider('gQ', 'γQ', '–', 1.0, 1.8, 0.05)}
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
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe du mur (live SVG)" vbW={320} vbH={240}>
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
                  <rect x={ox + (inp.l2 + w_stem) * sc} y={oy}
                    width={inp.l3 * sc} height={h_wall * sc}
                    fill="#d4c4a0" opacity={0.3} />
                  <text x={ox + (inp.l2 + w_stem + inp.l3 / 2) * sc} y={oy + h_wall * sc / 2}
                    textAnchor="middle" fontSize={8} fill="#8b7355">Sol arrière</text>

                  <rect x={ox} y={oy + h_wall * sc}
                    width={total_w * sc} height={h_fond * sc}
                    fill="#6b7280" stroke="#374151" strokeWidth={1.5} />
                  <text x={ox + total_w * sc / 2} y={oy + (h_wall + h_fond / 2) * sc + 3}
                    textAnchor="middle" fontSize={7} fill="#fff">Predalle</text>

                  <rect x={ox + inp.l2 * sc} y={oy}
                    width={w_stem * sc} height={h_wall * sc}
                    fill="#1F3864" stroke="#1e3a5f" strokeWidth={1.5} />
                  <text x={ox + (inp.l2 + w_stem / 2) * sc} y={oy + h_wall * sc / 2 + 3}
                    textAnchor="middle" fontSize={7} fill="#fff" transform={`rotate(-90, ${ox + (inp.l2 + w_stem / 2) * sc}, ${oy + h_wall * sc / 2})`}>
                    {inp.l1.toFixed(1)}m
                  </text>

                  <line x1={ox} y1={oy + total_h * sc + 15} x2={ox + total_w * sc} y2={oy + total_h * sc + 15}
                    stroke="#94a3b8" strokeWidth={0.8} />
                  <text x={ox + inp.l2 * sc / 2} y={oy + total_h * sc + 25}
                    textAnchor="middle" fontSize={7} fill="#94a3b8">L2={inp.l2.toFixed(1)}</text>
                  <text x={ox + (inp.l2 + w_stem + inp.l3 / 2) * sc} y={oy + total_h * sc + 25}
                    textAnchor="middle" fontSize={7} fill="#94a3b8">L3={inp.l3.toFixed(1)}</text>

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
          </SectionCanvas>
        </div>
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
        </>
      }
      results={
        <>
          {res ? (
            <>

              <FormulaCard
                title="Poussée des terres (Rankine)"
                latex={String.raw`P_a = \frac{1}{2}\gamma H^2 K_a, \; K_a = \tan^2\left(45^\circ - \varphi'/2\right)`}
                description="Mur de soutènement, écran vertical"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`K_a`, meaning: 'Coefficient de poussée', value: res.eccentricity.toFixed(3) },
                    { symbol: String.raw`\varphi'`, meaning: 'Angle de frottement', value: inp.phi },
                ]}
              />
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
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
