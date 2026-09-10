import { useState } from 'react';
import type { ContraintesCircInputs, ContraintesCircOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup,
} from '../../components/drafting';

const DEFAULT: ContraintesCircInputs = {
  gd: 0.8, na: 12, phi: 20, enr: 40, deca: 0,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, euk: 0.02, k: 1.08,
  typ: 1, ecu1: 3.5, ec1: 1.75, ec2: 2.0, ecu2: 3.5, nx: 2.0,
  ned: 3.0, med: 1.5, itour: 30,
};


export default function Module114() {
  const [inp, setInp] = useState<ContraintesCircInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<ContraintesCircInputs, ContraintesCircOutput>(
    'calculate_contraintes_circ_114', inp,
  );
  const S = (k: keyof ContraintesCircInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof ContraintesCircInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="114 Contraintes Circ"
      subtitle="D'après EGF N°114 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('gd', 'GD', 'm', 0.2, 3, 0.05)}
          {slider('na', 'na', '-', 4, 60, 2)}
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('enr', 'enr', 'mm', 10, 100, 5)}
          {slider('deca', 'Deca', '-', 0, 1, 1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('k', 'k', '-', 1.0, 1.15, 0.01)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 1.5, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ned', 'NEd', 'MN', 0, 100, 0.5)}
          {slider('med', 'MEd', 'MNm', 0, 50, 0.25)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Section circulaire + armatures" vbW={600} vbH={340}>
    {(() => {
      const R = (inp.gd * 1000) / 2;
      const k = Math.min(280 / (2 * R), 240 / (2 * R));
      const cx = 300; const cy = 165;
      const n = Math.max(4, Math.round(inp.na));
      const rBar = Math.max(10, R - inp.enr - inp.phi / 2);
      const bars: { x: number; y: number; phi: number }[] = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + rBar * k * Math.cos(a), y: cy + rBar * k * Math.sin(a), phi: inp.phi };
      });
      return (
        <g>
          <circle cx={cx} cy={cy} r={R * k} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
          <RebarGroup bars={bars} pxPerMm={k} />
          <DimensionLine x1={cx - R * k} y1={cy + R * k} x2={cx + R * k} y2={cy + R * k} offset={26} text={`GD (m) = ${inp.gd}`} />
          {res && (
            <text x={cx} y={cy + R * k + 44} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              NRd={res.nrd.toFixed(2)} MN
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
              <div>NRd = <b>{res.nrd.toFixed(2)}</b> MN</div>
              <div>MRd = <b>{res.mrd.toFixed(2)}</b> MNm</div>
              <div>e₁ = <b>{res.e1.toFixed(3)}</b> ‰ | e₂ = <b>{res.e2.toFixed(3)}</b> ‰</div>
              <div>Kd = <b>{res.kd.toFixed(3)}</b> m | As = <b>{(res.a_steel * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Section circulaire N-M"
                latex={String.raw`N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}`}
                description="Interaction par bandes horizontales"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N_{Ed}`, meaning: 'Effort normal', value: inp.ned },
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment', value: res.nrd.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.nrd >= inp.ned && res.mrd >= inp.med ? 'text-green-600' : 'text-red-600'}>
              {res.nrd >= inp.ned && res.mrd >= inp.med ? '✓ Section suffisante' : '✗ Section insuffisante'}
            </li>
            <li className="text-slate-500">• ρ = {(res.a_steel / (Math.PI * inp.gd * inp.gd / 4) * 100).toFixed(2)}%</li>
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
