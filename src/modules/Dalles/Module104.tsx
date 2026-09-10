import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { Punching104Inputs, Punching104Output } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEF: Punching104Inputs = {
  fck: 25, fyk: 500, gc: 1.5,
  c1: 0.8, c2: 0.4, h: 0.2, d: 0.17,
  asx: 7, asy: 7, ved: 0.9641, beta: 1.15, sigcp: 0,
};


export default function Module104() {
  const [inp, setInp] = useState<Punching104Inputs>(DEF);
  const { data: res, error: err, live } = useModuleCalc<Punching104Inputs, Punching104Output>(
    'calculate_punching_104', inp,
  );

  const S = (k: keyof Punching104Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));


  const bars = res
    ? [
        { n: 'vEd0/vRd,max', v: res.ratio0 },
        { n: 'vEd/vRdc', v: res.ratio1 },
      ]
    : [];

  const status = !res ? 'computing' : res.ratio0 <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof Punching104Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="104 Poinçonnement"
      subtitle="D'après EGF N°104 © Henry Thonier — EC2 §6.4"
      eurocode="EC2 §6.4"
      status={status}
      live={live}
      params={
        <>

        <div className="grid grid-cols-2 gap-2">
          {slider('c1', 'c1 (≥c2)', 'm', 0.1, 3, 0.05)}
          {slider('c2', 'c2', 'm', 0.1, 3, 0.05)}
          {slider('h', 'h', 'm', 0.1, 1, 0.01)}
          {slider('d', 'd', 'm', 0.05, 1, 0.01)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('asx', 'Asx total', 'cm²', 0, 200, 0.5)}
          {slider('asy', 'Asy total', 'cm²', 0, 200, 0.5)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('ved', 'VEd', 'MN', 0, 10, 0.01)}
          {slider('beta', 'β', '–', 1, 1.6, 0.01)}
        </div>

        {slider('sigcp', 'σcp', 'MPa', 0, 5, 0.1)}

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
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan (live SVG)" vbW={280} vbH={220}>
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
          </SectionCanvas>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>

              <FormulaCard
                title="Poinçonnement rectangulaire (EC2 §6.4)"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}`}
                description="Vérification au périmètre u1"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort de poinçonnement', value: res.asw_req.toFixed(1) },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.uout.toFixed(2) },
                ]}
              />
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
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
