import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { Punching103Inputs, Punching103Output } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: Punching103Inputs = {
  a: 400, b: 400, h: 250, d: 210,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  gved: 450, sigma_cp: 2.0, r_col: 0, del: 0,
  position: 2, c3: 200, c4: 200,
};


export default function Module103() {
  const [inp, setInp] = useState<Punching103Inputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<Punching103Inputs, Punching103Output>(
    'calculate_punching_103', inp,
  );

  const S = (k: keyof Punching103Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));


  const stressData = res ? [
    { name: 'vEd0\n(col)', value: res.ved0, limit: res.vrdco },
    { name: 'vEd\n(u1)', value: res.ved, limit: res.vrdc },
    { name: 'vRd,min', value: res.vrd_min, limit: 0 },
  ] : [];

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Punching103Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="103 Dalle BP6"
      subtitle="Poinçonnement dalle — EC2 §6.4"
      eurocode="EC2 §6.4"
      status={status}
      live={live}
      params={
        <>

        {/* Column */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poteau</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('a', 'Dimension a', 'mm', 100, 3000, 50)}
          {slider('b', 'Dimension b', 'mm', 100, 3000, 50)}
        </div>

        {/* Column head */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Chapiteau</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('r_col', 'Rayon colonne', 'mm', 0, 2000, 50)}
          {slider('del', 'Décalage chapiteau', 'mm', 0, 1000, 50)}
        </div>

        {/* Slab */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('h', 'Hauteur dalle h', 'mm', 100, 800, 10)}
          {slider('d', 'Hauteur utile d', 'mm', 80, 700, 10)}
        </div>

        {/* Materials */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1.0, 2.0, 0.05)}
          {slider('gs', 'γs', '-', 1.0, 1.5, 0.05)}
        </div>

        {/* Loading */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitation</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('gved', 'GVEd', 'kN', 10, 5000, 10)}
          {slider('sigma_cp', 'σcp', 'MPa', 0, 20, 0.5)}
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
          {slider('c3', 'Distance c3', 'mm', 0, 5000, 50)}
          {slider('c4', 'Distance c4', 'mm', 0, 5000, 50)}
        </div>

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
          <h2 className="text-sm font-bold mb-2 dark:text-slate-200">Contraintes de cisaillement (MPa)</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#CBD5E1' }} stroke="#475569" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#CBD5E1' }} width={55} stroke="#475569" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: '#F8FAFC' }}
                  itemStyle={{ color: '#CBD5E1' }}
                />
                <ReferenceLine x={1} stroke="#FACC15" strokeWidth={2} strokeDasharray="6 3" label={{ value: 'Seuil = 1', position: 'top', fill: '#FACC15', fontSize: 11 }} />
                <Bar dataKey="value" name="vEd" fill="#60A5FA" radius={[0, 4, 4, 0]} barSize={28} />
                <Bar dataKey="limit" name="vRd" fill="#F87171" radius={[0, 4, 4, 0]} barSize={28} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan (live SVG)" vbW={300} vbH={300}>
            {(() => {
              const sc = 0.3;
              const ox = 150, oy = 150;
              const a = inp.a * sc, b = inp.b * sc;
              const u1_m = res ? res.u1 / 1000.0 : 0;
              const r1 = (u1_m / (2.0 * Math.PI)) * sc * 1000;

              return (
                <g>
                  <rect x={20} y={20} width={260} height={260}
                    fill="#e2e8f0" opacity={0.3} rx={4} />
                  <rect x={ox - r1 / 2} y={oy - r1 / 2} width={r1} height={r1}
                    fill="none" stroke="#2563eb" strokeWidth={1} strokeDasharray="4 2" rx={4} />
                  <rect x={ox - a / 2} y={oy - b / 2} width={a} height={b}
                    fill="#1e40af" rx={2} />
                  {inp.r_col > 0 && (
                    <circle cx={ox} cy={oy} r={inp.r_col * sc}
                      fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
                  )}
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
          </SectionCanvas>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>

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

              <FormulaCard
                title="Poinçonnement (EC2 §6.4)"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}`}
                description="Contrainte de cisaillement sur le périmètre de contrôle"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort de poinçonnement', value: res.ved.toFixed(2) },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.vrdc.toFixed(2) },
                    { symbol: String.raw`\beta`, meaning: 'Excentrement', value: res.ved0.toFixed(2) },
                ]}
              />
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
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
