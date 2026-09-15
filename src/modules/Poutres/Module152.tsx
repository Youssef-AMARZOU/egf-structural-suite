import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup, StressStrainBlock, DiagramOverlay,
} from '../../components/drafting';

interface InputState {
  fck: number;
  b: number;
  h: number;
  bw: number;
  hf: number;
  t1: number;
  too: number;
  cement_class: string;
  rh: number;
  ecm: number;
  pl: number;
  m: number;
  n0: number;
  aci: number;
  acs: number;
  d: number;
  dp: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  b: 300.0,
  h: 500.0,
  bw: 200.0,
  hf: 0.0,
  t1: 365.0,
  too: 28.0,
  cement_class: '42,5',
  rh: 60.0,
  ecm: 33.0,
  pl: 1400.0,
  m: 100.0,
  n0: 0.0,
  aci: 300.0,
  acs: 600.0,
  d: 440.0,
  dp: 60.0,
};

interface Res152 {
  ec_eff: number; neq: number; phi: number; bh: number;
  x_na: number; i_cr: number; verdict: string; diag: string[];
}

const BAR_PHI = 20;

export default function Module152() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InputState, Res152>(
    'calculate_fleche_recom_prof_152', inp,
  );

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const beamH = inp.h;
  const bwPx = Math.max(20, (inp.bw / inp.b) * 100);
  const hPx = 120;
  const k = hPx / beamH;
  const hfPx = Math.max(0, Math.min(40, (inp.hf / beamH) * 120));
  const xNaPx = res ? Math.max(0, Math.min(hPx, (res.x_na / beamH) * hPx)) : hPx / 2;
  const ySteel = 10 + hPx - 15;

  const creep = res && res.phi > 0 ? (() => {
    const phiMax = res.phi * 1.5;
    const pts: [number, number][] = [];
    for (let t = 1; t <= 365; t += 5) {
      const xPx = 40 + (t / 365) * 240;
      const bctto = t <= inp.too ? 0.0 : (t - inp.too) / (res.bh + t - inp.too);
      pts.push([xPx, 100 - (res.phi * Math.max(0, bctto) / phiMax) * 90]);
    }
    return { pts, yEnd: 100 - (res.phi / phiMax) * 90 };
  })() : null;

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="152 Flèche recommandée prof"
      subtitle="D'après EGF N°152 © Henry Thonier — RUST"
      eurocode="EC2 §7.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('fck', 'fck', 'MPa', 10, 80, 1)}
          {slider('b', 'b', 'mm', 100, 2000, 10)}
          {slider('h', 'h', 'mm', 100, 2000, 10)}
          {slider('bw', 'bw', 'mm', 0, 2000, 10)}
          {slider('hf', 'hf', 'mm', 0, 500, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériau</div>
          <div className="text-[10px] text-slate-500 mb-1">Ciment</div>
          <div className="flex gap-1 flex-wrap">
            {['R', '32,5', '42,5', '42,5N', '52,5'].map((c) => (
              <button
                key={c}
                onClick={() => setInp((p) => ({ ...p, cement_class: c }))}
                className={`px-2 py-1 rounded text-[10px] border transition ${
                  inp.cement_class === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {slider('rh', 'RH', '%', 20, 100, 5)}
          {slider('ecm', 'Ecm', 'GPa', 10, 50, 0.5)}
          {slider('pl', 'Périmètre pl', 'mm', 0, 50000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Maturité</div>
          {slider('t1', 't1', 'j', 1, 99999, 1)}
          {slider('too', 'too', 'j', 1, 9999, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation</div>
          {slider('m', 'M', 'kN.m', 0, 10000, 5)}
          {slider('n0', 'N0', 'kN', -5000, 5000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Armatures</div>
          {slider('aci', 'As com', 'mm2', 0, 5000, 50)}
          {slider('acs', 'As ten', 'mm2', 0, 5000, 50)}
          {slider('d', 'd', 'mm', 50, 2000, 5)}
          {slider('dp', "d'", 'mm', 20, 500, 5)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section fissurée" vbW={300} vbH={160} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
              {hfPx > 0 ? (
                <>
                  <rect x={150 - 50} y={10} width={100} height={hfPx} fill="#60a5fa" opacity={0.3} stroke="#3b82f6" strokeWidth={1} />
                  <rect x={150 - bwPx / 2} y={10 + hfPx} width={bwPx} height={hPx - hfPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
                </>
              ) : (
                <rect x={150 - 50} y={10} width={100} height={hPx} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1} />
              )}
              {res && <StressStrainBlock x={100} yTop={10} hPx={hPx} xNa={xNaPx} wPx={40} />}
              {res && res.x_na > 0 && res.x_na < beamH && (
                <text x={225} y={14 + xNaPx} fontSize={10} fill="#ef4444" fontWeight="bold">
                  x={res.x_na.toFixed(1)}
                </text>
              )}
              <RebarGroup
                bars={[
                  ...(inp.aci > 0 ? [
                    { x: 150 - bwPx / 4, y: 25, phi: BAR_PHI },
                    { x: 150 + bwPx / 4, y: 25, phi: BAR_PHI },
                  ] : []),
                  ...(inp.acs > 0 ? [
                    { x: 150 - bwPx / 4, y: ySteel, phi: BAR_PHI },
                    { x: 150 + bwPx / 4, y: ySteel, phi: BAR_PHI },
                  ] : []),
                ]}
                pxPerMm={k}
              />
              <DimensionLine x1={100} y1={10 + hPx} x2={200} y2={10 + hPx} offset={12} text={`b = ${inp.b}`} />
              <DimensionLine x1={100} y1={10} x2={100} y2={10 + hPx} offset={-24} text={`h = ${inp.h}`} />
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Fluage vs. Temps" vbW={300} vbH={120} grid={20}>
              <line x1={40} y1={100} x2={280} y2={100} stroke="#475569" strokeWidth={1} />
              <line x1={40} y1={10} x2={40} y2={100} stroke="#475569" strokeWidth={1} />
              <text x={160} y={115} textAnchor="middle" fontSize={8} fill="#94a3b8">Temps (jours)</text>
              <text x={12} y={55} textAnchor="middle" fontSize={8} fill="#94a3b8" transform="rotate(-90 12 55)">phi(t)</text>
              {creep && (
                <>
                  <DiagramOverlay type="deflection" points={creep.pts} color="#3b82f6" />
                  <circle cx={280} cy={creep.yEnd} r={3} fill="#ef4444" />
                  <text x={285} y={creep.yEnd + 3} fontSize={8} fill="#ef4444">
                    phi={res?.phi.toFixed(2)}
                  </text>
                </>
              )}
            </SectionCanvas>
          </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Ec_eff', `${res.ec_eff.toFixed(1)} GPa`],
                  ['neq', res.neq.toFixed(2)],
                  ['phi (fluage)', res.phi.toFixed(3)],
                  ['bh', `${res.bh.toFixed(0)} mm`],
                  ['x_NA', `${res.x_na.toFixed(2)} mm`],
                  ['I_cr', `${res.i_cr.toFixed(0)} mm4`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flèche admissible"
                latex={String.raw`f \le L/250`}
                description="Module effectif + fluage/retrait"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varphi`, meaning: 'Fluage', value: res.phi.toFixed(3) },
                  { symbol: String.raw`x_{NA}`, meaning: 'Axe neutre', value: res.x_na.toFixed(2), unit: 'mm' },
                  { symbol: String.raw`E_{c,eff}`, meaning: 'Module différé', value: res.ec_eff.toFixed(1), unit: 'GPa' },
                ]}
              />
              <ul className="text-xs space-y-2">
                <li className="text-slate-500">— verdict: {res.verdict}</li>
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
