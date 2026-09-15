import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup, rowBars } from '../../components/drafting';
import { PourcentageMiniNonFragiliteInputs, PourcentageMiniNonFragiliteOutput } from '../../types/engineering';

const BAR_PHI = 20;

export default function Module159() {
  const [inp, setInp] = useState<PourcentageMiniNonFragiliteInputs>({
    b: 1000, h: 500, fck: 30, fyk: 500, gc: 1.5, gs: 1.15, rho_l: 0.005, n_layers: 2, layer_positions: [50, 450],
  });
  const { data: res, error: err, live } = useModuleCalc<PourcentageMiniNonFragiliteInputs, PourcentageMiniNonFragiliteOutput>(
    'calculate_pourcentage_mini_non_fragilite_section_159', inp,
  );
  const S = (k: keyof PourcentageMiniNonFragiliteInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.is_ductile ? 'pass' : 'fail';

  const slider = (
    key: keyof PourcentageMiniNonFragiliteInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const k = Math.min(260 / inp.b, 200 / inp.h);
  const ox = 170, oy = 60;
  const W = inp.b * k;
  const H = inp.h * k;

  return (
    <Workstation
      title="159 Pourcentage mini non-fragilité"
      subtitle="BAEL §C3.3.4 / EC2 §9.2.1.1 — Vérification ductilité section arbitraire — RUST"
      eurocode="EC2 §9.2.1.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie section</div>
          {slider('b', 'Largeur b', 'mm', 200, 3000, 10)}
          {slider('h', 'Hauteur h', 'mm', 100, 1500, 10)}
          {slider('n_layers', 'Nombre de lits', '', 1, 10, 1)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Positions des lits (mm, séparées par virgule)</label>
            <input type="text" value={inp.layer_positions.join(', ')}
              onChange={e => {
                const vals = e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                setInp({ ...inp, layer_positions: vals });
              }}
              className="w-full border rounded px-2 py-1.5 text-sm font-mono dark:bg-white/5 dark:border-white/15" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {slider('rho_l', 'ρ longitudinal', '', 0, 0.05, 0.0005)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section + lits d'armatures" vbW={600} vbH={320} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
            <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
            <RebarGroup
              bars={inp.layer_positions.flatMap((pos) =>
                rowBars(3, ox + 14, ox + W - 14, oy + pos * k, BAR_PHI)
              )}
              pxPerMm={k}
            />
            <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} text={`b = ${inp.b}`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`h = ${inp.h}`} />
            {res && (
              <text x={ox + W / 2} y={oy + H + 44} textAnchor="middle" fontSize={11} fill={res.is_ductile ? '#22c55e' : '#ef4444'} fontWeight="bold">
                ρmin = {(res.rho_min * 100).toFixed(3)}% — As,min = {res.as_min.toFixed(0)} mm²/m
              </text>
            )}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['ρ_min', `${(res.rho_min * 100).toFixed(3)} %`],
                  ['As_min', `${res.as_min.toFixed(1)} mm²/m`],
                  ['x/d', res.xd_ratio.toFixed(3)],
                  ['x/d limite', res.xd_limit.toFixed(2)],
                  ['εs', `${(res.eps_s * 1000).toFixed(3)} ‰`],
                  ['εy', `${(res.eps_y * 1000).toFixed(3)} ‰`],
                  ['Utilisation', `${(res.utilisation * 100).toFixed(1)} %`],
                  ['Ductile?', res.is_ductile ? 'Oui' : 'Non'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Aciers minimaux ductilité"
                latex={String.raw`A_{s,min} = 0.26\frac{f_{ctm}}{f_{yk}} b_t d \ge 0.0013 b_t d`}
                description="EC2 §9.2.1.1 / BAEL C3.3.4"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`A_{s,min}`, meaning: 'Section minimale', value: res.as_min.toFixed(1), unit: 'mm²/m' },
                  { symbol: String.raw`\rho_{min}`, meaning: 'Ratio minimal', value: (res.rho_min * 100).toFixed(3), unit: '%' },
                  { symbol: String.raw`x/d`, meaning: 'Axe neutre réduit', value: res.xd_ratio.toFixed(3) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.is_ductile ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {!res.is_ductile && <li className="font-mono text-red-500">ATTENTION : section non ductile — augmenter le ferraillage</li>}
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
