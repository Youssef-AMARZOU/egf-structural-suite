import { useState } from 'react';
import type { PoteauFlambementRectInputs, PoteauFlambementRectOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';

const DEFAULT: PoteauFlambementRectInputs = {
  b: 300, h: 500, L0: 4.5, e0: 25, NEd: 1500, fck: 30, fyk: 500, As: 2000, cover: 30, phi: 2.0,
};

export default function Module102() {
  const [inp, setInp] = useState<PoteauFlambementRectInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PoteauFlambementRectInputs, PoteauFlambementRectOutput>(
    'calculate_poteau_flambement_rect_102', inp,
  );
  const S = (k: keyof PoteauFlambementRectInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const slider = (
    key: keyof PoteauFlambementRectInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ok = res ? res.ratio <= 1.0 : false;
  const status = err ? 'fail' : !res ? 'computing' : res.ratio <= 1.0 ? 'pass' : 'fail';

  // ---- N-M curve points mapped to px ----
  const curve = (() => {
    if (!res || res.N_curve.length === 0) return null;
    const maxN = Math.max(...res.N_curve, 1);
    const maxM = Math.max(...res.M_curve, 1);
    const pts: [number, number][] = res.N_curve.map((n, i) => [
      60 + (res.M_curve[i] / maxM) * 460,
      220 - (n / maxN) * 190,
    ]);
    return {
      pts,
      edX: 60 + (res.MEd / maxM) * 460,
      edY: 220 - (inp.NEd / maxN) * 190,
    };
  })();

  return (
    <Workstation
      title="Module 102 — Poteau Flambement Rectangulaire"
      subtitle="Poteau rectangulaire, rigidité nominale EC2 §5.8.7 + courbe N-M"
      eurocode="EC2 §5.8.7"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'Largeur b', 'mm', 100, 1000, 10)}
          {slider('h', 'Hauteur h', 'mm', 200, 1200, 10)}
          {slider('As', 'As (2 lits)', 'mm²', 0, 8000, 50)}
          {slider('cover', 'Enrobage', 'mm', 10, 100, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations & matériaux</div>
          {slider('L0', 'L0', 'm', 1, 12, 0.1)}
          {slider('e0', 'e0', 'mm', 0, 200, 1)}
          {slider('NEd', 'NEd', 'kN', 0, 8000, 10)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('phi', 'φef (fluage)', '-', 0, 4, 0.1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Courbe d'interaction N-M" vbW={600} vbH={240}>
            <line x1={60} y1={10} x2={60} y2={220} stroke="#64748B" strokeWidth={1} />
            <line x1={60} y1={220} x2={560} y2={220} stroke="#64748B" strokeWidth={1} />
            <text x={14} y={120} fontSize={9} fill="#94A3B8" textAnchor="middle" transform="rotate(-90 14 120)">N (kN)</text>
            {curve ? (
              <>
                <DiagramOverlay type="moment" points={curve.pts} color="#6366F1" />
                <circle cx={curve.edX} cy={curve.edY} r={6} fill={ok ? '#22C55E' : '#EF4444'} />
              </>
            ) : (
              <text x={300} y={120} fontSize={12} fill="#94A3B8" textAnchor="middle">Pas de courbe</text>
            )}
            {(() => {
              const maxN = res ? Math.max(...res.N_curve, 1) : 1;
              const maxM = res ? Math.max(...res.M_curve, 1) : 1;
              return (
                <>
                  <AxisTicks
                    values={[0, maxM / 2, maxM]}
                    map={(v) => [60 + (v / maxM) * 460, 220]}
                    unit="kN·m"
                    side="below"
                  />
                  <AxisTicks
                    values={[0, maxN / 2, maxN]}
                    map={(v) => [60, 220 - (v / maxN) * 190]}
                    unit="kN"
                    side="left"
                  />
                </>
              );
            })()}
            <text x={310} y={235} fontSize={9} fill="#94A3B8" textAnchor="middle">M (kN·m)</text>
            <InlineLegend
              items={[
                { label: 'Courbe N-M', color: '#6366F1' },
                { label: '(MEd, NEd)', color: ok ? '#22C55E' : '#EF4444' },
              ]}
              x={440}
              y={15}
            />
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['λ / λ_lim', `${res.lambda.toFixed(1)} / ${res.lambda_lim.toFixed(1)}`],
                  ['MEd', `${res.MEd.toFixed(1)} kN·m`],
                  ['Nb', `${res.Nb.toFixed(0)} kN`],
                  ['ratio', res.ratio.toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Rigidité nominale (EC2 §5.8.7)"
                latex={String.raw`M_{Ed} = M_{0Ed} \left(1 + \frac{\beta}{N_B / N_{Ed} - 1}\right)`}
                description="Amplification du moment du second ordre"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_B`, meaning: 'Charge critique de flambement’, value: res.Nb.toFixed(0), unit: ’kN' },
                  { symbol: String.raw`M_{Ed}`, meaning: 'Moment amplifié’, value: res.MEd.toFixed(1), unit: ’kN·m' },
                  { symbol: String.raw`N_{Ed}/N_B`, meaning: 'Taux de chargement', value: res.ratio.toFixed(3) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${ok ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              {res.diag.length > 0 && (
                <ul className="text-xs space-y-1">
                  {res.diag.map((line, i) => (
                    <li key={i} className="font-mono text-slate-600 dark:text-slate-400">{line}</li>
                  ))}
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
