import { useState } from 'react';
import type { VouteDechargeInputs, VouteDechargeOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: VouteDechargeInputs = {
  p: 500, l: 10, leff: 9.6, a: 0.3, b: 0.4, d: 0.35, h: 0.45,
  mu: 0.4, c: 0.1, fctd: 1.8, fcd: 20, fck: 30, fyd: 435,
  gg: 0.025, rhoa: 1800, l5: 2.0, sbl: 10, p3: 0,
};


export default function Module117() {
  const [inp, setInp] = useState<VouteDechargeInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<VouteDechargeInputs, VouteDechargeOutput>(
    'calculate_voute_decharge_117', inp,
  );
  const S = (k: keyof VouteDechargeInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof VouteDechargeInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="117 Voûte Décharge"
      subtitle="D'après EGF N°117 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('p', 'P', 'kN', 10, 5000, 50)}
          {slider('l', 'L', 'm', 1, 30, 0.5)}
          {slider('leff', 'Leff', 'm', 1, 30, 0.1)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slider('a', 'a', 'm', 0.05, 2, 0.05)}
          {slider('b', 'b', 'm', 0.1, 2, 0.05)}
          {slider('d', 'd', 'm', 0.1, 2, 0.05)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('h', 'h', 'm', 0.1, 2, 0.05)}
          {slider('sbl', 'sbl', 'MPa', 1, 30, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyd', 'fyd', 'MPa', 200, 500, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Remblai</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('rhoa', 'ρa', 'kg/m³', 1000, 2500, 50)}
          {slider('l5', 'L5', 'm', 0, 10, 0.25)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Voûte de décharge" vbW={600} vbH={260}>
    {(() => {
      const sc = 440 / Math.max(inp.leff, 1);
      const ox = 80; const baseY = 190;
      const w = inp.leff * sc;
      const rise = 70;
      return (
        <g>
          <rect x={ox - 12} y={baseY - 60} width={12} height={60} fill="#64748b" />
          <rect x={ox + w} y={baseY - 60} width={12} height={60} fill="#64748b" />
          <path d={`M ${ox} ${baseY} Q ${ox + w / 2} ${baseY - 2 * rise} ${ox + w} ${baseY}`} fill="none" stroke="#2563eb" strokeWidth={2.5} />
          <line x1={ox + w / 2} y1={baseY - rise - 44} x2={ox + w / 2} y2={baseY - rise} stroke="#ef4444" strokeWidth={2} />
          <text x={ox + w / 2 + 6} y={baseY - rise - 30} fontSize={9} fill="#ef4444">P={inp.p} kN</text>
          <DimensionLine x1={ox} y1={baseY} x2={ox + w} y2={baseY} offset={24} text={`Leff = ${inp.leff} m`} />
          {res && (
            <text x={ox + w / 2} y={baseY + 42} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              T={res.thrust.toFixed(1)} kN | α={res.arch_angle_deg.toFixed(1)}°
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
              <div>L₂ = <b>{res.l2.toFixed(2)}</b> m | α = <b>{res.arch_angle_deg.toFixed(1)}</b>°</div>
              <div>cotα = <b>{res.cot_alpha.toFixed(2)}</b></div>
              <div>T = <b>{res.thrust.toFixed(1)}</b> kN</div>
              <div>Ast = <b>{res.ast_req.toFixed(1)}</b> cm²</div>
              <div>σ_n = <b>{res.s_n.toFixed(2)}</b> MPa | σ_b = <b>{res.s_b.toFixed(2)}</b> MPa</div>
              <div>VEd = <b>{res.v_ed.toFixed(3)}</b> MN | VRdmax = <b>{res.v_rdmax.toFixed(3)}</b> MN</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Voûte de décharge"
                latex={String.raw`H = \frac{q L^2}{8 f}`}
                description="Poussée de la voûte parabolique"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`H`, meaning: 'Poussée horizontale', value: res.l2.toFixed(2) },
                    { symbol: String.raw`f`, meaning: 'Flèche de la voûte', value: res.arch_angle_deg.toFixed(1) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.v_ed < res.v_rdmax ? 'text-green-600' : 'text-red-600'}>
              {res.v_ed < res.v_rdmax ? '✓ Cisaillement OK' : '✗ Cisaillement dépassé'}
            </li>
            <li className="text-slate-500">• Poussée T = {res.thrust.toFixed(1)} kN</li>
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
