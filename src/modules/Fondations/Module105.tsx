import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type {
  CircularPunching105Inputs,
  CircularPunching105Output,
} from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEF: CircularPunching105Inputs = {
  c: 0.6,
  d: 0.25,
  rho: 1.0,
  scp: 0,
  g_ved: 1.2,
  fck: 30,
  gc: 1.5,
  fyk: 500,
  gs: 1.15,
  nbrin: 4,
};


export default function Module105() {
  const [inp, setInp] = useState<CircularPunching105Inputs>(DEF);
  const { data: res, error: err, live } = useModuleCalc<CircularPunching105Inputs, CircularPunching105Output>(
    'calculate_circular_punching_105', inp,
  );

  const S = (k: keyof CircularPunching105Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));


  const bars = res
    ? [
        { n: 'vEd0/vRd,max', v: res.ratio0 },
        { n: 'vEd/vRdc', v: res.ratio1 },
      ]
    : [];

  const status = !res ? 'computing' : res.ratio0 <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof CircularPunching105Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="105 Poinçonnement circulaire"
      subtitle="D'après EGF N°105 © Henry Thonier — EC2 §6.4"
      eurocode="EC2 §6.4"
      status={status}
      live={live}
      params={
        <>

        <div className="grid grid-cols-2 gap-2">
          {slider('c', 'c (diamètre)', 'm', 0.1, 3, 0.05)}
          {slider('d', 'd', 'm', 0.05, 1, 0.01)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('rho', 'ρ', '%', 0.1, 5, 0.1)}
          {slider('scp', 'σcp', 'MPa', 0, 5, 0.1)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('g_ved', 'GVEd', 'MN', 0, 20, 0.05)}
          {slider('gc', 'γc', '–', 1.0, 2.0, 0.05)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slider('gs', 'γs', '–', 1.0, 2.0, 0.05)}
          <ParamSlider label="Brins" unit="–" value={inp.nbrin} min={2} max={8} step={1} onChange={(v) => setInp((p) => ({ ...p, nbrin: Math.round(v) }))} />
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
                u0={res.u0.toFixed(3)}m · u1={res.u1.toFixed(3)}m
              </div>
              <div>
                vEd0={res.ved0.toFixed(3)} / vRd,max={res.vrd_max.toFixed(3)} →{' '}
                <b className={res.verdict0 === 'OK' ? 'text-green-600' : 'text-red-600'}>
                  {res.verdict0}
                </b>
              </div>
              <div>
                vEd={res.ved.toFixed(3)} / vRdc={res.vrdc.toFixed(3)} →{' '}
                <b className={res.verdict1.includes('OK') ? 'text-green-600' : 'text-red-600'}>
                  {res.verdict1}
                </b>
              </div>
              {res.asw_req > 0 && (
                <div>
                  Asw={res.asw_req.toFixed(1)}cm²/m · φ{res.phi.toFixed(0)}×{res.nbrin_out}br · {res.nr}×{res.nt} rings
                </div>
              )}
              {res.chap_hh > 0 && (
                <div className="text-amber-500">
                  Chapiteau: hH={res.chap_hh.toFixed(3)}m · lH={res.chap_lh.toFixed(3)}m
                </div>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan (live SVG)" vbW={280} vbH={280}>
            {(() => {
              const sc = 80;
              const cx = 140;
              const cy = 140;
              const colR = (inp.c / 2) * sc;
              const r1 = ((inp.c / 2 + 2 * inp.d)) * sc;
              const rOut = res ? res.rout * sc : r1 + 30;
              const rOutRed = res ? res.rout_red * sc : r1 + 10;

              // Generate stirrup ring points
              const rings: { cx: number; cy: number; r: number; color: string; dash: string }[] = [];

              // Column circle
              rings.push({ cx, cy, r: colR, color: '#1F3864', dash: '' });
              // u1 circle
              rings.push({ cx, cy, r: r1, color: '#f59e0b', dash: '6 3' });
              // Outer steel perimeter
              if (res && res.rout > 0) {
                rings.push({ cx, cy, r: rOut, color: '#16a34a', dash: '4 3' });
              }

              // Concentric reinforcement rings
              const reinforcementRings: { cx: number; cy: number; r: number; dots: { x: number; y: number }[] }[] = [];
              if (res && res.nr > 0 && res.nt > 0) {
                for (let ri = 0; ri < res.nr; ri++) {
                  const rr = (inp.c / 2 + 0.5 * inp.d + ri * res.sr) * sc;
                  if (rr < 0 || rr > 130) continue;
                  const dots: { x: number; y: number }[] = [];
                  for (let ti = 0; ti < res.nt; ti++) {
                    const angle = (ti / res.nt) * 2 * Math.PI;
                    dots.push({
                      x: cx + rr * Math.cos(angle),
                      y: cy + rr * Math.sin(angle),
                    });
                  }
                  reinforcementRings.push({ cx, cy, r: rr, dots });
                }
              }

              return (
                <g>
                  <line x1={0} y1={cy} x2={280} y2={cy} stroke="#e2e8f0" strokeWidth={0.5} />
                  <line x1={cx} y1={0} x2={cx} y2={280} stroke="#e2e8f0" strokeWidth={0.5} />

                  {rings.map((r, i) => (
                    <circle key={i} cx={r.cx} cy={r.cy} r={r.r}
                      fill={i === 0 ? r.color : 'none'} opacity={i === 0 ? 0.9 : 1}
                      stroke={r.color} strokeWidth={i === 0 ? 0 : 1.5}
                      strokeDasharray={r.dash} />
                  ))}

                  {reinforcementRings.map((ring, ri) =>
                    ring.dots.map((dot, ti) => (
                      <circle key={`${ri}-${ti}`} cx={dot.x} cy={dot.y} r={2.5}
                        fill="#dc2626" opacity={0.8} />
                    ))
                  )}

                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={8} fill="#fff">
                    φ{inp.c.toFixed(2)}
                  </text>
                  <text x={cx + r1 + 5} y={cy - 5} fontSize={7} fill="#f59e0b">
                    u1
                  </text>
                  {res && (
                    <text x={cx + rOut + 5} y={cy - 5} fontSize={7} fill="#16a34a">
                      uout
                    </text>
                  )}

                  <circle cx={10} cy={260} r={4} fill="#1F3864" />
                  <text x={20} y={263} fontSize={7} fill="#64748b">Poteau</text>
                  <circle cx={70} cy={260} r={4} fill="none" stroke="#f59e0b" strokeDasharray="3 2" />
                  <text x={80} y={263} fontSize={7} fill="#64748b">u1 (2d)</text>
                  <circle cx={130} cy={260} r={4} fill="none" stroke="#16a34a" strokeDasharray="3 2" />
                  <text x={140} y={263} fontSize={7} fill="#64748b">uout</text>
                  <circle cx={200} cy={260} r={3} fill="#dc2626" />
                  <text x={208} y={263} fontSize={7} fill="#64748b">Épingles</text>
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
                title="Poinçonnement circulaire (EC2 §6.4)"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}`}
                description="Poteau circulaire sans chapiteau"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort de poinçonnement', value: res.ved0.toFixed(2) },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.vrd_max.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing…</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className={res.ratio0 <= 1 ? 'text-green-600' : 'text-red-600'}>
              {res.ratio0 <= 1
                ? `✓ Pas d'écrasement au nu (vEd0=${res.ved0.toFixed(2)} ≤ vRd,max=${res.vrd_max.toFixed(2)}).`
                : `✗ Écrasement au nu: vEd0=${res.ved0.toFixed(2)} > vRd,max=${res.vrd_max.toFixed(2)}.`}
            </li>
            <li className={res.ratio1 <= 1 ? 'text-green-600' : res.ratio1 <= 1.5 ? 'text-amber-500' : 'text-red-600'}>
              {res.ratio1 <= 1
                ? `✓ Vérifié sans armatures poinçonnement (ρl=${(inp.rho).toFixed(2)}%).`
                : res.ratio1 <= 1.5
                  ? `• Armer nécessaire: épingles φ${res.phi.toFixed(0)}×${res.nbrin_out}, sr≤0.75d, ${res.nr}×${res.nt}.`
                  : `✗ Ratio très élevé (${res.ratio1.toFixed(2)}): préférer chapiteau ou augmenter d.`}
            </li>
            <li className="text-slate-500">
              • k={res.k.toFixed(3)} · vmin={res.vmin.toFixed(4)} MPa
            </li>
            <li className="text-slate-500">
              • uout={res.uout.toFixed(3)}m → rout={res.rout.toFixed(3)}m
            </li>
            <li className="text-slate-500">
              • fywd={res.fywd.toFixed(1)} MPa · Asw/tour={res.asw1.toFixed(4)} m²
            </li>
            {res.chap_hh > 0 && (
              <li className="text-amber-500">
                • Chapiteau: hH={res.chap_hh.toFixed(3)}m, lH={res.chap_lh.toFixed(3)}m
              </li>
            )}
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
