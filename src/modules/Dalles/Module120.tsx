import { useState } from 'react';
import type { EscalierInputs, EscalierOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: EscalierInputs = {
  l: 4.0, h_dalle: 200, g_vo: 5.0, g_si: 1.0, g_db: 0.5, q_db: 3.0,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, b1: 0.5, b2: 2.5, b3: 1.2,
  p1: 5.0, p2: 8.0, p3: 0, e_qd: 0, mg: 10, md: 15, cnom: 25,
};


export default function Module120() {
  const [inp, setInp] = useState<EscalierInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<EscalierInputs, EscalierOutput>(
    'calculate_escalier_120', inp,
  );
  const S = (k: keyof EscalierInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof EscalierInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="120 Escalier"
      subtitle="D'après EGF N°120 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('l', 'L', 'm', 1, 15, 0.5)}
          {slider('h_dalle', 'h', 'mm', 80, 400, 10)}
          {slider('b3', 'b3', 'm', 0.5, 5, 0.1)}
          {slider('cnom', 'cnom', 'mm', 10, 100, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('g_vo', 'g_vo', 'kPa', 0, 20, 0.5)}
          {slider('g_si', 'g_si', 'kPa', 0, 10, 0.1)}
          {slider('g_db', 'g_db', 'kPa', 0, 10, 0.1)}
          {slider('q_db', 'q_db', 'kPa', 0, 10, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charge trapèze</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('p1', 'p1', 'kN/m', 0, 50, 0.5)}
          {slider('p2', 'p2', 'kN/m', 0, 50, 0.5)}
          {slider('b1', 'b1', 'm', 0, 5, 0.1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Volée d'escalier" vbW={600} vbH={250}>
    {(() => {
      const sc = 90;
      const ox = 80; const oy = 40;
      const L = inp.l * sc;
      const rise = 60;
      const steps = 8;
      const pts = Array.from({ length: steps + 1 }, (_, i) => `${ox + (i / steps) * L},${oy + rise - (i / steps) * rise}`).join(' ');
      return (
        <g>
          <polyline points={pts} fill="none" stroke="#1e293b" strokeWidth={2} />
          <line x1={ox} y1={oy + rise + 18} x2={ox + L} y2={oy + 18} stroke="#3b82f6" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
          <line x1={ox} y1={oy + rise} x2={ox} y2={oy + rise + 18} stroke="#94a3b8" strokeWidth={1} />
          <line x1={ox + L} y1={oy} x2={ox + L} y2={oy + 18} stroke="#94a3b8" strokeWidth={1} />
          <DimensionLine x1={ox} y1={oy + rise + 18} x2={ox + L} y2={oy + rise + 18} offset={24} text={`L = ${inp.l} m`} />
          <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + rise + 18} offset={-30} text={`h = ${inp.h_dalle} mm`} />
          {res && (
            <text x={ox + L / 2} y={oy + rise + 58} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
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
              <div>M_max = <b>{(res.m_max * 1000).toFixed(1)}</b> kNm</div>
              <div>μ = <b>{res.mu.toFixed(3)}</b></div>
              <div>z = <b>{res.z.toFixed(0)}</b> mm</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Escalier (paillasse)"
                latex={String.raw`M_{Ed} = \frac{p L^2}{8}`}
                description="Moment isostatique de la volée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`p`, meaning: 'Charge répartie', value: res.mu.toFixed(3) },
                    { symbol: String.raw`L`, meaning: 'Portée en plan', value: res.z.toFixed(0) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.mu < 0.5 ? 'text-green-600' : 'text-red-600'}>
              {res.mu < 0.5 ? '✓ Section sous-armée' : '✗ Section sur-armée'}
            </li>
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
