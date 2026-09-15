import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PoutrePrecontrainteInputs, PoutrePrecontrainteOutput } from '../../types/engineering';

export default function Module233() {
  const [inp, setInp] = useState<PoutrePrecontrainteInputs>({
    ap: 1800, sig_pmax: 1400, ep: 195000, mu: 0.18, theta: 0.3, k: 0.005, x: 10,
    l_beam: 20, slip: 6, ac: 400000, ic: 3.2e10, e_tend: 400, m_pp: 500,
    ecm: 34000, phi: 2.0, eps_cs: 300, dsigma_pr: 80, sig_c_qp: 0,
  });
  const { data: res, error: err, live } = useModuleCalc<PoutrePrecontrainteInputs, PoutrePrecontrainteOutput>(
    'calculate_poutre_precontrainte_233', inp,
  );
  const S = (k: keyof PoutrePrecontrainteInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PoutrePrecontrainteInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- loss cascade bars (400x180 canvas) ----
  const steps = res ? [
    { l: 'Pmax', v: inp.sig_pmax, c: '#1D4ED8' },
    { l: '−frott.', v: -res.d_friction, c: '#F59E0B' },
    { l: '−rentrée', v: -res.d_slip, c: '#F59E0B' },
    { l: '−élast.', v: -res.d_elastic, c: '#F59E0B' },
    { l: '−diff.', v: -res.d_deferred, c: '#EF4444' },
  ] : [];
  const BW = 340 / Math.max(steps.length, 1);

  return (
    <Workstation
      title="233 Précontrainte : pertes"
      subtitle="EC2 §5.10 — frottement, rentrée, élastique, différées (5.46) — RUST"
      eurocode="EC2 §5.10"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Câble & tracé</div>
          {slider('ap', 'Ap', 'mm²', 100, 10000, 50)}
          {slider('sig_pmax', 'σpmax', 'MPa', 500, 1600, 10)}
          {slider('ep', 'Ep', 'MPa', 150000, 210000, 1000)}
          {slider('mu', 'μ', '-', 0.05, 0.4, 0.01)}
          {slider('theta', 'θ cumulé', 'rad', 0, 1.5, 0.05)}
          {slider('k', 'k', '/m', 0, 0.02, 0.001)}
          {slider('x', 'x section', 'm', 0, 50, 0.5)}
          {slider('l_beam', 'L poutre', 'm', 1, 60, 0.5)}
          {slider('slip', 'Rentrée', 'mm', 0, 12, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section & différé</div>
          {slider('ac', 'Ac', 'mm²', 50000, 2000000, 10000)}
          {slider('ic', 'Ic', 'mm⁴', 1e9, 2e11, 1e9)}
          {slider('e_tend', 'e tendon', 'mm', 0, 1500, 10)}
          {slider('m_pp', 'Mpp', 'kN·m', 0, 5000, 10)}
          {slider('ecm', 'Ecm', 'MPa', 25000, 45000, 1000)}
          {slider('phi', 'φ', '-', 0, 5, 0.1)}
          {slider('eps_cs', 'εcs', 'µm/m', 0, 800, 10)}
          {slider('dsigma_pr', 'Δσpr', 'MPa', 0, 300, 5)}
          {slider('sig_c_qp', 'σc,qp (0=auto)', 'MPa', 0, 30, 0.5)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Cascade des pertes (MPa)" vbW={400} vbH={180}>
            {(() => {
              let acc = 0;
              return (
                <g>
                  {steps.map((s, i) => {
                    const h = (Math.abs(s.v) / inp.sig_pmax) * 130;
                    const yTop = s.v > 0
                      ? 150 - (s.v / inp.sig_pmax) * 130
                      : 150 - ((acc + Math.abs(s.v)) / inp.sig_pmax) * 130;
                    if (s.v < 0) acc += -s.v;
                    return (
                      <g key={i}>
                        <rect
                          x={30 + i * BW + 4} y={yTop} width={BW - 8}
                          height={s.v > 0 ? (s.v / inp.sig_pmax) * 130 : h}
                          fill={s.c} opacity={0.8}
                        />
                        <text x={30 + i * BW + BW / 2} y={172} fontSize={8} fill="#94a3b8" textAnchor="middle">
                          {s.l}
                        </text>
                      </g>
                    );
                  })}
                  {res && (
                    <text x={370} y={150 - (res.sig_pinf / inp.sig_pmax) * 130} fontSize={9} fill="#22C55E">
                      σ∞={res.sig_pinf.toFixed(0)}
                    </text>
                  )}
                </g>
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
                  ['P∞', `${res.p_inf.toFixed(0)} kN`],
                  ['Perte', `${res.perte_pct.toFixed(1)} %`],
                  ['Δ instant.', `${(res.d_friction + res.d_slip + res.d_elastic).toFixed(0)} MPa`],
                  ['Δ différée', `${res.d_deferred.toFixed(0)} MPa`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Pertes de précontrainte"
                latex={String.raw`\Delta P_\mu = P_0(1 - e^{-(\mu\alpha + kx)})`}
                description="Frottement + rentrée + différées"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\mu`, meaning: 'Frottement', value: inp.mu.toFixed(2) },
                  { symbol: String.raw`\sigma_{\infty}`, meaning: 'Contrainte finale', value: res.sig_pinf.toFixed(0), unit: 'MPa' },
                  { symbol: String.raw`p`, meaning: 'Perte totale', value: res.perte_pct.toFixed(1), unit: '%' },
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
