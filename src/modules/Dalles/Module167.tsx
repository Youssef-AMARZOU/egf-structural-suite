import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { BaelBaBpFlecheDalleContinueInputs, BaelBaBpFlecheDalleContinueOutput } from '../../types/engineering';

export default function Module167() {
  const [inp, setInp] = useState<BaelBaBpFlecheDalleContinueInputs>({
    L: 6.0, b: 1000, h: 200, d: 170, dp: 30,
    E: 30000, n_mod: 15, Ac: 600, Acp: 0,
    loads: [{ p1: 0.01, p2: 0.01, a: 0, lb: 6.0 }],
    kr: 0.5,
  });
  const { data: res, error: err, live } = useModuleCalc<BaelBaBpFlecheDalleContinueInputs, BaelBaBpFlecheDalleContinueOutput>(
    'calculate_bael_ba_bp_fleche_dalle_continue_167', inp,
  );
  const S = (k: keyof BaelBaBpFlecheDalleContinueInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addLoad = () => setInp({ ...inp, loads: [...inp.loads, { p1: 0.005, p2: 0.005, a: 1, lb: 2 }] });
  const removeLoad = (i: number) => setInp({ ...inp, loads: inp.loads.filter((_, j) => j !== i) });
  const updateLoad = (i: number, field: string, v: number) => {
    const l = [...inp.loads];
    (l[i] as any)[field] = v;
    setInp({ ...inp, loads: l });
  };

  const status = !res ? 'computing' : res.ratio > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BaelBaBpFlecheDalleContinueInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const deflPts: [number, number][] = res && res.deflections.length > 1
    ? res.deflections.map((d, i) => (
      [50 + (i / (res.deflections.length - 1)) * 400, 50 + d * (80 / (res.max_deflection || 1))] as [number, number]
    )) : [];

  return (
    <Workstation
      title="167 Bael ba bp fleche dalle continue"
      subtitle="Vérification flèche dalle continue (BAEL/BA) — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('L', 'L', 'm', 1, 15, 0.5)}
          {slider('b', 'b', 'mm', 200, 2000, 10)}
          {slider('h', 'h', 'mm', 50, 600, 10)}
          {slider('d', 'd', 'mm', 50, 550, 10)}
          {slider('dp', 'dp', 'mm', 10, 100, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('E', 'E', 'MPa', 10000, 60000, 1000)}
          {slider('n_mod', 'n', '', 5, 30, 1)}
          {slider('Ac', 'Ac', 'mm²/m', 0, 3000, 10)}
          {slider('Acp', 'Acp', 'mm²/m', 0, 3000, 10)}
          {slider('kr', 'kr', '', 0, 1, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges trapézoïdales (MN/m²)</div>
          {inp.loads.map((lc, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Charge {i + 1}</span>
                {inp.loads.length > 1 && (
                  <button onClick={() => removeLoad(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="p1" unit="MN/m²" value={lc.p1} min={0} max={0.05} step={0.001} onChange={v => updateLoad(i, 'p1', v)} />
              <ParamSlider label="p2" unit="MN/m²" value={lc.p2} min={0} max={0.05} step={0.001} onChange={v => updateLoad(i, 'p2', v)} />
              <ParamSlider label="a" unit="m" value={lc.a} min={0} max={15} step={0.5} onChange={v => updateLoad(i, 'a', v)} />
              <ParamSlider label="b" unit="m" value={lc.lb} min={0.5} max={15} step={0.5} onChange={v => updateLoad(i, 'lb', v)} />
            </div>
          ))}
          <button onClick={addLoad} className="text-blue-600 text-sm mt-1">+ Ajouter charge</button>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Flèche" vbW={500} vbH={150}>
            <line x1={50} y1={50} x2={450} y2={50} stroke="#94A3B8" strokeWidth={2} />
            <line x1={50} y1={130} x2={450} y2={130} stroke="#ddd" strokeWidth={0.5} />
            {res && res.deflections.length > 1 && (
              <DiagramOverlay type="deflection" points={deflPts} />
            )}
            {res && (
              <>
                <line x1={50} y1={50 + res.fleche_admis * (80 / (res.max_deflection || 1))} x2={450} y2={50 + res.fleche_admis * (80 / (res.max_deflection || 1))}
                  stroke="#EF4444" strokeWidth={1} strokeDasharray="4,4" />
                <text x={455} y={50 + res.fleche_admis * (80 / (res.max_deflection || 1)) + 4} fontSize={9} fill="#EF4444">
                  δ_adm = {res.fleche_admis.toFixed(1)} mm
                </text>
                <text x={250} y={145} fontSize={10} fill="#999" textAnchor="middle">
                  x (m) — δ_max = {res.max_deflection.toFixed(2)} mm
                </text>
              </>
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
                  ['M_max', `${res.max_moment.toFixed(2)} kN·m`],
                  ['δ_max', `${res.max_deflection.toFixed(2)} mm`],
                  ['δ_adm', `${res.fleche_admis.toFixed(2)} mm`],
                  ['Ratio', res.ratio.toFixed(2)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flèche dalle continue"
                latex={String.raw`f \le L/250`}
                description="Charges trapézoïdales, courbure"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f`, meaning: 'Flèche', value: res.max_deflection.toFixed(2), unit: 'mm' },
                  { symbol: String.raw`L`, meaning: 'Portée', value: inp.L, unit: 'm' },
                  { symbol: String.raw`f_{adm}`, meaning: 'Flèche adm.', value: res.fleche_admis.toFixed(2), unit: 'mm' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
