import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup, rowBars, DiagramOverlay } from '../../components/drafting';
import { VoileVerifFcInputs, VoileVerifFcOutput } from '../../types/engineering';

export default function Module191() {
  const [inp, setInp] = useState<VoileVerifFcInputs>({
    Lw: 3, t: 0.2, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    n_bars: 12, phi_dist: 12, A_end: 12.56, cover: 0.03,
    N_ed: 2500, M_ed: 1800, n_pts: 60,
  });
  const { data: res, error: err, live } = useModuleCalc<VoileVerifFcInputs, VoileVerifFcOutput>(
    'calculate_voile_verif_fc_191', inp,
  );
  const S = (k: keyof VoileVerifFcInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof VoileVerifFcInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const kw = 400;
  const kx = kw / (inp.Lw * 1000);
  const wOx = 100, wOy = 30, wH = 60;

  const nmPts: [number, number][] = res && res.curve_n.length > 0 ? (() => {
    const nmin = Math.min(...res.curve_n, inp.N_ed);
    const nmax = Math.max(...res.curve_n, inp.N_ed);
    const mmax = Math.max(...res.curve_m.map(Math.abs), Math.abs(inp.M_ed), 1) * 1.1;
    const X = (n: number) => 70 + ((n - nmin) / Math.max(nmax - nmin, 1e-9)) * 460;
    const Y = (m: number) => 160 - (m / mmax) * 130;
    const pts = res.curve_n.map((n, i) => [X(n), Y(res.curve_m[i])] as [number, number]);
    pts.push(pts[0]);
    return pts;
  })() : [];

  return (
    <Workstation
      title="191 Voile Vérification FC"
      subtitle="Courbe d'interaction N-M du voile (barres réparties + rives) par balayage des plans de déformation + point de calcul — RUST"
      eurocode="EC2 §9.6"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Voile & ferraillage</div>
          {slider('Lw', 'Lw', 'm', 1, 10, 0.5)}
          {slider('t', 't', 'm', 0.1, 0.6, 0.01)}
          {slider('n_bars', 'n_barres réparties', '', 4, 40, 1)}
          {slider('phi_dist', 'φ réparties', 'mm', 6, 32, 1)}
          {slider('A_end', 'A_rive (chaque)', 'cm²', 0, 50, 0.5)}
          {slider('cover', 'Enrobage', 'm', 0.01, 0.1, 0.005)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & sollicitations</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('N_ed', 'N_Ed (compr.+)', 'kN', 0, 10000, 100)}
          {slider('M_ed', 'M_Ed', 'kN.m', 0, 5000, 50)}
          {slider('n_pts', 'n_points courbe', '', 10, 200, 5)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Élévation voile + ferraillage" vbW={600} vbH={130} scaleLabel={`1 px ≈ ${(1 / kx).toFixed(1)} mm`}>
              <rect x={wOx} y={wOy} width={kw} height={wH} fill="#60a5fa" opacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
              <RebarGroup bars={rowBars(Math.round(inp.n_bars), wOx + 12, wOx + kw - 12, wOy + wH / 2, inp.phi_dist)} pxPerMm={kx} />
              <circle cx={wOx + 8} cy={wOy + wH / 2} r={6} fill="#F59E0B" stroke="#b45309" strokeWidth={1} />
              <circle cx={wOx + kw - 8} cy={wOy + wH / 2} r={6} fill="#F59E0B" stroke="#b45309" strokeWidth={1} />
              <DimensionLine x1={wOx} y1={wOy + wH} x2={wOx + kw} y2={wOy + wH} offset={18} text={`Lw = ${inp.Lw} m`} />
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Courbe d'interaction N-M + point de calcul (rouge)" vbW={600} vbH={320}>
              {res && res.curve_n.length > 0 && (() => {
                const nmin = Math.min(...res.curve_n, inp.N_ed);
                const nmax = Math.max(...res.curve_n, inp.N_ed);
                const mmax = Math.max(...res.curve_m.map(Math.abs), Math.abs(inp.M_ed), 1) * 1.1;
                const X = (n: number) => 70 + ((n - nmin) / Math.max(nmax - nmin, 1e-9)) * 460;
                const Y = (m: number) => 160 - (m / mmax) * 130;
                return (
                  <>
                    <line x1={70} y1={160} x2={530} y2={160} stroke="#999" strokeWidth={1} />
                    <line x1={X(0)} y1={20} x2={X(0)} y2={300} stroke="#999" strokeWidth={1} />
                    <DiagramOverlay type="moment" points={nmPts} />
                    <circle cx={X(inp.N_ed)} cy={Y(inp.M_ed)} r={6} fill="#EF4444" />
                    <text x={X(inp.N_ed) + 10} y={Y(inp.M_ed)} fontSize={10} fill="#EF4444">
                      ({inp.N_ed}, {inp.M_ed})
                    </text>
                    <text x={300} y={312} fontSize={10} fill="#94A3B8" textAnchor="middle">N (kN)</text>
                  </>
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
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['N_max', `${res.N_max.toFixed(0)} kN`],
                  ['M_max', `${res.M_max.toFixed(0)} kN.m`],
                  ['M_Rd(N_Ed)', `${res.Mrd_at_Ned.toFixed(0)} kN.m`],
                  ['Ratio', isFinite(res.ratio) ? res.ratio.toFixed(3) : '∞'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Voile en flexion composée"
                latex={String.raw`N_{Rd} = \int \sigma_c \, dA + \sum A_{si}\sigma_{si}`}
                description="Lits d'armatures répartis"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_{Ed}`, meaning: 'Effort normal', value: inp.N_ed, unit: 'kN' },
                  { symbol: String.raw`M_{Ed}`, meaning: 'Moment', value: inp.M_ed, unit: 'kN.m' },
                  { symbol: String.raw`M_{Rd}`, meaning: 'Moment résistant', value: res.Mrd_at_Ned.toFixed(0), unit: 'kN.m' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio <= 1 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                <li className={res.ratio <= 1 ? 'text-green-600' : 'text-red-600'}>
                  {res.ratio <= 1 ? '✓' : '✗'} Ratio = {isFinite(res.ratio) ? res.ratio.toFixed(3) : '∞'}
                </li>
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
