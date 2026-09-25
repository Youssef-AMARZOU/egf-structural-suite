import { useState } from 'react';
import type { OuverPoutInputs, OuverPoutOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: OuverPoutInputs = {
  ned: 0.5, b: 0.3, d: 0.5, fcd: 20, m1: 0.2, fyd: 435,
  mu0: 0.4, es0: 0.002175, k: 1.08, euk: 0.02, ecu: 0.0035,
  v_ed: 0.1, sigma_max: 5.0, q_angle: 45,
};


export default function Module123() {
  const [inp, setInp] = useState<OuverPoutInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<OuverPoutInputs, OuverPoutOutput>(
    'calculate_ouver_pout_123', inp,
  );
  const S = (k: keyof OuverPoutInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof OuverPoutInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="123 Ouver. Poutre"
      subtitle="D'après EGF N°123 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b', 'Largeur b', 'm', 0.1, 2, 0.05)}
          {slider('d', 'Hauteur utile d', 'm', 0.1, 3, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ned', 'NEd', 'MN', 0, 50, 0.1)}
          {slider('m1', 'M₁', 'MNm', 0, 20, 0.05)}
          {slider('v_ed', 'VEd', 'MN', 0, 10, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fcd', 'fcd', 'MPa', 5, 60, 1)}
          {slider('fyd', 'fyd', 'MPa', 200, 500, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Acier</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('mu0', 'μ₀', '-', 0.1, 0.5, 0.01)}
          {slider('k', 'k', '-', 1.0, 1.15, 0.01)}
          {slider('q_angle', 'θ', '°', 20, 70, 5)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Poutre avec trémie" vbW={600} vbH={260}>
    {(() => {
      const sc = 400;
      const W = Math.max(60, inp.b * sc); const H = Math.max(80, inp.d * sc);
      const ox = 300 - W / 2; const oy = 30;
      const ow = W * 0.4; const oh = H * 0.4;
      return (
        <g>
          <rect x={ox} y={oy} width={W} height={H} fill="#e2e8f0" stroke="#64748b" strokeWidth={1} />
          <rect x={ox + W / 2 - ow / 2} y={oy + H / 2 - oh / 2} width={ow} height={oh} fill="#ffffff" stroke="#ef4444" strokeWidth={1.2} strokeDasharray="4 2" />
          <line x1={ox + W / 2 - ow / 2} y1={oy + H / 2 - oh / 2} x2={ox + W / 2 + ow / 2} y2={oy + H / 2 + oh / 2} stroke="#2563eb" strokeWidth={1} />
          <line x1={ox + W / 2 + ow / 2} y1={oy + H / 2 - oh / 2} x2={ox + W / 2 - ow / 2} y2={oy + H / 2 + oh / 2} stroke="#2563eb" strokeWidth={1} />
          <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={22} text={`b = ${inp.b} m`} />
          <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`d = ${inp.d} m`} />
          {res && (
            <text x={ox + W / 2} y={oy + H + 40} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              As={(res.as_req * 10000).toFixed(1)} cm²
            </text>
          )}
        </g>
      );
    })()}
  </SectionCanvas>
</div>
        </>
      }
      results={
        <>
          {res ? (
            <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>μ = <b>{res.mu.toFixed(3)}</b></div>
              <div>ξ = <b>{res.xi.toFixed(3)}</b> | x = <b>{res.x.toFixed(0)}</b> mm</div>
              <div>z = <b>{res.z.toFixed(0)}</b> mm</div>
              <div>εs = <b>{(res.eps_s * 1000).toFixed(2)}</b> ‰ | σs = <b>{res.sigma_s.toFixed(0)}</b> MPa</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div>Asw,diag = <b>{(res.asw_diag * 10000).toFixed(1)}</b> cm²</div>
              <div>αcw = <b>{res.alpha_cw.toFixed(2)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Trémie en poutre"
                latex={String.raw`A_{diag} = \frac{V_{Ed}}{f_{yd}\sin\alpha}`}
                description="Suspentes autour de l'ouverture"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort à suspendre', value: inp.v_ed },
                    { symbol: String.raw`\alpha`, meaning: 'Angle des suspentes', value: res.alpha_cw.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.mu < res.alpha_cw * 0.5 ? 'text-green-600' : 'text-red-600'}>
              {res.mu < res.alpha_cw * 0.5 ? '✓ Section sous-armée' : '✗ Section sur-armée'}
            </li>
            <li className="text-slate-500">• σs = {res.sigma_s.toFixed(0)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
