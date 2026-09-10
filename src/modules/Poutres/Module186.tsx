import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { BoussinesqGrilleInputs, BoussinesqGrilleOutput, SoilLayer186 } from '../../types/engineering';

export default function Module186() {
  const [inp, setInp] = useState<BoussinesqGrilleInputs>({
    B: 2, L: 3, q: 150, E: 20000, nu: 0.3, z_max: 10, n_depth: 50, z_grid: 2, grid_n: 21,
    layers: [{ h: 10, E: 20000, nu: 0.3 }],
  });
  const [txt, setTxt] = useState({ layers: '10x20000x0.3' });

  const parseLayers = (s: string): SoilLayer186[] =>
    s.split(';').map(v => v.trim().split(/x|\*/).map(Number)).filter(a => a.length === 3 && a.every(v => !isNaN(v)))
      .map(a => ({ h: a[0], E: a[1], nu: a[2] }));
  const parsed = parseLayers(txt.layers);
  const payload: BoussinesqGrilleInputs = {
    ...inp, layers: parsed.length > 0 ? parsed : inp.layers,
  };
  const { data: res, error: err, live } = useModuleCalc<BoussinesqGrilleInputs, BoussinesqGrilleOutput>(
    'calculate_boussinesq_grille_186', payload,
  );
  const S = (k: keyof BoussinesqGrilleInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BoussinesqGrilleInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const chartPts = (xs: number[], ys: number[], W: number, H: number, pad: number): [number, number][] => {
    if (xs.length === 0) return [];
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const span = ymax - ymin > 1e-12 ? ymax - ymin : 1;
    const xmax = Math.max(...xs, 1e-9);
    return xs.map((x, i) => (
      [pad + (x / xmax) * (W - 2 * pad),
       H - pad - ((ys[i] - ymin) / span) * (H - 2 * pad)] as [number, number]
    ));
  };

  return (
    <Workstation
      title="186 Boussinesq Grille (bulbe de contrainte)"
      subtitle="Complément du 125 : facteurs d'influence Fadum/Newmark sous charge rectangulaire + profil de tassement — RUST"
      eurocode="EC7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charge rectangulaire</div>
          {slider('B', 'B', 'm', 0.5, 10, 0.5)}
          {slider('L', 'L', 'm', 0.5, 10, 0.5)}
          {slider('q', 'q', 'kPa', 0, 500, 10)}
          {slider('z_max', 'z_max', 'm', 1, 30, 1)}
          {slider('z_grid', 'z_grille plan', 'm', 0.5, 10, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sol</div>
          {slider('E', 'E', 'kPa', 1000, 100000, 1000)}
          {slider('nu', 'nu', '', 0.1, 0.5, 0.05)}
          {slider('n_depth', 'n_profondeur', '', 10, 200, 1)}
          {slider('grid_n', 'grille n', '', 5, 51, 1)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Couches (h x E x nu ; ...)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.layers} onChange={e => setTxt({ ...txt, layers: e.target.value })} />
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Bulbe de contrainte Δσ(z) — centre (bleu) vs coin (orange)" vbW={600} vbH={200}>
              {res && (
                <>
                  <DiagramOverlay type="moment" points={chartPts(res.depths, res.stress_center, 600, 200, 30)} color="#6366F1" />
                  <DiagramOverlay type="moment" points={chartPts(res.depths, res.stress_corner, 600, 200, 30)} color="#F59E0B" />
                </>
              )}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Tassement cumulé s(z)" vbW={600} vbH={200}>
              {res && (
                <DiagramOverlay type="deflection" points={chartPts(res.depths, res.settlement_profile, 600, 200, 30)} color="#10B981" />
              )}
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
                  ['s_total', `${(res.settlement_total * 1000).toFixed(1)} mm`],
                  ['z(20%)', `${res.bulb_z_20.toFixed(2)} m`],
                  ['z(10%)', `${res.bulb_z_10.toFixed(2)} m`],
                  ['σ centre surf.', `${res.stress_center[0].toFixed(1)} kPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Bulbe de Boussinesq"
                latex={String.raw`\Delta\sigma_z = q \cdot I_\sigma \quad s = \sum \frac{\Delta\sigma_z h}{E'}`}
                description="Facteurs de Fadum/Newmark"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`q`, meaning: 'Contrainte appliquée', value: inp.q, unit: 'kPa' },
                  { symbol: String.raw`s`, meaning: 'Tassement', value: (res.settlement_total * 1000).toFixed(1), unit: 'mm' },
                  { symbol: String.raw`z_{10\%}`, meaning: 'Profondeur bulbe', value: res.bulb_z_10.toFixed(2), unit: 'm' },
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
