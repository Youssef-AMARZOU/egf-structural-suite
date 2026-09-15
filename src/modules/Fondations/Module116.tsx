import { useState } from 'react';
import type { InteracPieuInputs, InteracPieuOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup,
} from '../../components/drafting';

const DEFAULT: InteracPieuInputs = {
  gb: 0.8, nac: 8, phi: 20, enr: 50,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, euk: 0.02, k_steel: 1.08,
  ec1: 1.75, ec2: 2.0, ecu2: 3.5, nx: 2.0,
  rho_min: 0.002, rho_max: 0.02, n_rho: 5, n_pts: 30,
};


export default function Module116() {
  const [inp, setInp] = useState<InteracPieuInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InteracPieuInputs, InteracPieuOutput>(
    'calculate_interac_pieu_116', inp,
  );
  const S = (k: keyof InteracPieuInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const chartData = res ? res.n_values.map((n, i) => ({
    N: n,
    M: res.m_pos[i] ?? 0,
  })) : [];

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InteracPieuInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="116 Interac. Pieu"
      subtitle="D'après EGF N°116 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('gb', 'GD', 'm', 0.2, 3, 0.05)}
          {slider('nac', 'nac', '-', 4, 60, 2)}
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('enr', 'enr', 'mm', 10, 100, 5)}
          {slider('k_steel', 'k', '-', 1.0, 1.15, 0.01)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Section circulaire + armatures" vbW={600} vbH={340}>
    {(() => {
      const R = (inp.gb * 1000) / 2;
      const k = Math.min(280 / (2 * R), 240 / (2 * R));
      const cx = 300; const cy = 165;
      const n = Math.max(4, Math.round(inp.nac));
      const rBar = Math.max(10, R - inp.enr - inp.phi / 2);
      const bars: { x: number; y: number; phi: number }[] = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + rBar * k * Math.cos(a), y: cy + rBar * k * Math.sin(a), phi: inp.phi };
      });
      return (
        <g>
          <circle cx={cx} cy={cy} r={R * k} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
          <RebarGroup bars={bars} pxPerMm={k} />
          <DimensionLine x1={cx - R * k} y1={cy + R * k} x2={cx + R * k} y2={cy + R * k} offset={26} text={`GD (m) = ${inp.gb}`} />
          {res && (
            <text x={cx} y={cy + R * k + 44} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              Nmax={res.n_max.toFixed(2)} MN
            </text>
          )}
        </g>
      );
    })()}
  </SectionCanvas>
</div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme N-M</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="M" label={{ value: 'M (MNm)', position: 'bottom', fontSize: 10 }} />
              <YAxis dataKey="N" label={{ value: 'N (MN)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="N" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <div className="font-mono text-xs space-y-1">
              <div>N_max = <b>{res.n_max.toFixed(2)}</b> MN</div>
              <div>As_min = <b>{(res.a_min * 10000).toFixed(1)}</b> cm²</div>
              <div>As_max = <b>{(res.a_max * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          </div>
        )}
              <FormulaCard
                title="Interaction pieu-sol"
                latex={String.raw`N_{Rd} = \int \sigma \, dA \quad M_{Rd} = \int \sigma y \, dA`}
                description="Courbe enveloppe de la section du pieu"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N_{Ed}`, meaning: 'Effort normal', value: res.n_max.toFixed(2) },
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment' },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ Diagramme N-M calculé</li>
            <li className="text-slate-500">• {res.n_values.length} points sur la courbe</li>
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
