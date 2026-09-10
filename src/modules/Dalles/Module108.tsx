import { useState } from 'react';
import type { NavierInputs, NavierOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: NavierInputs = {
  h: 200, e: 30000, nu: 0.2,
  la: 6.0, lb: 5.0,
  q: 5.0, a1: 1.0, a2: 3.0, b1: 1.0, b2: 4.0,
  x: 3.0, y: 2.5, n_terms: 20,
};


export default function Module108() {
  const [inp, setInp] = useState<NavierInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<NavierInputs, NavierOutput>(
    'calculate_navier_108', inp,
  );
  const S = (k: keyof NavierInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof NavierInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="108 Navier"
      subtitle="Série de Navier — dalle rectangulaire"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dalle</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('h', 'h', 'mm', 80, 800, 10)}
          {slider('e', 'E', 'MPa', 5000, 50000, 1000)}
          {slider('nu', 'ν', '-', 0, 0.5, 0.01)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('la', 'LA', 'm', 1, 30, 0.5)}
          {slider('lb', 'LB', 'm', 1, 30, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charge</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('q', 'q', 'kPa', 0, 100, 0.5)}
          {slider('a1', 'A1', 'm', 0, 30, 0.1)}
          {slider('a2', 'A2', 'm', 0, 30, 0.1)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b1', 'B1', 'm', 0, 30, 0.1)}
          {slider('b2', 'B2', 'm', 0, 30, 0.1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Point d'éval</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('x', 'X', 'm', 0, 30, 0.1)}
          {slider('y', 'Y', 'm', 0, 30, 0.1)}
          {slider('n_terms', 'Termes', '-', 5, 50, 1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan (live SVG)" vbW={300} vbH={250}>
            {(() => {
              const sc = 30; const ox = 30, oy = 25;
              const la = inp.la * sc, lb = inp.lb * sc;
              const a1 = inp.a1 * sc, a2 = inp.a2 * sc, b1 = inp.b1 * sc, b2 = inp.b2 * sc;
              return (
                <g>
                  <rect x={ox} y={oy} width={la} height={lb} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
                  <rect x={ox + a1} y={oy + b1} width={a2 - a1} height={b2 - b1} fill="#dc2626" opacity={0.3} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 2" />
                  <circle cx={ox + inp.x * sc} cy={oy + inp.y * sc} r={4} fill="#2563eb" stroke="#fff" strokeWidth={1.5} />
                  <text x={ox + la / 2} y={oy - 5} textAnchor="middle" fontSize={8} fill="#64748b">LA={inp.la}m</text>
                  <text x={ox - 5} y={oy + lb / 2} textAnchor="middle" fontSize={8} fill="#64748b" transform={`rotate(-90 ${ox - 5} ${oy + lb / 2})`}>LB={inp.lb}m</text>
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
              <div>Mx = <b>{res.mx.toFixed(2)}</b> kNm/m</div>
              <div>My = <b>{res.my.toFixed(2)}</b> kNm/m</div>
              <div>Mxy = <b>{res.mxy.toFixed(2)}</b> kNm/m</div>
              <div>w = <b>{res.w.toFixed(2)}</b> mm</div>
              <div>D = <b>{res.d_rig.toFixed(1)}</b> kNm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Plaque de Navier"
                latex={String.raw`w(x,y) = \sum_{m,n} a_{mn} \sin\frac{m\pi x}{a}\sin\frac{n\pi y}{b}`}
                description="Double série sinus sur dalle articulée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`a_{mn}`, meaning: 'Amplitude modale', value: res.mx.toFixed(2) },
                    { symbol: String.raw`D`, meaning: 'Rigidité de flexion', value: res.my.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.w < inp.h / 1000.0 * 500 ? 'text-green-600' : 'text-red-600'}>
              {res.w < inp.h / 1000.0 * 500 ? '✓ Flèche acceptable' : '✗ Flèche excessive'}
            </li>
            <li className="text-slate-500">• M_max = {res.m_max.toFixed(2)} kNm/m</li>
            <li className="text-slate-500">• D = {res.d_rig.toFixed(1)} kNm</li>
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
