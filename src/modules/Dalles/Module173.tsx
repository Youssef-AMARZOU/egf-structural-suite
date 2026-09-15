import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { PrefaEtDalleRapporteeInputs, PrefaEtDalleRapporteeOutput } from '../../types/engineering';

export default function Module173() {
  const [inp, setInp] = useState<PrefaEtDalleRapporteeInputs>({
    h: 200, h1: 80, b: 1000, bw: 200, hsup: 30, hinf: 30,
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    NEd: 100, MEd: 30, VEd: 50, TEd: 10,
    ec1: 2.0, nc: 2.0,
  });
  const { data: res, error: err, live } = useModuleCalc<PrefaEtDalleRapporteeInputs, PrefaEtDalleRapporteeOutput>(
    'calculate_prefa_et_dalle_rapportee_173', inp,
  );
  const S = (k: keyof PrefaEtDalleRapporteeInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing'
    : res.is_ok_shear && res.is_ok_nm ? verdictStatus(res.verdict) : 'fail';

  const slider = (
    key: keyof PrefaEtDalleRapporteeInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 20;
  const bw = 80, bFlange = 200;
  const hPx = 80, h1Px = 30;

  return (
    <Workstation
      title="173 Prefa et dalle rapportee"
      subtitle="Vérification dalle préfabriquée + dalle rapportée (EC2) — RUST"
      eurocode="EC2 §6.2.5"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('h', 'h (DAP)', 'mm', 50, 500, 10)}
          {slider('h1', 'h1 (DR)', 'mm', 20, 200, 5)}
          {slider('b', 'b', 'mm', 200, 2000, 10)}
          {slider('bw', 'bw', 'mm', 100, 1000, 10)}
          {slider('hsup', 'hsup', 'mm', 10, 100, 5)}
          {slider('hinf', 'hinf', 'mm', 10, 100, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Efforts</div>
          {slider('NEd', 'NEd', 'kN', 0, 2000, 10)}
          {slider('MEd', 'MEd', 'kN·m', 0, 500, 5)}
          {slider('VEd', 'VEd', 'kN', 0, 500, 5)}
          {slider('TEd', 'TEd', 'kN·m', 0, 200, 5)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Coupe — Dalle préfab + rapportée" vbW={500} vbH={150}>
            <rect x={ox} y={oy} width={bFlange} height={hPx} fill="#94A3B8" stroke="#64748B" strokeWidth={1.5} />
            <text x={ox + bFlange / 2} y={oy + hPx / 2 + 4} fontSize={9} fill="#CBD5E1" textAnchor="middle">DAP h={inp.h}</text>
            <rect x={ox + (bFlange - bw) / 2} y={oy + hPx} width={bw} height={h1Px} fill="#6366F1" stroke="#64748B" strokeWidth={1.5} />
            <text x={ox + bFlange / 2} y={oy + hPx + h1Px / 2 + 4} fontSize={9} fill="#fff" textAnchor="middle">DR h1={inp.h1}</text>
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + hPx + h1Px} offset={-24} text={`h+h1 = ${inp.h + inp.h1}`} />
            {res && (
              <>
                <text x={ox + bFlange + 20} y={oy + 20} fontSize={10} fill={res.is_ok_shear ? '#22C55E' : '#EF4444'}>
                  {res.is_ok_shear ? '✓ Cisaillement' : '✗ Cisaillement'}
                </text>
                <text x={ox + bFlange + 20} y={oy + 40} fontSize={10} fill={res.is_ok_nm ? '#22C55E' : '#EF4444'}>
                  {res.is_ok_nm ? '✓ N/M' : '✗ N/M'}
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
                  ['NR', `${res.NR.toFixed(1)} kN`],
                  ['MR', `${res.MR.toFixed(1)} kN·m`],
                  ['τmax', `${res.tau_max.toFixed(3)} MPa`],
                  ['τmax,lim', `${res.taumax_limit.toFixed(3)} MPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Préfabriqué + rapportée"
                latex={String.raw`v_{Edi} = \beta \frac{V_{Ed}}{z b_i} \le v_{Rdi}`}
                description="Cisaillement à la reprise"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`V_{Ed}`, meaning: 'Effort tranchant', value: inp.VEd, unit: 'kN' },
                  { symbol: String.raw`v_{Edi}`, meaning: "Flux à l'interface", value: res.tau_max.toFixed(3), unit: 'MPa' },
                  { symbol: String.raw`N_R`, meaning: 'Effort résistant', value: res.NR.toFixed(1), unit: 'kN' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.is_ok_shear && res.is_ok_nm ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                <li className={res.is_ok_shear ? 'text-green-600' : 'text-red-600'}>
                  {res.is_ok_shear ? '✓' : '✗'} Cisaillement à la reprise
                </li>
                <li className={res.is_ok_nm ? 'text-green-600' : 'text-red-600'}>
                  {res.is_ok_nm ? '✓' : '✗'} Vérification N/M
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
