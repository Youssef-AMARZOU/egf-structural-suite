import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { DalleContinueFeuInputs, DalleContinueFeuOutput } from '../../types/engineering';

export default function Module157() {
  const [inp, setInp] = useState<DalleContinueFeuInputs>({
    h: 0.20, d: 0.17, dp: 0.03, l: 5.0, n_spans: 3, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    q_g: 5.0, q_q: 3.0, gg: 1.35, gq: 1.5, psi: 0.6, r: 120, as_inf: 5.0, as_sup: 4.0,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleContinueFeuInputs, DalleContinueFeuOutput>(
    'calculate_dalle_continue_feu_157', inp,
  );
  const S = (k: keyof DalleContinueFeuInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const tempPts: [number, number][] = res ? (() => {
    const maxT = 1200;
    const maxD = inp.h * 1000;
    const pts: [number, number][] = [];
    for (let x = 0; x <= maxD; x += 2) {
      const theta = 20 + (res.theta_fire - 20) * Math.exp(-0.005 * x);
      pts.push([100 + (x / maxD) * 400, 190 - (theta / maxT) * 180]);
    }
    return pts;
  })() : [];
  const steelX = 100 + (inp.d * 1000 / (inp.h * 1000)) * 400;

  const status = err ? 'fail' : !res ? 'computing'
    : res.ratio_inf > 1.0 || res.ratio_sup > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleContinueFeuInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="157 Dalle continue au feu"
      subtitle="EC2 §5.5 — Vérification au feu des dalles continues, ISO 834 — RUST"
      eurocode="EC2 §5.5"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('h', 'Épaisseur h', 'm', 0.05, 0.6, 0.01)}
          {slider('d', 'Profondeur utile d', 'm', 0.05, 0.5, 0.01)}
          {slider('dp', 'Enrobage sup. dp', 'm', 0.01, 0.1, 0.005)}
          {slider('l', 'Portée L', 'm', 1, 15, 0.5)}
          {slider('n_spans', 'Nombre travées', '', 1, 8, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges</div>
          {slider('q_g', 'q_g', 'kN/m²', 0, 30, 0.5)}
          {slider('q_q', 'q_q', 'kN/m²', 0, 30, 0.5)}
          {slider('gg', 'γG', '', 1, 1.5, 0.05)}
          {slider('gq', 'γQ', '', 1, 1.6, 0.05)}
          {slider('psi', 'ψ₂', '', 0, 1, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu et ferraillage</div>
          {slider('r', 'Résistance feu R', 'min', 15, 360, 15)}
          {slider('as_inf', 'As inf. fourni', 'cm²/m', 0, 30, 0.5)}
          {slider('as_sup', 'As sup. fourni', 'cm²/m', 0, 30, 0.5)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Profil de température ISO 834" vbW={600} vbH={220}>
            <text x={10} y={105} fontSize={11} fill="#374151" transform="rotate(-90,15,105)">θ (°C)</text>
            <text x={300} y={215} fontSize={11} fill="#374151" textAnchor="middle">Profondeur x (mm)</text>
            <line x1={100} y1={10} x2={100} y2={190} stroke="#ccc" strokeWidth={1} />
            <line x1={100} y1={190} x2={500} y2={190} stroke="#ccc" strokeWidth={1} />
            {res && (
              <>
                <DiagramOverlay type="moment" points={tempPts} color="#EF4444" />
                <line x1={steelX} y1={10} x2={steelX} y2={190} stroke="#3B82F6" strokeWidth={1} strokeDasharray="4,4" />
                <text x={steelX + 5} y={25} fontSize={10} fill="#3B82F6">d = {(inp.d * 1000).toFixed(0)}mm</text>
                <text x={steelX + 5} y={38} fontSize={10} fill="#EF4444">θ_s = {res.theta_s.toFixed(0)}°C</text>
              </>
            )}
            {[0, 200, 400, 600, 800, 1000, 1200].map((t, i) => (
              <g key={i}>
                <line x1={95} y1={190 - (t / 1200) * 180} x2={100} y2={190 - (t / 1200) * 180} stroke="#ccc" />
                <text x={90} y={194 - (t / 1200) * 180} fontSize={9} fill="#94A3B8" textAnchor="end">{t}</text>
              </g>
            ))}
            {[0, 50, 100, 150, 200].map((d, i) => (
              <g key={i}>
                <line x1={100 + (d / (inp.h * 1000)) * 400} y1={190} x2={100 + (d / (inp.h * 1000)) * 400} y2={195} stroke="#ccc" />
                <text x={100 + (d / (inp.h * 1000)) * 400} y={208} fontSize={9} fill="#94A3B8" textAnchor="middle">{d}</text>
              </g>
            ))}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['θ_feu', `${res.theta_fire.toFixed(0)} °C`],
                  ['θ_d', `${res.theta_d.toFixed(0)} °C`],
                  ['θ_s', `${res.theta_s.toFixed(0)} °C`],
                  ['k_c', res.k_concrete.toFixed(2)],
                  ['k_s', res.ks_steel.toFixed(2)],
                  ['k_t', res.k_tension.toFixed(2)],
                  ['M_sup', `${res.m_support.toFixed(2)} kN·m/m`],
                  ['M_mid', `${res.m_midspan.toFixed(2)} kN·m/m`],
                  ['As_inf,fi', `${res.as_inf_fi.toFixed(2)} cm²/m`],
                  ['As_sup,fi', `${res.as_sup_fi.toFixed(2)} cm²/m`],
                  ['Ratio inf', `${(res.ratio_inf * 100).toFixed(0)}%`],
                  ['Ratio sup', `${(res.ratio_sup * 100).toFixed(0)}%`],
                  ['L_fi', `${res.l_fi.toFixed(2)} m`],
                  ['Es_r', res.es_reduction.toFixed(2)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Feu ISO 834"
                latex={String.raw`\theta_g = 20 + 345\log_{10}(8t + 1)`}
                description="Courbe température-temps normalisée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\theta_g`, meaning: 'Température des gaz', value: res.theta_fire.toFixed(0), unit: '°C' },
                  { symbol: String.raw`t`, meaning: 'Durée', value: inp.r, unit: 'min' },
                  { symbol: String.raw`k_s`, meaning: 'Réduction acier', value: res.ks_steel.toFixed(2) },
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
