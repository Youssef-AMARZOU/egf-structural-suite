import { useState } from 'react';
import type { FileOuverturesInputs, FileOuverturesOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: FileOuverturesInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  gh: 3000, h: 200, bl: 200, hl: 300,
  l: 1000, ab1: 50, h1: 300, s1: 0.1,
  i1: 0.001, ab2: 50, h2: 300, s2: 0.1,
  i2: 0.001, e: 200, ep: 200,
  p1: 100, e1: 50, p2: 100, e2: 50,
  ome: 0.5,
};


export default function Module148() {
  const [inp, setInp] = useState<FileOuverturesInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<FileOuverturesInputs, FileOuverturesOutput>(
    'calculate_file_ouvertures_148', inp,
  );
  const S = (k: keyof FileOuverturesInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FileOuverturesInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="148 File Ouvertures"
      subtitle="Voile 2 refends — Henry Thonier 1994"
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
          {slider('l', 'L', 'mm', 100, 5000, 50)}
          {slider('h1', 'H1', 'mm', 50, 500, 10)}
          {slider('h2', 'H2', 'mm', 50, 500, 10)}
          {slider('e', 'e', 'mm', 50, 500, 10)}
          {slider('ome', 'ω', '-', 0.01, 2, 0.01)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('p1', 'P1', 'kN', 0, 1000, 10)}
          {slider('p2', 'P2', 'kN', 0, 1000, 10)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Diagramme M-V" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const gmMax = Math.max(...res.gm.map(Math.abs), 0.001);

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={ox} y1={oy + h / 2} x2={ox + w} y2={oy + h / 2} stroke="#94a3b8" strokeWidth={0.5} />

                  <text x={ox - 5} y={oy + 5} textAnchor="end" fontSize={6} fill="#94a3b8">GM</text>
                  <text x={ox + w / 2} y={oy + h + 12} textAnchor="middle" fontSize={6} fill="#94a3b8">x/GH</text>

                  <polyline
                    points={res.x_ks.map((x, i) => `${ox + x * w},${oy + h / 2 - (res.gm[i] / gmMax) * (h / 2)}`).join(' ')}
                    fill="none" stroke="#2563eb" strokeWidth={1.5}
                  />
                  <polyline
                    points={res.x_ks.map((x, i) => `${ox + x * w},${oy + h / 2 - (res.gv[i] / gmMax) * (h / 2)}`).join(' ')}
                    fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,4"
                  />
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
              <div>α = <b>{res.alpha.toFixed(3)}</b> | ω = {res.omega.toFixed(3)}</div>
              <div>GM_max = <b>{res.gm_max.toFixed(2)}</b> kN·m</div>
              <div>GV_max = <b>{res.gv_max.toFixed(2)}</b> kN</div>
              <div>GN_max = <b>{res.gn_max.toFixed(2)}</b> kN</div>
              <div>f_max = <b>{res.f_max.toFixed(3)}</b> mm</div>
              <div>I12 = {res.i12.toFixed(3)}</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Voile à ouvertures (Thonier)"
                latex={String.raw`M_{tot} = \sum M_i`}
                description="Répartition entre refends, 2 files"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`M_{tot}`, meaning: 'Moment total', value: res.alpha.toFixed(3) },
                    { symbol: String.raw`M_i`, meaning: 'Part par refend', value: res.omega.toFixed(3) },
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
              <li className="text-slate-500">• α = {res.alpha.toFixed(3)}</li>
              <li className="text-slate-500">• ω = {res.omega.toFixed(3)}</li>
              <li className="text-slate-500">• GM_max = {res.gm_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• GV_max = {res.gv_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• GN_max = {res.gn_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• f_max = {res.f_max.toFixed(3)} mm</li>
              <li className="text-slate-500">• I12 = {res.i12.toFixed(3)}</li>
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
