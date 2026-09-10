import { useState } from 'react';
import type { NFilesOuvertures3Inputs, NFilesOuvertures3Output } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: NFilesOuvertures3Inputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  gh: 3000, h: 200, l: 4000,
  net: 4, nu: 3,
  i1: 0.001, i2: 0.001, i3: 0.001,
  s1: 0.1, s2: 0.1, s3: 0.1,
  e: 200, p1: 100, e1: 50,
  p2: 100, e2: 50, p3: 100, e3: 50,
};


export default function Module149() {
  const [inp, setInp] = useState<NFilesOuvertures3Inputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<NFilesOuvertures3Inputs, NFilesOuvertures3Output>(
    'calculate_n_files_ouvertures_3_149', inp,
  );
  const S = (k: keyof NFilesOuvertures3Inputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio_s <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof NFilesOuvertures3Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="149 N Files Ouvertures"
      subtitle="Voile 3 refends — Henry Thonier"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('gh', 'GH', 'mm', 500, 20000, 100)}
          {slider('h', 'h', 'mm', 50, 500, 10)}
          {slider('l', 'L', 'mm', 500, 20000, 100)}
          {slider('net', 'Net', '-', 1, 20, 1)}
          {slider('nu', 'Nu', '-', 1, 10, 1)}
          {slider('i1', 'I1', 'm⁴', 0.0001, 0.1, 0.001)}
          {slider('i2', 'I2', 'm⁴', 0.0001, 0.1, 0.001)}
          {slider('i3', 'I3', 'm⁴', 0.0001, 0.1, 0.001)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('p1', 'P1', 'kN', 0, 1000, 10)}
          {slider('p2', 'P2', 'kN', 0, 1000, 10)}
          {slider('p3', 'P3', 'kN', 0, 1000, 10)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe — 3 Refends" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const s = 0.08;
              const ghPx = (inp.gh / 1000) * s * 1000;
              const hPx = (inp.h / 1000) * s * 1000;

              return (
                <g>
                  <rect x={ox} y={oy} width={w} height={hPx * 3 + 40} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <rect x={ox} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />
                  <rect x={ox + w / 2 - hPx / 2} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />
                  <rect x={ox + w - hPx} y={oy + 10} width={hPx} height={hPx * 3 + 20} fill="#2563eb" fillOpacity={0.3} stroke="#2563eb" strokeWidth={1} />

                  <text x={ox + w / 2} y={oy + hPx * 3 + 50} textAnchor="middle" fontSize={7} fill="#64748b">
                    3 refends | GH={(inp.gh / 1000).toFixed(1)}m | L={(inp.l / 1000).toFixed(1)}m
                  </text>
                  <text x={ox + w / 2} y={oy + hPx * 3 + 60} textAnchor="middle" fontSize={7} fill="#64748b">
                    V_max={res.v_max.toFixed(2)}kN | f_max={res.f_max.toFixed(3)}mm
                  </text>
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
              <div>s_Rd = <b>{res.s_rd.toFixed(2)}</b> MPa</div>
              <div>M1_max = <b>{res.m1_max.toFixed(2)}</b> kN·m | M2_max = <b>{res.m2_max.toFixed(2)}</b> kN·m</div>
              <div>N1_max = <b>{res.n1_max.toFixed(2)}</b> kN | N2_max = <b>{res.n2_max.toFixed(2)}</b> kN</div>
              <div>V_max = <b>{res.v_max.toFixed(2)}</b> kN</div>
              <div>f_max = <b>{res.f_max.toFixed(3)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Voile à ouvertures, 3 refends"
                latex={String.raw`M_{tot} = \sum M_i`}
                description="Méthode Henry Thonier 1994"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`M_{tot}`, meaning: 'Moment total', value: res.s_rd.toFixed(2) },
                    { symbol: String.raw`M_i`, meaning: 'Part par refend', value: res.m1_max.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <div className="space-y-2">
            {res.diag.map((d, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className={res.ratio_s <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_s <= 1.0 ? '✓' : '✗'} V/V_Rd = {(res.ratio_s * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_f <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_f <= 1.0 ? '✓' : '✗'} f/f_lim = {(res.ratio_f * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• s_Rd = {res.s_rd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• M1_max = {res.m1_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• M2_max = {res.m2_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• M3_max = {res.m3_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• N1_max = {res.n1_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• V_max = {res.v_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• f_max = {res.f_max.toFixed(3)} mm</li>
            </ul>
          </div>
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
