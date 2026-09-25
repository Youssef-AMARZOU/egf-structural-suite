import { useState, useMemo } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, AxisTicks, InlineLegend } from '../../components/drafting';
import { BoussinesqDtuInputs, BoussinesqDtuOutput, LoadedRect187 } from '../../types/engineering';

const parseRects = (s: string): LoadedRect187[] =>
  s.split(';').map(v => v.trim().split(',').map(Number)).filter(a => a.length === 5 && a.every(v => !isNaN(v)))
    .map(a => ({ x1: a[0], y1: a[1], a: a[2], b: a[3], Gp: a[4] }));

export default function Module187() {
  const [inp, setInp] = useState<BoussinesqDtuInputs>({
    rects: [{ x1: 0, y1: 0, a: 2, b: 3, Gp: 900 }],
    x: 0, y: 0, z_max: 10, n_depth: 50,
  });
  const [txt, setTxt] = useState({ rects: '0,0,2,3,900' });

  const parsed = parseRects(txt.rects);
  const payload: BoussinesqDtuInputs = useMemo(() => ({
    ...inp, rects: parsed.length > 0 ? parsed : inp.rects,
  }), [txt.rects, inp]);

  const { data: res, error: err, live } = useModuleCalc<BoussinesqDtuInputs, BoussinesqDtuOutput>(
    'calculate_boussinesq_dtu_187', payload,
  );
  const S = (k: keyof BoussinesqDtuInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BoussinesqDtuInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="187 Boussinesq DTU (contrainte en un point)"
      subtitle="Δσ(x,y,z) sous charges rectangulaires — superposition 4 coins Fadum — RUST"
      eurocode="EC7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges rectangulaires</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Rectangles (x₁,y₁,a,b,Gp ; ...)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.rects} onChange={e => setTxt({ ...txt, rects: e.target.value })}
              placeholder="0,0,2,3,900" />
            <p className="text-[11px] text-slate-400 mt-1">Gp charge totale (kN), a/b dimensions (m), centre (x₁,y₁)</p>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Point de calcul</div>
          {slider('x', 'Abscisse x', 'm', -10, 10, 0.5)}
          {slider('y', 'Ordonnée y', 'm', -10, 10, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Profil vertical</div>
          {slider('z_max', 'Profondeur max z_max', 'm', 1, 30, 1)}
          {slider('n_depth', 'Nombre de pas', '', 10, 200, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Vue en plan — charges rectangulaires + point P(x,y)" vbW={600} vbH={220}>
              {(() => {
                const ox = 60, oy = 20, w = 480, h = 180;
                const allX = inp.rects.map(r => [r.x1 - r.a / 2, r.x1 + r.a / 2]).flat().concat([inp.x]);
                const allY = inp.rects.map(r => [r.y1 - r.b / 2, r.y1 + r.b / 2]).flat().concat([inp.y]);
                const xMin = Math.min(...allX) - 2;
                const xMax = Math.max(...allX) + 2;
                const yMin = Math.min(...allY) - 2;
                const yMax = Math.max(...allY) + 2;
                const scaleX = (v: number) => ox + ((v - xMin) / (xMax - xMin)) * w;
                const scaleY = (v: number) => oy + ((v - yMin) / (yMax - yMin)) * h;
                const xVals = Array.from({ length: 6 }, (_, i) => xMin + ((xMax - xMin) * i) / 5);
                const yVals = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);

                return (
                  <>
                    <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#334155" strokeWidth={0.5} />
                    <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#334155" strokeWidth={0.5} />
                    {inp.rects.map((r, i) => {
                      const x1 = scaleX(r.x1 - r.a / 2);
                      const y1 = scaleY(r.y1 - r.b / 2);
                      const rw = (r.a / (xMax - xMin)) * w;
                      const rb = (r.b / (yMax - yMin)) * h;
                      const q = r.Gp / r.a / r.b;
                      return (
                        <g key={`rect-${i}`}>
                          <rect x={x1} y={y1} width={rw} height={rb} fill="#3B82F6" fillOpacity={0.2} stroke="#3B82F6" strokeWidth={1.2} />
                          <text x={x1 + rw / 2} y={y1 + rb / 2 - 3} fontSize={8} fill="#60A5FA" textAnchor="middle">
                            {r.a.toFixed(1)}×{r.b.toFixed(1)} m
                          </text>
                          <text x={x1 + rw / 2} y={y1 + rb / 2 + 9} fontSize={7} fill="#93C5FD" textAnchor="middle">
                            {q.toFixed(0)} kPa
                          </text>
                        </g>
                      );
                    })}
                    <circle cx={scaleX(inp.x)} cy={scaleY(inp.y)} r={5} fill="#EF4444" stroke="#fff" strokeWidth={1.5} />
                    <text x={scaleX(inp.x) + 8} y={scaleY(inp.y) - 6} fontSize={9} fill="#FCA5A5" fontWeight="bold">
                      P({inp.x},{inp.y})
                    </text>
                    <AxisTicks
                      origin={[ox, oy + h + 5]}
                      end={[ox + w, oy + h + 5]}
                      values={xVals}
                      map={(v) => [scaleX(v), oy + h + 5]}
                      unit="m" side="below" decimals={1}
                    />
                    <AxisTicks
                      origin={[ox - 5, oy]}
                      end={[ox - 5, oy + h]}
                      values={yVals}
                      map={(v) => [ox - 5, scaleY(v)]}
                      unit="m" side="left" decimals={1}
                    />
                    <text x={ox + w / 2} y={oy + h + 22} fontSize={8} fill="#CBD5E1" textAnchor="middle">x (m)</text>
                    <text x={ox - 18} y={oy + h / 2} fontSize={8} fill="#CBD5E1" textAnchor="middle" transform={`rotate(-90, ${ox - 18}, ${oy + h / 2})`}>y (m)</text>
                  </>
                );
              })()}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Profil vertical Δσ(z) au point P" vbW={600} vbH={200}>
              {res && (() => {
                const ox = 70, oy = 20, w = 460, h = 155;
                const zMax = inp.z_max;
                const sMax = Math.max(...res.stress, 0.01);
                const pts: [number, number][] = res.depths.map((z, i) => [
                  ox + (res.stress[i] / sMax) * w,
                  oy + (z / zMax) * h,
                ]);
                const fillPath = `M${ox},${oy} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${ox},${oy + h} Z`;
                const depthVals = Array.from({ length: 6 }, (_, i) => (zMax * i) / 5);
                const sigVals = Array.from({ length: 5 }, (_, i) => (sMax * i) / 4);
                return (
                  <>
                    <path d={fillPath} fill="#6366F1" fillOpacity={0.1} stroke="none" />
                    <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke="#6366F1" strokeWidth={2} />
                    <circle cx={pts[0][0]} cy={pts[0][1]} r={3} fill="#6366F1" />
                    <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94A3B8" strokeWidth={0.8} />
                    <AxisTicks
                      origin={[ox, oy + h + 5]}
                      end={[ox + w, oy + h + 5]}
                      values={sigVals}
                      map={(v) => [ox + (v / sMax) * w, oy + h + 5]}
                      unit="kPa" side="below" decimals={0}
                    />
                    <AxisTicks
                      origin={[ox - 5, oy]}
                      end={[ox - 5, oy + h]}
                      values={depthVals}
                      map={(v) => [ox - 5, oy + (v / zMax) * h]}
                      unit="m" side="left" decimals={1}
                    />
                    <InlineLegend items={[{ label: `Δσ(z) — σ_max = ${res.sigma_max.toFixed(1)} kPa`, color: '#6366F1' }]} x={ox + w - 250} y={oy + 5} />
                  </>
                );
              })()}
            </SectionCanvas>
          </div>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['σ_max profil', `${res.sigma_max.toFixed(2)} kPa`],
                  ['σ surface', `${res.sigma_surf.toFixed(2)} kPa`],
                  ['z_ref', `${res.z_ref.toFixed(2)} m`],
                  ['Nb rectangles', `${inp.rects.length}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Diffusion Boussinesq"
                latex={String.raw`\Delta\sigma_z = \sum_{i=1}^{n} \pm q_i \cdot I_{F}(a_i, b_i, z)`}
                description="Superposition des contributions de chaque coin (Fadum/Newmark)"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: 'q', meaning: 'Pression (rectangle max)', value: Math.max(...inp.rects.map(r => r.Gp / r.a / r.b)).toFixed(1), unit: 'kPa' },
                  { symbol: 'σ_max', meaning: 'Contrainte max profil', value: res.sigma_max.toFixed(2), unit: 'kPa' },
                  { symbol: 'z_ref', meaning: 'Profondeur de réf.', value: res.z_ref.toFixed(2), unit: 'm' },
                ]}
              />
              <div className="p-2 rounded bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300 text-xs font-semibold">
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {res.diag.map((d: string, i: number) => (
                  <li key={i} className="font-mono text-slate-600 dark:text-slate-400">{d}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
