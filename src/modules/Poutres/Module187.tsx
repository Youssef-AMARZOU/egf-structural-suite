import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { BoussinesqDtuInputs, BoussinesqDtuOutput, LoadedRect187 } from '../../types/engineering';

export default function Module187() {
  const [inp, setInp] = useState<BoussinesqDtuInputs>({
    rects: [{ x1: 0, y1: 0, a: 2, b: 3, Gp: 900 }],
    x: 0, y: 0, z_max: 10, n_depth: 50,
  });
  const [txt, setTxt] = useState({ rects: '0,0,2,3,900' });

  const parseRects = (s: string): LoadedRect187[] =>
    s.split(';').map(v => v.trim().split(',').map(Number)).filter(a => a.length === 5 && a.every(v => !isNaN(v)))
      .map(a => ({ x1: a[0], y1: a[1], a: a[2], b: a[3], Gp: a[4] }));
  const parsed = parseRects(txt.rects);
  const payload: BoussinesqDtuInputs = {
    ...inp, rects: parsed.length > 0 ? parsed : inp.rects,
  };
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
      title="187 Boussinesq DTU (contrainte en un point)"
      subtitle="Compagnon « contraintes » du 107 : Δσ(x,y,z) sous charges rectangulaires — coin / centre / point quelconque — RUST"
      eurocode="EC7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Rectangles (x1,y1,a,b,Gp ; ...)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.rects} onChange={e => setTxt({ ...txt, rects: e.target.value })} />
            <p className="text-[11px] text-slate-400 mt-1">Gp en kN (charge totale), a/b en m, centre en (x1,y1)</p>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Point de calcul</div>
          {slider('x', 'x', 'm', -10, 10, 0.5)}
          {slider('y', 'y', 'm', -10, 10, 0.5)}
          {slider('z_max', 'z_max', 'm', 1, 30, 1)}
          {slider('n_depth', 'n_profondeur', '', 10, 200, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Contrainte verticale Δσ(z) au point (x, y)" vbW={600} vbH={200}>
            {res && (
              <DiagramOverlay type="moment" points={chartPts(res.depths, res.stress, 600, 200, 30)} />
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
                  ['σ_max profil', `${res.sigma_max.toFixed(2)} kPa`],
                  ['σ surface', `${res.sigma_surf.toFixed(2)} kPa`],
                  ['z_ref', `${res.z_ref.toFixed(2)} m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Diffusion Boussinesq"
                latex={String.raw`\Delta\sigma_z(x,y,z) = \sum \pm \sigma_{coin}`}
                description="Superposition des 4 coins"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\sigma_{coin}`, meaning: 'Coin de Newmark', value: res.sigma_max.toFixed(2), unit: 'kPa' },
                  { symbol: String.raw`z_{ref}`, meaning: 'Profondeur réf.', value: res.z_ref.toFixed(2), unit: 'm' },
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
