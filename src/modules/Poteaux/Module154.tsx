import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup, StressStrainBlock,
} from '../../components/drafting';

interface InputState {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  h: number;
  d: number;
  dp: number;
  aci: number;
  acs: number;
  ned: number;
  med: number;
  ec2: number;
  nex: number;
  n_layers: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  fyk: 500.0,
  gc: 1.5,
  gs: 1.15,
  b: 300.0,
  h: 500.0,
  d: 440.0,
  dp: 60.0,
  aci: 300.0,
  acs: 600.0,
  ned: 500.0,
  med: 100.0,
  ec2: 0.002,
  nex: 2.0,
  n_layers: 6,
};

interface Res154 {
  n_rd: number; m_rd: number; xd_ratio: number; xd_limit: number;
  eps_s: number; eps_y: number; utilisation: number; is_ductile: boolean;
  x_na: number; verdict: string; diag: string[];
}

const BAR_PHI = 20;

export default function Module154() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InputState, Res154>(
    'calculate_non_fragilite_section_qq_154', inp,
  );

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const beamH = inp.h;
  const hPx = 140;
  const k = hPx / beamH;
  const bwPx = Math.max(30, (inp.b / 600) * 120);
  const rectX = 150 - bwPx / 2;
  const xNaPx = res ? Math.max(0, Math.min(hPx, (res.x_na / beamH) * hPx)) : hPx / 2;

  const status = err ? 'fail' : !res ? 'computing' : res.utilisation > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="154 Non fragilite section QQ"
      subtitle="D'après EGF N°154 © Henry Thonier — RUST"
      eurocode="EC2 §9.2.1.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Materiau</div>
          {slider('fck', 'fck', 'MPa', 10, 80, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'gc', '-', 1.0, 2.0, 0.05)}
          {slider('gs', 'gs', '-', 1.0, 2.0, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'Largeur b', 'mm', 100, 2000, 10)}
          {slider('h', 'Hauteur h', 'mm', 100, 2000, 10)}
          {slider('d', 'Hauteur utile d', 'mm', 50, 2000, 5)}
          {slider('dp', "d'", 'mm', 20, 500, 5)}
          {slider('aci', 'As com', 'mm2', 0, 5000, 50)}
          {slider('acs', 'As ten', 'mm2', 0, 5000, 50)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation</div>
          {slider('ned', 'NEd', 'kN', 0, 10000, 50)}
          {slider('med', 'MEd', 'kN.m', 0, 1000, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Integration</div>
          {slider('ec2', 'ec2', '-', 0.001, 0.004, 0.0001)}
          {slider('nex', 'nex', '-', 1.0, 3.0, 0.1)}
          {slider('n_layers', 'Couches', '-', 2, 20, 1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section + diagramme de déformations" vbW={300} vbH={180} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
              <rect x={rectX} y={10} width={bwPx} height={hPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
              {res && <StressStrainBlock x={rectX} yTop={10} hPx={hPx} xNa={xNaPx} wPx={34} />}
              {res && res.x_na > 0 && res.x_na < beamH && (
                <text x={36} y={14 + xNaPx} fontSize={9} fill="#ef4444" fontWeight="bold">
                  x={res.x_na.toFixed(0)}
                </text>
              )}
              <RebarGroup
                bars={[
                  ...(inp.aci > 0 ? [
                    { x: 150 - bwPx / 4, y: 25, phi: BAR_PHI },
                    { x: 150 + bwPx / 4, y: 25, phi: BAR_PHI },
                  ] : []),
                  ...(inp.acs > 0 ? [
                    { x: 150 - bwPx / 4, y: 10 + hPx - 15, phi: BAR_PHI },
                    { x: 150 + bwPx / 4, y: 10 + hPx - 15, phi: BAR_PHI },
                  ] : []),
                ]}
                pxPerMm={k}
              />
              {res && (
                <>
                  <line x1={220} y1={10} x2={220} y2={10 + hPx} stroke="#475569" strokeWidth={1} />
                  <line
                    x1={220 + (res.eps_s < 0 ? 30 : -30)}
                    y1={10 + hPx}
                    x2={220 + 30}
                    y2={10}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                  <text x={255} y={15} fontSize={8} fill="#8b5cf6">eh</text>
                  <text x={220 + (res.eps_s < 0 ? -35 : 5)} y={10 + hPx + 4} fontSize={8} fill="#8b5cf6">eb</text>
                  {res.eps_y > 0 && (
                    <line
                      x1={220 + 30}
                      y1={10 + (1 - res.eps_y / Math.max(Math.abs(res.eps_s), res.eps_y)) * hPx}
                      x2={255}
                      y2={10 + (1 - res.eps_y / Math.max(Math.abs(res.eps_s), res.eps_y)) * hPx}
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                  )}
                </>
              )}
              <DimensionLine x1={rectX} y1={10 + hPx} x2={rectX + bwPx} y2={10 + hPx} offset={12} text={`b = ${inp.b}`} />
            </SectionCanvas>
          </div>

          {res && (
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
              <div className="text-xs font-semibold text-slate-500 mb-2">Taux d'utilisation</div>
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    res.utilisation > 1.0 ? 'bg-red-500' : res.utilisation > 0.8 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, res.utilisation * 100)}%` }}
                />
              </div>
              <div className="text-xs mt-1 font-mono text-slate-500">
                {(res.utilisation * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">N_Rd</div>
                  <div className="font-bold">{res.n_rd.toFixed(1)} kN</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">M_Rd</div>
                  <div className="font-bold">{res.m_rd.toFixed(1)} kN.m</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">x/d</div>
                  <div className={`font-bold ${res.xd_ratio > res.xd_limit ? 'text-red-500' : 'text-green-500'}`}>
                    {res.xd_ratio.toFixed(3)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">x/d limit</div>
                  <div className="font-bold">{res.xd_limit.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">eps_s</div>
                  <div className={`font-bold ${res.is_ductile ? 'text-green-500' : 'text-red-500'}`}>
                    {res.eps_s.toFixed(5)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">eps_y</div>
                  <div className="font-bold">{res.eps_y.toFixed(5)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2 col-span-2">
                  <div className="text-slate-500">Utilisation</div>
                  <div className={`font-bold ${res.utilisation > 1.0 ? 'text-red-500' : 'text-green-500'}`}>
                    {(res.utilisation * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <FormulaCard
                title="Non-fragilité (Simpson)"
                latex={String.raw`M_{cr} = f_{ctm}\frac{b h^2}{6} \le M_{Rd,min}`}
                description="Fissuration vs résistance minimale"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_{Rd}`, meaning: 'Effort résistant', value: res.n_rd.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`M_{Rd}`, meaning: 'Moment résistant', value: res.m_rd.toFixed(1), unit: 'kN.m' },
                  { symbol: String.raw`x/d`, meaning: 'Axe neutre réduit', value: res.xd_ratio.toFixed(3) },
                ]}
              />
              <ul className="text-xs space-y-2">
                <li className={`font-bold ${res.xd_ratio > res.xd_limit ? 'text-red-500' : 'text-green-500'}`}>
                  — verdict: {res.verdict}
                </li>
                {res.diag && res.diag.map((d: string, i: number) => (
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
