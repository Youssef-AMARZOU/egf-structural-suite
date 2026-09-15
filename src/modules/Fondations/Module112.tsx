import { useState } from 'react';
import type { SemelAncrageInputs, SemelAncrageOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: SemelAncrageInputs = {
  a: 400, b: 400, d: 350,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  c_nom: 30, phi: 16, phi_t: 8,
  exposure: 1, welded: 0, hook_angle: 0,
};


export default function Module112() {
  const [inp, setInp] = useState<SemelAncrageInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<SemelAncrageInputs, SemelAncrageOutput>(
    'calculate_semel_ancrage_112', inp,
  );
  const S = (k: keyof SemelAncrageInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof SemelAncrageInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="112 Semelle Ancrage"
      subtitle="Longueur d'ancrage — EC2"
      eurocode="EC2 §8.4"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('a', 'a', 'mm', 100, 2000, 50)}
          {slider('b', 'b', 'mm', 100, 2000, 50)}
          {slider('d', 'd', 'mm', 100, 2000, 10)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1.0, 2.0, 0.05)}
          {slider('gs', 'γs', '-', 1.0, 1.5, 0.05)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
          {slider('phi_t', 'φt', 'mm', 4, 16, 1)}
          {slider('c_nom', 'cnom', 'mm', 10, 100, 5)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Soudé</label>
            <select value={inp.welded} onChange={(e) => setInp((p) => ({ ...p, welded: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Non</option><option value={1}>Oui</option>
            </select>
          </div>
          {slider('hook_angle', 'θ', '°', 0, 180, 15)}
          {slider('exposure', 'Expo', '-', 0, 6, 1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan ancrage (live SVG)" vbW={300} vbH={250}>
            {(() => {
              const sc = 0.3; const ox = 150, oy = 125;
              const a = inp.a * sc, b = inp.b * sc;
              return (
                <g>
                  <rect x={ox - a / 2 - 20} y={oy - b / 2 - 20} width={a + 40} height={b + 40}
                    fill="#e2e8f0" opacity={0.3} rx={4} />
                  <rect x={ox - a / 2} y={oy - b / 2} width={a} height={b}
                    fill="#1e40af" rx={2} />
                  <text x={ox} y={oy + 3} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                    {inp.a}×{inp.b}
                  </text>
                  {res && (
                    <>
                      <text x={ox} y={oy - b / 2 - 8} textAnchor="middle" fontSize={7} fill="#2563eb">
                        Lb,d={res.lb_d.toFixed(0)}mm
                      </text>
                      <line x1={ox - a / 2} y1={oy - b / 2 - 25} x2={ox + a / 2} y2={oy - b / 2 - 25}
                        stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#arrow)" />
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
          <h2 className="text-sm font-bold mb-2">Résultats ancrage</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,d0 = <b>{res.lb_d0.toFixed(0)}</b> mm</div>
              <div>α₁={res.alpha1} α₂={res.alpha2.toFixed(2)} α₃={res.alpha3} α₄={res.alpha4}</div>
              <div>α comb = <b>{res.alpha_comb.toFixed(3)}</b></div>
              <div>Lb,d = <b>{res.lb_d.toFixed(0)}</b> mm</div>
              <div>Lbar = <b>{res.bar_length.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Ancrage droit (EC2 §8.4)"
                latex={String.raw`l_{bd} = \alpha_1 \alpha_2 \alpha_3 \alpha_4 \alpha_5 \, l_{b,rqd} \ge l_{b,min}`}
                description="Longueur d'ancrage de calcul"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`l_{b,rqd}`, meaning: 'Ancrage de référence', value: res.fbd.toFixed(2) },
                    { symbol: String.raw`l_{b,min}`, meaning: 'Minimum réglementaire', value: res.lb_d0.toFixed(0) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.lb_d <= res.bar_length ? 'text-green-600' : 'text-red-600'}>
              {res.lb_d <= res.bar_length
                ? `✓ Ancrage: Lb,d=${res.lb_d.toFixed(0)}mm ≤ Lbar=${res.bar_length.toFixed(0)}mm`
                : `✗ Ancrage: Lb,d=${res.lb_d.toFixed(0)}mm > Lbar=${res.bar_length.toFixed(0)}mm`}
            </li>
            <li className="text-slate-500">• fbd = {res.fbd.toFixed(2)} MPa</li>
            <li className="text-slate-500">• fyd = {res.fyd.toFixed(0)} MPa</li>
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
