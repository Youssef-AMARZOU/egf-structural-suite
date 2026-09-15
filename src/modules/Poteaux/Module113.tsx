import { useState } from 'react';
import type { CorbeauInputs, CorbeauOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEFAULT: CorbeauInputs = {
  phi: 16, phi_t: 8, fctd: 1.8, fyd: 435,
  bar_type: 0, s: 150, c_nom: 30, welded: 0, ga: 800,
};


export default function Module113() {
  const [inp, setInp] = useState<CorbeauInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<CorbeauInputs, CorbeauOutput>(
    'calculate_corbeau_113', inp,
  );
  const S = (k: keyof CorbeauInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof CorbeauInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="113 Corbeau"
      subtitle="Ancrage corbeau — EC2"
      eurocode="EC2"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Barreau</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
          {slider('phi_t', 'φt', 'mm', 4, 16, 1)}
          {slider('s', 's', 'mm', 50, 500, 10)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fctd', 'fctd', 'MPa', 0.5, 5, 0.1)}
          {slider('fyd', 'fyd', 'MPa', 200, 500, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Config</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Type</label>
            <select value={inp.bar_type} onChange={(e) => setInp((p) => ({ ...p, bar_type: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Droit</option><option value={1}>Coudé</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Soudé</label>
            <select value={inp.welded} onChange={(e) => setInp((p) => ({ ...p, welded: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Non</option><option value={1}>Oui</option>
            </select>
          </div>
          {slider('c_nom', 'cnom', 'mm', 10, 100, 5)}
        </div>
        {slider('ga', 'GA', 'mm', 200, 3000, 50)}
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Schéma d'ancrage" vbW={600} vbH={220}>
    {(() => {
      const LB = res ? res.lb_d0 : 40 * inp.phi;
      const L0 = res ? res.lb_d : 40 * inp.phi;
      const sc = 400 / Math.max(L0, 1);
      const ox = 80; const yBar = 95; const yConc = 60; const hConc = 80;
      return (
        <g>
          <rect x={ox} y={yConc} width={420} height={hConc} fill="#e2e8f0" opacity={0.5} stroke="#94a3b8" />
          <line x1={ox} y1={yBar - 14} x2={ox + LB * sc} y2={yBar - 14} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" />
          <line x1={ox} y1={yBar} x2={ox + L0 * sc} y2={yBar} stroke="#2563eb" strokeWidth={3} />
          <DimensionLine x1={ox} y1={yBar} x2={ox + L0 * sc} y2={yBar} offset={34} text={`Lb,d = ${L0.toFixed(0)} mm`} />
          <text x={ox} y={yConc - 8} fontSize={9} fill="#64748b">Lb,d0 = {LB.toFixed(0)} mm (tirets)</text>
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
          <h2 className="text-sm font-bold mb-2">Résultats ancrage</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,d0 = <b>{res.lb_d0.toFixed(0)}</b> mm</div>
              <div>α₁={res.alpha1} α₂={res.alpha2.toFixed(2)} α₃={res.alpha3} α₄={res.alpha4}</div>
              <div>Lb,d = <b>{res.lb_d.toFixed(0)}</b> mm</div>
              <div>Lbar = <b>{res.bar_length.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Corbeau (bielles-tirants)"
                latex={String.raw`F_{td} = F_{Ed}\frac{a}{z} + H_{Ed}`}
                description="Effort dans le tirant supérieur"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`F_{Ed}`, meaning: 'Charge verticale', value: res.fbd.toFixed(2) },
                    { symbol: String.raw`a/z`, meaning: 'Bras de levier', value: res.lb_d0.toFixed(0) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.lb_d <= res.bar_length ? 'text-green-600' : 'text-red-600'}>
              {res.lb_d <= res.bar_length
                ? `✓ Ancrage: ${res.lb_d.toFixed(0)}mm ≤ ${res.bar_length.toFixed(0)}mm`
                : `✗ Ancrage: ${res.lb_d.toFixed(0)}mm > ${res.bar_length.toFixed(0)}mm`}
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
