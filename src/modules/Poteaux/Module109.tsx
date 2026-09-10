import { useState } from 'react';
import type { BaelFaesselInputs, BaelFaesselOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: BaelFaesselInputs = {
  h: 500, bh: 1.0, fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  rho: 1.0, delta: 0.1, lam: 30, lel: 3000, ec1: 2.0,
  eh01: 3.5, eh02: 0.0, eb1: -3.5, eb2: 0.0, llim: 6000, eim: 20,
};


export default function Module109() {
  const [inp, setInp] = useState<BaelFaesselInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<BaelFaesselInputs, BaelFaesselOutput>(
    'calculate_bael_faessel_109', inp,
  );
  const S = (k: keyof BaelFaesselInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BaelFaesselInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="109 Bâton BAEL"
      subtitle="Interaction N-M — BAEL B.8.4.1 + Faessel"
      eurocode="BAEL"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('h', 'h', 'mm', 100, 2000, 50)}
          {slider('bh', 'bh', '-', 0.3, 3, 0.1)}
          {slider('delta', 'δ', '-', 0.05, 0.5, 0.01)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('rho', 'ρ', '%', 0.1, 10, 0.1)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 1.5, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Flambement</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('lam', 'λ', '-', 5, 100, 1)}
          {slider('lel', 'Lel', 'mm', 500, 15000, 100)}
          {slider('llim', 'Llim', 'mm', 1000, 20000, 100)}
          {slider('eim', 'eim', 'mm', 0, 200, 5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Recherche</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ec1', 'εc1', '‰', 1, 4, 0.1)}
          {slider('eh01', 'eh0₁', '‰', 0, 5, 0.1)}
          {slider('eh02', 'eh0₂', '‰', -5, 0, 0.1)}
          {slider('eb1', 'eb₁', '‰', -5, 0, 0.1)}
          {slider('eb2', 'eb₂', '‰', 0, 5, 0.1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Section (SVG)" vbW={200} vbH={250}>
            {(() => {
              const sc = 0.3; const ox = 100, oy = 40;
              const w = inp.bh * inp.h * sc, hh = inp.h * sc;
              const d1 = inp.delta * hh;
              return (
                <g>
                  <rect x={ox - w / 2} y={oy} width={w} height={hh} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} rx={2} />
                  <rect x={ox - w / 2 + 5} y={oy + 5} width={10} height={10} fill="#2563eb" rx={1} />
                  <rect x={ox + w / 2 - 15} y={oy + hh - 15} width={10} height={10} fill="#2563eb" rx={1} />
                  <text x={ox - w / 2 - 5} y={oy + hh / 2} textAnchor="end" fontSize={7} fill="#64748b">h={inp.h}</text>
                  <text x={ox} y={oy + hh + 12} textAnchor="middle" fontSize={7} fill="#64748b">B={(inp.bh * inp.h).toFixed(0)}</text>
                  {res && (
                    <>
                      <text x={ox} y={oy + hh + 25} textAnchor="middle" fontSize={8} fill="#2563eb" fontWeight="bold">
                        NR={res.nr.toFixed(0)}kN
                      </text>
                      <text x={ox} y={oy + hh + 35} textAnchor="middle" fontSize={8} fill="#059669">
                        NBaels={res.n_baels.toFixed(0)}kN
                      </text>
                    </>
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
              <div>NR = <b>{res.nr.toFixed(1)}</b> kN</div>
              <div>MR = <b>{res.mr.toFixed(1)}</b> kN·m</div>
              <div>NC = <b>{res.nc.toFixed(1)}</b> kN</div>
              <div>eh = <b>{res.eh_opt.toFixed(2)}</b> ‰ | eb = <b>{res.eb_opt.toFixed(2)}</b> ‰</div>
              <div>e₁ = <b>{res.e1.toFixed(1)}</b> mm | e₂ = <b>{res.e2.toFixed(1)}</b> mm</div>
              <div>σs₁ = <b>{res.sigma_s1.toFixed(0)}</b> MPa | σs₂ = <b>{res.sigma_s2.toFixed(0)}</b> MPa</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>NBaels = <b>{res.n_baels.toFixed(1)}</b> kN</div>
              <div>α (flambement) = <b>{res.alpha.toFixed(3)}</b></div>
              <div>Δe = <b>{res.de.toFixed(3)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Poteau BAEL (Faessel)"
                latex={String.raw`\alpha = \frac{0.85}{1 + 0.2(\lambda/35)^2}`}
                description="Coefficient de flambement BAEL"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`\lambda`, meaning: 'Élancement', value: res.nr.toFixed(1) },
                    { symbol: String.raw`\alpha`, meaning: 'Coefficient réducteur', value: res.alpha.toFixed(3) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.nr > 0 ? 'text-green-600' : 'text-red-600'}>
              {res.nr > 0 ? `✓ NR = ${res.nr.toFixed(1)} kN` : '✗ Pas de solution'}
            </li>
            <li className={inp.lam < 70 ? 'text-green-600' : 'text-red-600'}>
              {inp.lam < 70 ? `✓ λ = ${inp.lam} < 70` : `✗ λ = ${inp.lam} > 70 — BAEL interdit`}
            </li>
            <li className="text-slate-500">• ρ = {inp.rho}% | α = {res.alpha.toFixed(3)}</li>
            <li className="text-slate-500">• e₁ = {res.e1.toFixed(1)}mm | e₂ = {res.e2.toFixed(1)}mm</li>
            <li className="text-slate-500">• σs₁ = {res.sigma_s1.toFixed(0)} MPa</li>
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
