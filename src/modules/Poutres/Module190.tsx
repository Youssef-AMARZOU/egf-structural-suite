import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { ComparFlechesInputs, ComparFlechesOutput } from '../../types/engineering';

export default function Module190() {
  const [inp, setInp] = useState<ComparFlechesInputs>({
    L: 6, b: 0.3, h: 0.6, d: 0.55, As: 12.06, Asc: 4.02, w_ser: 25,
    fck: 30, fyk: 500, phi: 2.0, beta: 0.5,
  });
  const { data: res, error: err, live } = useModuleCalc<ComparFlechesInputs, ComparFlechesOutput>(
    'calculate_compar_fleches_190', inp,
  );
  const S = (k: keyof ComparFlechesInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.verdict.startsWith('OK') ? 'pass' : 'fail';

  const slider = (
    key: keyof ComparFlechesInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="190 Compar Flèches BAEL / EC2"
      subtitle="Même poutre calculée de 5 façons : BAEL simplifiée, EC2 non fissurée / fissurée / ζ §7.4.3, intégration des courbures — RUST"
      eurocode="EC2 §7.4.3"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Poutre & chargement</div>
          {slider('L', 'L', 'm', 2, 15, 0.5)}
          {slider('b', 'b', 'm', 0.1, 1, 0.05)}
          {slider('h', 'h', 'm', 0.2, 1.5, 0.05)}
          {slider('d', 'd', 'm', 0.2, 1.4, 0.05)}
          {slider('As', 'As (inf)', 'cm²', 0, 50, 0.5)}
          {slider('Asc', 'Asc (sup)', 'cm²', 0, 30, 0.5)}
          {slider('w_ser', 'w_ser', 'kN/m', 0, 100, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('phi', 'φ (fluage)', '', 0, 4, 0.1)}
          {slider('beta', 'β (ζ, 1=CT 0.5=LT)', '', 0, 1, 0.1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Comparaison des 5 méthodes (mm) — rouge = L/250" vbW={600} vbH={220}>
            {res && (() => {
              const fmm = res.f_methods.map(f => f * 1000);
              const fadm = res.f_adm * 1000;
              const ymax = Math.max(...fmm, fadm, 1) * 1.15;
              const bw = 440 / 5;
              return (
                <>
                  {fmm.map((f, i) => {
                    const h = (f / ymax) * 170;
                    const x = 60 + i * bw + 8;
                    return (
                      <g key={i}>
                        <rect x={x} y={190 - h} width={bw - 16} height={h}
                          fill={res.ratios[i] > 1 ? '#EF4444' : '#6366F1'} opacity={0.75} rx={2} />
                        <text x={x + (bw - 16) / 2} y={186 - h} fontSize={9} fill="#CBD5E1" textAnchor="middle">{f.toFixed(1)}</text>
                        <text x={x + (bw - 16) / 2} y={203} fontSize={9} fill="#94A3B8" textAnchor="middle">M{i + 1}</text>
                      </g>
                    );
                  })}
                  <line x1={50} y1={190 - (fadm / ymax) * 170} x2={560} y2={190 - (fadm / ymax) * 170}
                    stroke="#EF4444" strokeWidth={1.5} strokeDasharray="6,3" />
                  <text x={555} y={186 - (fadm / ymax) * 170} fontSize={9} fill="#EF4444" textAnchor="end">L/250={fadm.toFixed(0)}</text>
                </>
              );
            })()}
          </SectionCanvas>
          {res && (
            <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 font-mono">
              {res.method_names.map((n, i) => <div key={i}>M{i + 1} — {n}</div>)}
            </div>
          )}
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['f_adm (L/250)', `${(res.f_adm * 1000).toFixed(1)} mm`],
                  ['f_max méthodes', `${(Math.max(...res.f_methods) * 1000).toFixed(1)} mm`],
                  ['Ratio max', Math.max(...res.ratios).toFixed(2)],
                  ['Méthodes', `${res.f_methods.length}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flèche EC2 interpolée"
                latex={String.raw`\zeta = 1 - \beta(\sigma_{sr}/\sigma_s)^2 \quad f = \zeta f_{II} + (1-\zeta)f_I`}
                description="5 méthodes comparées, L/250"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f`, meaning: 'Flèche max méthodes', value: (Math.max(...res.f_methods) * 1000).toFixed(1), unit: 'mm' },
                  { symbol: String.raw`f_{adm}`, meaning: 'Flèche admissible', value: (res.f_adm * 1000).toFixed(1), unit: 'mm' },
                  { symbol: String.raw`\beta`, meaning: 'Durée de charge', value: inp.beta },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.verdict.startsWith('OK') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
