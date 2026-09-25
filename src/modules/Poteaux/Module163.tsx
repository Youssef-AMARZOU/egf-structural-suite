import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PourcentageMiniNonFragiliteSectQQInputs, PourcentageMiniNonFragiliteSectQQOutput } from '../../types/engineering';

export default function Module163() {
  const [inp, setInp] = useState<PourcentageMiniNonFragiliteSectQQInputs>({
    trapezes: [{ b1: 300, b2: 300, h: 500 }],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15, xd_limit: 0.45,
  });
  const { data: res, error: err, live } = useModuleCalc<PourcentageMiniNonFragiliteSectQQInputs, PourcentageMiniNonFragiliteSectQQOutput>(
    'calculate_pourcentage_mini_non_fragilite_sect_qq_163', inp,
  );
  const S = (k: keyof PourcentageMiniNonFragiliteSectQQInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const addTrapeze = () => setInp({ ...inp, trapezes: [...inp.trapezes, { b1: 300, b2: 300, h: 200 }] });
  const removeTrapeze = (i: number) => setInp({ ...inp, trapezes: inp.trapezes.filter((_, j) => j !== i) });
  const updateTrapeze = (i: number, field: string, v: number) => {
    const t = [...inp.trapezes];
    (t[i] as any)[field] = v;
    setInp({ ...inp, trapezes: t });
  };

  const status = err ? 'fail' : !res ? 'computing' : res.is_ductile ? 'pass' : 'fail';

  const slider = (
    key: keyof PourcentageMiniNonFragiliteSectQQInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const barW = 400, barH = 30, ox = 50, oy = 25;

  return (
    <Workstation
      title="163 Pourcentage mini non fragilité section QQ"
      subtitle="Armature minimum non-fragilité — section arbitraire (BAEL §C3.3.4 / EC2 §9.2.1.1) — RUST"
      eurocode="EC2 §9.2.1.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie — Trapèzes</div>
          {inp.trapezes.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Trapèze {i + 1}</span>
                {inp.trapezes.length > 1 && (
                  <button onClick={() => removeTrapeze(i)} className="text-red-500 text-xs">✕</button>
                )}
              </div>
              <ParamSlider label="b1" unit="mm" value={t.b1} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'b1', v)} />
              <ParamSlider label="b2" unit="mm" value={t.b2} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'b2', v)} />
              <ParamSlider label="h" unit="mm" value={t.h} min={50} max={2000} step={10} onChange={v => updateTrapeze(i, 'h', v)} />
            </div>
          ))}
          <button onClick={addTrapeze} className="text-blue-600 text-sm mt-1">+ Ajouter trapèze</button>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & Critère</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {slider('xd_limit', 'Limite x/d', '', 0.2, 0.8, 0.05)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Vérification x/d" vbW={500} vbH={80}>
            {res && (() => {
              const limitX = ox + barW * inp.xd_limit;
              const ratioX = ox + barW * Math.min(res.xd_ratio, 1.0);
              return (
                <>
                  <rect x={ox} y={oy} width={barW} height={barH} fill="#f3f4f6" stroke="#d1d5db" rx={4} />
                  <rect x={ox} y={oy} width={Math.max(0, ratioX - ox)} height={barH}
                    fill={res.is_ductile ? '#22C55E' : '#EF4444'} rx={4} opacity={0.6} />
                  <line x1={limitX} y1={oy - 5} x2={limitX} y2={oy + barH + 5} stroke="#F59E0B" strokeWidth={2} />
                  <text x={limitX} y={oy - 8} fontSize={10} fill="#F59E0B" textAnchor="middle">
                    x/d = {inp.xd_limit}
                  </text>
                  <text x={ratioX} y={oy + barH + 18} fontSize={10} fill="#374151" textAnchor="middle">
                    {res.xd_ratio.toFixed(3)}
                  </text>
                  <text x={ox} y={oy - 8} fontSize={9} fill="#94A3B8">0</text>
                  <text x={ox + barW} y={oy - 8} fontSize={9} fill="#94A3B8">1.0</text>
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
                {[
                  ['h totale', `${res.ht.toFixed(0)} mm`],
                  ['Ac', `${res.area.toFixed(0)} mm²`],
                  ['ρ_min', res.rho_min.toFixed(4)],
                  ['As_min', `${res.as_min.toFixed(0)} mm²/m`],
                  ['x/d', res.xd_ratio.toFixed(3)],
                  ['εs', res.eps_s.toFixed(5)],
                  ['εy', res.eps_y.toFixed(5)],
                  ['Ductile', res.is_ductile ? 'OUI' : 'NON'],
                ].map(([l, v]) => (
                  <div key={l} className={`bg-slate-50 dark:bg-white/5 rounded p-2 ${l === 'Ductile' ? (res.is_ductile ? 'text-green-600' : 'text-red-600') : ''}`}>
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Non-fragilité v2"
                latex={String.raw`M_{cr} \le M_{Rd}(A_{s,min})`}
                description="P-R / Sargin, dichotomie"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\rho_{min}`, meaning: 'Ratio minimal', value: res.rho_min.toFixed(4) },
                  { symbol: String.raw`A_{s,min}`, meaning: 'Section minimale', value: res.as_min.toFixed(0), unit: 'mm²/m' },
                  { symbol: String.raw`x/d`, meaning: 'Axe neutre réduit', value: res.xd_ratio.toFixed(3) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.is_ductile ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {!res.is_ductile && <li className="font-mono text-red-500">ATTENTION : section non ductile — augmenter As</li>}
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
