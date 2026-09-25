import { useState, useMemo } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, AxisTicks, InlineLegend } from '../../components/drafting';
import { BoussinesqGrilleInputs, BoussinesqGrilleOutput, SoilLayer186 } from '../../types/engineering';

const parseLayers = (s: string): SoilLayer186[] =>
  s.split(';').map(v => v.trim().split(/x|\*/).map(Number)).filter(a => a.length === 3 && a.every(v => !isNaN(v)))
    .map(a => ({ h: a[0], E: a[1], nu: a[2] }));

export default function Module186() {
  const [inp, setInp] = useState<BoussinesqGrilleInputs>({
    B: 2, L: 3, q: 150, E: 20000, nu: 0.3, z_max: 10, n_depth: 50, z_grid: 2, grid_n: 21,
    layers: [{ h: 10, E: 20000, nu: 0.3 }],
  });
  const [txt, setTxt] = useState({ layers: '10x20000x0.3' });

  const parsed = parseLayers(txt.layers);
  const payload: BoussinesqGrilleInputs = useMemo(() => ({
    ...inp, layers: parsed.length > 0 ? parsed : inp.layers,
  }), [txt.layers, inp]);

  const { data: res, error: err, live } = useModuleCalc<BoussinesqGrilleInputs, BoussinesqGrilleOutput>(
    'calculate_boussinesq_grille_186', payload,
  );
  const S = (k: keyof BoussinesqGrilleInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BoussinesqGrilleInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="186 Boussinesq Grille (bulbe de contrainte)"
      subtitle="Facteurs d'influence Fadum/Newmark sous charge rectangulaire + bulbe + tassement — RUST"
      eurocode="EC7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charge rectangulaire</div>
          {slider('B', 'Largeur B', 'm', 0.5, 10, 0.5)}
          {slider('L', 'Longueur L', 'm', 0.5, 10, 0.5)}
          {slider('q', 'Pression q', 'kPa', 0, 500, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Profondeur</div>
          {slider('z_max', 'z_max (analyse)', 'm', 1, 30, 1)}
          {slider('n_depth', 'Nombre de pas', '', 10, 200, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Grille plan</div>
          {slider('z_grid', 'z_plan (profondeur)', 'm', 0.5, 10, 0.5)}
          {slider('grid_n', 'Résolution grille', '', 5, 51, 2)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sol</div>
          {slider('E', 'E (homogène)', 'kPa', 1000, 100000, 1000)}
          {slider('nu', 'ν (Poisson)', '', 0.1, 0.5, 0.05)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Couches (h×E×ν ; ...)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.layers} onChange={e => setTxt({ ...txt, layers: e.target.value })}
              placeholder="10x20000x0.3" />
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Coupe — charge rectangulaire + bulbe de contrainte Δσ/q" vbW={600} vbH={280}>
              {res && (() => {
                const ox = 70, oy = 30, w = 460, h = 220;
                const zMax = inp.z_max;
                const bScale = w * 0.3;
                const loadW = Math.min(bScale, w * 0.4);
                const loadX1 = ox + (w - loadW) / 2;
                const loadX2 = loadX1 + loadW;
                const groundY = oy + 15;

                const icMax = Math.max(...res.influence_center, 0.01);

                const bulbPts20 = res.depths.map((z, i) => {
                  const x = ox + (res.influence_center[i] / icMax) * w;
                  const y = groundY + (z / zMax) * h;
                  return [x, y] as [number, number];
                });
                const bulbPts10 = res.depths.map((z, i) => {
                  const x = ox + (res.influence_center[i] / icMax) * w;
                  const y = groundY + (z / zMax) * h;
                  return [x, y] as [number, number];
                });

                const bulbPath20 = bulbPts20.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
                const mirrorPath20 = bulbPts20.map((p, i) => {
                  const dx = p[0] - (ox + w / 2);
                  return `${i === 0 ? 'M' : 'L'}${ox + w / 2 - dx},${p[1]}`;
                }).join(' ');
                const fillPath20 = `${bulbPath20} L${ox + w / 2},${groundY + h} L${ox + w / 2},${groundY} Z`;

                const depthVals = Array.from({ length: 6 }, (_, i) => (zMax * i) / 5);
                const sigVals = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map(v => v * icMax);

                const z20y = groundY + (res.bulb_z_20 / zMax) * h;
                const z10y = groundY + (res.bulb_z_10 / zMax) * h;

                return (
                  <>
                    <line x1={ox} y1={groundY} x2={ox + w} y2={groundY} stroke="#64748B" strokeWidth={1.5} />
                    {Array.from({ length: 7 }, (_, i) => {
                      const y = groundY + (i / 6) * h;
                      return <line key={`grid-${i}`} x1={ox} y1={y} x2={ox + w} y2={y} stroke="#1E293B" strokeWidth={0.3} strokeDasharray="2,4" />;
                    })}

                    <rect x={loadX1} y={groundY - 18} width={loadW} height={18} fill="#EF4444" fillOpacity={0.7} stroke="#DC2626" strokeWidth={1} rx={2} />
                    <text x={(loadX1 + loadX2) / 2} y={groundY - 22} fontSize={9} fill="#FCA5A5" textAnchor="middle">{inp.q} kPa</text>
                    {Array.from({ length: 5 }, (_, i) => {
                      const x = loadX1 + (i / 4) * loadW;
                      return (
                        <g key={`arr-${i}`}>
                          <line x1={x} y1={groundY - 18} x2={x} y2={groundY - 2} stroke="#FCA5A5" strokeWidth={0.8} />
                          <polygon points={`${x - 2},${groundY - 4} ${x + 2},${groundY - 4} ${x},${groundY - 1}`} fill="#FCA5A5" />
                        </g>
                      );
                    })}

                    <path d={fillPath20} fill="#6366F1" fillOpacity={0.12} stroke="none" />

                    <path d={bulbPath20} fill="none" stroke="#6366F1" strokeWidth={1.8} />
                    <path d={mirrorPath20} fill="none" stroke="#6366F1" strokeWidth={1.8} strokeDasharray="4,3" />

                    <line x1={ox + 15} y1={z20y} x2={ox + w - 15} y2={z20y} stroke="#EF4444" strokeWidth={0.7} strokeDasharray="5,3" />
                    <text x={ox + w - 10} y={z20y - 3} fontSize={7.5} fill="#F87171" textAnchor="end">20% — z={res.bulb_z_20.toFixed(1)} m</text>
                    <line x1={ox + 15} y1={z10y} x2={ox + w - 15} y2={z10y} stroke="#F59E0B" strokeWidth={0.7} strokeDasharray="5,3" />
                    <text x={ox + w - 10} y={z10y - 3} fontSize={7.5} fill="#FBBF24" textAnchor="end">10% — z={res.bulb_z_10.toFixed(1)} m</text>

                    <line x1={ox + 8} y1={groundY} x2={ox + 8} y2={groundY + h} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={ox + 4} y1={groundY} x2={ox + 12} y2={groundY} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={ox + 4} y1={groundY + h} x2={ox + 12} y2={groundY + h} stroke="#94A3B8" strokeWidth={0.8} />
                    <text x={ox - 2} y={(groundY + groundY + h) / 2 + 3} fontSize={8} fill="#CBD5E1" textAnchor="end" transform={`rotate(-90, ${ox - 2}, ${(groundY + groundY + h) / 2})`}>z (m)</text>
                    {depthVals.map((z, i) => {
                      const y = groundY + (z / zMax) * h;
                      return <text key={`dz-${i}`} x={ox + 16} y={y + 3} fontSize={7} fill="#94A3B8">{z.toFixed(1)}</text>;
                    })}

                    <line x1={ox} y1={groundY + 4} x2={ox + 80} y2={groundY + 4} stroke="#6366F1" strokeWidth={1.8} />
                    <text x={ox + 85} y={groundY + 7} fontSize={7.5} fill="#818CF8">Δσ/q centre</text>
                    <line x1={ox} y1={groundY + 16} x2={ox + 80} y2={groundY + 16} stroke="#6366F1" strokeWidth={1.8} strokeDasharray="4,3" />
                    <text x={ox + 85} y={groundY + 19} fontSize={7.5} fill="#818CF8">Δσ/q coin (sym.)</text>

                    <line x1={ox + loadX1 / 2} y1={groundY - 30} x2={loadX1} y2={groundY - 30} stroke="#94A3B8" strokeWidth={0.5} />
                    <line x1={loadX1 / 2} y1={groundY - 34} x2={loadX1 / 2} y2={groundY - 26} stroke="#94A3B8" strokeWidth={0.5} />
                    <line x1={loadX1} y1={groundY - 34} x2={loadX1} y2={groundY - 26} stroke="#94A3B8" strokeWidth={0.5} />
                    <text x={(loadX1 / 2 + loadX1) / 2} y={groundY - 36} fontSize={7.5} fill="#CBD5E1" textAnchor="middle">B={inp.B} m</text>
                  </>
                );
              })()}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Profil de tassement cumulé s(z) au centre" vbW={600} vbH={200}>
              {res && (() => {
                const ox = 70, oy = 20, w = 460, h = 155;
                const zMax = inp.z_max;
                const sMax = Math.max(...res.settlement_profile, 0.001);
                const pts: [number, number][] = res.depths.map((z, i) => [
                  ox + (res.settlement_profile[i] / sMax) * w,
                  oy + (z / zMax) * h,
                ]);
                const fillPath = `M${ox},${oy} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${ox},${oy + h} Z`;
                const depthVals = Array.from({ length: 6 }, (_, i) => (zMax * i) / 5);
                const sVals = Array.from({ length: 5 }, (_, i) => (sMax * i) / 4);
                return (
                  <>
                    <path d={fillPath} fill="#10B981" fillOpacity={0.1} stroke="none" />
                    <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke="#10B981" strokeWidth={2} />
                    <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill="#10B981" />
                    <text x={pts[pts.length - 1][0] + 5} y={pts[pts.length - 1][1] + 3} fontSize={8} fill="#6EE7B7">
                      s = {(res.settlement_total * 1000).toFixed(1)} mm
                    </text>
                    <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94A3B8" strokeWidth={0.8} />
                    {depthVals.map((z, i) => {
                      const y = oy + (z / zMax) * h;
                      return <text key={`dz-${i}`} x={ox - 5} y={y + 3} fontSize={7} fill="#94A3B8" textAnchor="end">{z.toFixed(1)}</text>;
                    })}
                    {sVals.map((s, i) => {
                      const x = ox + (s / sMax) * w;
                      return <text key={`ds-${i}`} x={x} y={oy + h + 12} fontSize={7} fill="#94A3B8" textAnchor="middle">{(s * 1000).toFixed(0)}</text>;
                    })}
                    <text x={ox - 5} y={(oy + oy + h) / 2} fontSize={7} fill="#CBD5E1" textAnchor="end" transform={`rotate(-90, ${ox - 5}, ${(oy + oy + h) / 2})`}>z (m)</text>
                    <text x={ox + w / 2} y={oy + h + 22} fontSize={7} fill="#CBD5E1" textAnchor="middle">s (mm)</text>
                    <InlineLegend items={[{ label: `s_total = ${(res.settlement_total * 1000).toFixed(1)} mm`, color: '#10B981' }]} x={ox + w - 180} y={oy + 5} />
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
                  ['s_total', `${(res.settlement_total * 1000).toFixed(1)} mm`],
                  ['z(20%)', `${res.bulb_z_20.toFixed(2)} m`],
                  ['z(10%)', `${res.bulb_z_10.toFixed(2)} m`],
                  ['σ centre s.', `${res.stress_center[0].toFixed(1)} kPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Bulbe de Boussinesq"
                latex={String.raw`\Delta\sigma_z = q \cdot I_F \quad s = \sum \frac{\Delta\sigma_z \cdot h}{E_{oed}}`}
                description="Facteur de Fadum (coin ×4 pour le centre) + intégration oédémétrique"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: 'q', meaning: 'Pression uniforme', value: inp.q, unit: 'kPa' },
                  { symbol: 'I₀', meaning: 'Facteur centre', value: res.influence_center[0].toFixed(3), unit: '' },
                  { symbol: 's', meaning: 'Tassement total', value: (res.settlement_total * 1000).toFixed(1), unit: 'mm' },
                  { symbol: 'z₁₀%', meaning: 'Profondeur bulbe 10%', value: res.bulb_z_10.toFixed(2), unit: 'm' },
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
