import { useState } from 'react';
import type { ExcentrPieuInputs, ExcentrPieuOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: ExcentrPieuInputs = {
  alp1: 1.0, alp2: 1.0, b1: 0.3, b2: 0.3, dp1: 0.45, dp2: 0.45,
  e1: 30000, l1: 6, l2: 6, k3: 100, bei: 50, m0: 0.5,
  fcd: 20, fyd: 435, ned: 5.0, etol: 0.001,
};


export default function Module115() {
  const [inp, setInp] = useState<ExcentrPieuInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<ExcentrPieuInputs, ExcentrPieuOutput>(
    'calculate_excentr_pieu_115', inp,
  );
  const S = (k: keyof ExcentrPieuInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof ExcentrPieuInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="115 Excentr. Pieu"
      subtitle="D'après EGF N°115 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutres</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('alp1', 'α₁', '-', 0.5, 2, 0.1)}
          {slider('alp2', 'α₂', '-', 0.5, 2, 0.1)}
          {slider('e1', 'E₁', 'GPa', 10000, 50000, 1000)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b1', 'b₁', 'm', 0.1, 2, 0.05)}
          {slider('b2', 'b₂', 'm', 0.1, 2, 0.05)}
          {slider('l1', 'L₁', 'm', 1, 20, 0.5)}
          {slider('l2', 'L₂', 'm', 1, 20, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('m0', 'M₀', 'MNm', 0, 50, 0.25)}
          {slider('ned', 'NEd', 'MN', 0.1, 100, 0.5)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Schéma — pieu excentré" vbW={600} vbH={320}>
    {(() => {
      const sc = 60;
      const ox = 150; const baseY = 230;
      const wCap = (inp.b1 + inp.b2) * sc;
      const hCap = 30;
      const xPile = ox + inp.b1 * sc;
      return (
        <g>
          <rect x={ox} y={baseY - hCap} width={wCap} height={hCap} fill="#e2e8f0" stroke="#64748b" strokeWidth={1} />
          <rect x={xPile - 15} y={baseY} width={30} height={40} fill="#1F3864" />
          <line x1={xPile} y1={baseY - hCap - 50} x2={xPile} y2={baseY - hCap} stroke="#ef4444" strokeWidth={2} />
          <text x={xPile + 6} y={baseY - hCap - 40} fontSize={9} fill="#ef4444">NEd</text>
          <DimensionLine x1={ox} y1={baseY + 40} x2={ox + wCap} y2={baseY + 40} offset={14} text={`b1+b2 = ${(inp.b1 + inp.b2).toFixed(2)} m`} />
          {res && (
            <text x={ox + wCap / 2} y={baseY - hCap - 56} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              h={(res.h * 1000).toFixed(0)} mm
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
              <div>h = <b>{(res.h * 1000).toFixed(0)}</b> mm</div>
              <div>C₁ = <b>{res.c1.toFixed(3)}</b> MNm | C₂ = <b>{res.c2.toFixed(3)}</b> MNm</div>
              <div>C₃ = <b>{res.c3.toFixed(3)}</b> MNm | C_pieu = <b>{res.c_pieu.toFixed(3)}</b> MNm</div>
              <div>As₁ = <b>{res.ac1.toFixed(1)}</b> cm² | As₂ = <b>{res.ac2.toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Répartition sur pieux"
                latex={String.raw`N_i = \frac{N}{n} \pm \frac{M y_i}{\sum y_i^2}`}
                description="Semelle rigide sur groupe de pieux"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N_i`, meaning: 'Effort par pieu', value: res.c1.toFixed(3) },
                    { symbol: String.raw`n`, meaning: 'Nombre de pieux', value: res.c2.toFixed(3) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ h = {(res.h * 1000).toFixed(0)}mm</li>
            <li className="text-slate-500">• K₁={res.k1.toFixed(1)} K₂={res.k2.toFixed(1)} MNm/rad</li>
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
