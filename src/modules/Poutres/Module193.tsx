import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { CreepShrinkageEC2Draft7Inputs, CreepShrinkageEC2Draft7Output } from '../../types/engineering';

export default function Module193() {
  const [inp, setInp] = useState<CreepShrinkageEC2Draft7Inputs>({
    b: 300, h: 500, RH: 60, fck: 30, t0: 28, classe: 2,
  });
  const { data: res, error: err, live } = useModuleCalc<CreepShrinkageEC2Draft7Inputs, CreepShrinkageEC2Draft7Output>(
    'calculate_creep_shrinkage_ec2_draft7_193', inp,
  );
  const S = (k: keyof CreepShrinkageEC2Draft7Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof CreepShrinkageEC2Draft7Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const k = Math.min(200 / inp.b, 150 / inp.h);
  const ox = 250 - (inp.b * k) / 2, oy = 40;
  const W = inp.b * k, H = inp.h * k;

  return (
    <Workstation
      title="193 Creep Shrinkage EC2 Draft7"
      subtitle="Fluage & retrait béton — EC2 §3.1.2–3.1.4 — RUST"
      eurocode="EC2 §3.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'Largeur b', 'mm', 100, 1000, 10)}
          {slider('h', 'Hauteur h', 'mm', 100, 1000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
          {slider('RH', 'RH', '%', 20, 100, 1)}
          {slider('t0', 't0', 'jours', 1, 365, 1)}
          {slider('classe', 'Classe', '', 1, 3, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section + fluage/retrait" vbW={500} vbH={260} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
            <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
            <line x1={ox} y1={oy + H / 2} x2={ox + W} y2={oy + H / 2} stroke="#94a3b8" strokeWidth={0.7} strokeDasharray="4,3" />
            <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={22} text={`b = ${inp.b}`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-28} text={`h = ${inp.h}`} />
            {res && (
              <>
                <text x={250} y={oy + H + 40} textAnchor="middle" fontSize={11} fill="#6366F1" fontWeight="bold">
                  φ(365) = {res.phi_365.toFixed(3)} — φ(∞) = {res.phi_inf.toFixed(3)}
                </text>
                <text x={250} y={oy + H + 56} textAnchor="middle" fontSize={10} fill="#94a3b8">
                  ε_sh = {(res.eps_sh * 1000).toFixed(4)} ‰
                </text>
              </>
            )}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['φ(365,t0)', res.phi_365.toFixed(3)],
                  ['φ(∞,t0)', res.phi_inf.toFixed(3)],
                  ['ε_sh', `${(res.eps_sh * 1000).toFixed(4)} ‰`],
                  ['ε_cd0', res.eps_cd.toFixed(2)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Fluage-retrait EC2 + draft"
                latex={String.raw`\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0)`}
                description="Annexe B, t0 ajusté ciment"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varphi`, meaning: 'Fluage final', value: res.phi_inf.toFixed(3) },
                  { symbol: String.raw`\varepsilon_{cs}`, meaning: 'Retrait', value: (res.eps_sh * 1000).toFixed(4), unit: '‰' },
                  { symbol: String.raw`t_0`, meaning: 'Âge de chargement', value: inp.t0, unit: 'j' },
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
