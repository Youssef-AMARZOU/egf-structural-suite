import { useState } from 'react';
import type { PredalleInputs, PredalleOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: PredalleInputs = {
  phi: 12, fctm: 2.9, gc: 1.5, sigma_sd: 360,
  c_nom: 25, phi_t: 6, exposure: 1, fck: 30, duration: 50, binder: 0,
};


export default function Module119() {
  const [inp, setInp] = useState<PredalleInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PredalleInputs, PredalleOutput>(
    'calculate_predalle_119', inp,
  );
  const S = (k: keyof PredalleInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PredalleInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="119 Prédalle"
      subtitle="Recouvrement prédalle — EC2 §8.4"
      eurocode="EC2 §8.4"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Barreau</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
          {slider('phi_t', 'φt', 'mm', 4, 16, 1)}
          {slider('c_nom', 'cnom', 'mm', 10, 100, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fctm', 'fctm', 'MPa', 1, 6, 0.1)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('sigma_sd', 'σsd', 'MPa', 100, 500, 10)}
          {slider('gc', 'γc', '-', 1.0, 2.0, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Environnement</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('exposure', 'Expo', '-', 0, 6, 1)}
          {slider('duration', 'Durée', 'ans', 1, 200, 10)}
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Liant</label>
            <select value={inp.binder} onChange={(e) => setInp((p) => ({ ...p, binder: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Normal</option><option value={1}>Bas chaleur</option>
            </select>
          </div>
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Schéma d'ancrage" vbW={600} vbH={220}>
    {(() => {
      const LB = res ? res.lb_rqd : 40 * inp.phi;
      const L0 = res ? res.l0 : 40 * inp.phi;
      const sc = 400 / Math.max(L0, 1);
      const ox = 80; const yBar = 95; const yConc = 60; const hConc = 80;
      return (
        <g>
          <rect x={ox} y={yConc} width={420} height={hConc} fill="#e2e8f0" opacity={0.5} stroke="#94a3b8" />
          <line x1={ox} y1={yBar - 14} x2={ox + LB * sc} y2={yBar - 14} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" />
          <line x1={ox} y1={yBar} x2={ox + L0 * sc} y2={yBar} stroke="#2563eb" strokeWidth={3} />
          <DimensionLine x1={ox} y1={yBar} x2={ox + L0 * sc} y2={yBar} offset={34} text={`l0 = ${L0.toFixed(0)} mm`} />
          <text x={ox} y={yConc - 8} fontSize={9} fill="#64748b">lb,rqd = {LB.toFixed(0)} mm (tirets)</text>
          {res && (
            <text x={ox} y={yConc + hConc + 34} fontSize={10} fill="#2563eb" fontWeight="bold">
              fbd={res.fbd.toFixed(2)} MPa
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
          <h2 className="text-sm font-bold mb-2">Résultats recouvrement</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,rqd = <b>{res.lb_rqd.toFixed(0)}</b> mm</div>
              <div>α₂={res.alpha2.toFixed(2)} α₃={res.alpha3} α₆={res.alpha6}</div>
              <div>L₀ = <b>{res.l0.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Recouvrement prédalle"
                latex={String.raw`l_0 = \alpha_1 \alpha_2 \alpha_3 \alpha_5 \alpha_6 \, l_{b,rqd}`}
                description="Jonction dalle coulée en place"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`l_0`, meaning: 'Longueur de recouvrement', value: res.l0.toFixed(0) },
                    { symbol: String.raw`l_{b,rqd}`, meaning: 'Ancrage de référence', value: res.lb_rqd.toFixed(0) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ L₀ = {res.l0.toFixed(0)}mm (min 15φ = {(15 * inp.phi).toFixed(0)}mm)</li>
            <li className="text-slate-500">• fbd = {res.fbd.toFixed(2)} MPa</li>
            <li className="text-slate-500">• Lb,rqd = {res.lb_rqd.toFixed(0)} mm</li>
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
