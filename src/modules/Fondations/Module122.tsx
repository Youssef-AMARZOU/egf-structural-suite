import { useState } from 'react';
import type { Sem2PieuxInputs, Sem2PieuxOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: Sem2PieuxInputs = {
  d1: 1.0, d2: 1.0, b_col: 0.4, gd: 0.5, deb: 0.2,
  ned: 3.0, med0: 0.5, hed: 0.1, d_eff: 0.5,
  go: 1.35, gg: 0.025, bp: 0.4, gb_pc: 1.5,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, cnom: 50, phi: 16,
};


export default function Module122() {
  const [inp, setInp] = useState<Sem2PieuxInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<Sem2PieuxInputs, Sem2PieuxOutput>(
    'calculate_sem2_pieux_122', inp,
  );
  const S = (k: keyof Sem2PieuxInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Sem2PieuxInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="122 Sem2 Pieux"
      subtitle="D'après EGF N°122 © Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('d1', 'd₁', 'm', 0.2, 5, 0.1)}
          {slider('d2', 'd₂', 'm', 0.2, 5, 0.1)}
          {slider('b_col', 'b_col', 'm', 0.1, 3, 0.05)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slider('gd', 'GD', 'm', 0.1, 2, 0.05)}
          {slider('deb', 'déb', 'm', 0.05, 1, 0.05)}
          {slider('d_eff', 'd', 'm', 0.1, 3, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ned', 'NEd', 'MN', 0.1, 50, 0.5)}
          {slider('med0', 'MEd₀', 'MNm', 0, 20, 0.25)}
          {slider('hed', 'HEd', 'MN', 0, 5, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Semelle</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('gb_pc', 'GB', 'm', 0.5, 5, 0.1)}
          {slider('bp', 'bp', 'm', 0.1, 3, 0.05)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Semelle sur 2 pieux" vbW={600} vbH={280}>
    {(() => {
      const sc = 70;
      const cx = 300; const yCap = 60; const hCap = 30;
      const x1 = cx - inp.d1 * sc; const x2 = cx + inp.d2 * sc;
      const wCap = (x2 - x1) + inp.b_col * sc;
      return (
        <g>
          <rect x={x1 - (inp.b_col * sc) / 2} y={yCap} width={wCap} height={hCap} fill="#e2e8f0" stroke="#64748b" strokeWidth={1} />
          <rect x={x1 - 12} y={yCap + hCap} width={24} height={100} fill="#1F3864" />
          <rect x={x2 - 12} y={yCap + hCap} width={24} height={100} fill="#1F3864" />
          <line x1={cx} y1={yCap - 44} x2={cx} y2={yCap} stroke="#ef4444" strokeWidth={2} />
          <text x={cx + 6} y={yCap - 34} fontSize={9} fill="#ef4444">NEd</text>
          <DimensionLine x1={x1} y1={yCap + hCap + 100} x2={x2} y2={yCap + hCap + 100} offset={20} text={`d1+d2 = ${(inp.d1 + inp.d2).toFixed(2)} m`} />
          {res && (
            <text x={cx} y={yCap - 50} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              Med={res.med.toFixed(3)} MNm
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
              <div>Med = <b>{res.med.toFixed(3)}</b> MNm</div>
              <div>p₁ = <b>{res.p1.toFixed(3)}</b> MPa | p₂ = <b>{res.p2.toFixed(3)}</b> MPa</div>
              <div>R_gauche = <b>{res.r_left.toFixed(3)}</b> MN | R_droit = <b>{res.r_right.toFixed(3)}</b> MN</div>
              <div>M_max = <b>{res.m_max.toFixed(3)}</b> MNm</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div>Asw = <b>{(res.asw_req * 10000).toFixed(1)}</b> cm²/m</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Semelle sur pieux (bielles)"
                latex={String.raw`T = P \frac{e}{d}`}
                description="Tirant inférieur par la méthode des bielles"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`T`, meaning: 'Traction du tirant', value: res.med.toFixed(3) },
                    { symbol: String.raw`e/d`, meaning: 'Inclinaison de bielle', value: inp.ned },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ Semelle sur pieux calculée</li>
            <li className="text-slate-500">• cotθ = {res.cot_theta.toFixed(2)}</li>
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
