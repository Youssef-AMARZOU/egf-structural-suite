import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { DalldiffinInputs, DalldiffinOutput } from '../../types/engineering';

export default function Module176() {
  const [inp, setInp] = useState<DalldiffinInputs>({
    n: 6, h: 1.0, k_val: 1.0, GD: 50000, nu: 0.2,
    p: Array.from({ length: 10 }, () => Array(10).fill(10.0)),
    kn: 1, kw: 1, ke: 1, ks: 1, niter: 100,
  });
  const { data: res, error: err, live } = useModuleCalc<DalldiffinInputs, DalldiffinOutput>(
    'calculate_dalldiffin_176', inp,
  );
  const S = (k: keyof DalldiffinInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalldiffinInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 30;
  const sz = 400 / inp.n;

  return (
    <Workstation
      title="176 Dalldiffin"
      subtitle="Flèche dalle par différences finies (PL/1958) — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Grille & Matériaux</div>
          <ParamSlider label="n (mailles)" unit="" value={inp.n} min={2} max={20} step={1} onChange={v => setInp({ ...inp, n: Math.max(2, Math.min(20, Math.round(v))) })} />
          {slider('h', 'h (pas x)', 'm', 0.2, 5, 0.1)}
          {slider('k_val', 'k (pas y)', 'm', 0.2, 5, 0.1)}
          {slider('GD', 'GD', 'kN·m', 1000, 200000, 1000)}
          {slider('nu', 'ν', '', 0.05, 0.4, 0.01)}
          {slider('niter', 'Itérations', '', 10, 1000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Conditions aux bords (-1=libre, 1=articulé, 0=encastré)</div>
          {slider('kn', 'kn (Nord)', '', -1, 1, 1)}
          {slider('kw', 'kw (Ouest)', '', -1, 1, 1)}
          {slider('ke', 'ke (Est)', '', -1, 1, 1)}
          {slider('ks', 'ks (Sud)', '', -1, 1, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charge (kN/m²) — taille fixe 10×10</div>
          <ParamSlider label="p uniforme" unit="kN/m²" value={inp.p[0][0]} min={0} max={100} step={1} onChange={v => {
            const pp = Array.from({ length: 10 }, () => Array(10).fill(v));
            setInp({ ...inp, p: pp });
          }} />
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Flèche z(i,j)" vbW={500} vbH={500}>
            {res && (() => {
              const n = inp.n;
              const allZ = res.z.flat().filter((_, i) => i > 0);
              const maxZ = Math.max(...allZ.map(z => Math.abs(z)), 0.001);
              return (
                <>
                  {res.z.slice(2, n + 2).map((row, i) =>
                    row.slice(2, n + 2).map((val, j) => {
                      const norm = val / maxZ;
                      const r = norm > 0 ? Math.min(255, norm * 255) : 0;
                      const b = norm < 0 ? Math.min(255, -norm * 255) : 0;
                      return (
                        <rect key={`${i}-${j}`}
                          x={ox + j * sz} y={oy + i * sz}
                          width={sz} height={sz}
                          fill={`rgb(${r},${Math.min(100, Math.abs(norm) * 100)},${b})`}
                          stroke="#ccc" strokeWidth={0.5} />
                      );
                    })
                  )}
                  <text x={ox + 200} y={oy + n * sz + 20} fontSize={10} fill="#666" textAnchor="middle">
                    δ_max = {(res.max_deflection * 1000).toFixed(2)} mm
                  </text>
                </>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">δ_max</div>
                  <div className="font-bold">{(res.max_deflection * 1000).toFixed(2)} mm</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">Mailles</div>
                  <div className="font-bold">{inp.n} × {inp.n}</div>
                </div>
              </div>
              <FormulaCard
                title="Tassement différentiel dalle"
                latex={String.raw`D\nabla^4 w = q`}
                description="Différences finies, 5 cas limites"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`D`, meaning: 'Rigidité', value: inp.GD, unit: 'kN·m' },
                  { symbol: String.raw`w_{max}`, meaning: 'Flèche max', value: (res.max_deflection * 1000).toFixed(2), unit: 'mm' },
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
