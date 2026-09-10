import { useState } from 'react';
import type { SemellePortanteInputs, SemellePortanteOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: SemellePortanteInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  b: 1.5, l: 2.0, d: 0.4, h: 0.5,
  n_ed: 500, m_ed: 100, v_ed: 50,
  gamma_g: 1.35, gamma_q: 1.5, g_k: 200, q_k: 100,
};


export default function Module142() {
  const [inp, setInp] = useState<SemellePortanteInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<SemellePortanteInputs, SemellePortanteOutput>(
    'calculate_semelle_portante_142', inp,
  );
  const S = (k: keyof SemellePortanteInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio_sigma <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof SemellePortanteInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="142 Semelle Portante"
      subtitle="Force portante semelle — EC2/EC7"
      eurocode="EC7"
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
          {slider('b', 'b', 'm', 0.5, 5, 0.1)}
          {slider('l', 'l', 'm', 0.5, 5, 0.1)}
          {slider('d', 'd', 'm', 0.1, 2, 0.05)}
          {slider('h', 'h', 'm', 0.1, 2, 0.05)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n_ed', 'NEd', 'kN', 0, 10000, 50)}
          {slider('m_ed', 'MEd', 'kN·m', 0, 5000, 10)}
          {slider('v_ed', 'VEd', 'kN', 0, 5000, 10)}
          {slider('gamma_g', 'γG', '-', 1, 2, 0.05)}
          {slider('gamma_q', 'γQ', '-', 1, 2, 0.05)}
          {slider('g_k', 'Gk', 'kN', 0, 10000, 50)}
          {slider('q_k', 'Qk', 'kN', 0, 10000, 50)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Schéma — Semelle" vbW={500} vbH={200}>
            {res && (() => {
              const ox = 80, oy = 20, w = 340, h = 160;
              const bPx = Math.min(w * 0.8, inp.b * 100);
              const hPx = Math.min(h * 0.6, inp.h * 80);
              const cx = ox + w / 2;
              const baseY = oy + h - 20;

              return (
                <g>
                  <line x1={ox} y1={baseY} x2={ox + w} y2={baseY} stroke="#94a3b8" strokeWidth={0.5} />

                  <rect x={cx - bPx / 2} y={baseY - hPx} width={bPx} height={hPx} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />

                  <line x1={cx} y1={baseY - hPx - 30} x2={cx} y2={baseY - hPx} stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrowR)" />
                  <text x={cx + 5} y={baseY - hPx - 35} fontSize={8} fill="#ef4444" fontWeight="bold">
                    NEd = {res.n_ed_design.toFixed(0)} kN
                  </text>

                  <line x1={cx - bPx / 2 - 20} y1={baseY} x2={cx - bPx / 2 - 20} y2={baseY + 15} stroke="#22c55e" strokeWidth={1} />
                  <text x={cx - bPx / 2 - 25} y={baseY + 25} textAnchor="middle" fontSize={7} fill="#22c55e">
                    b = {inp.b}m
                  </text>

                  <line x1={cx + bPx / 2 + 5} y1={baseY - hPx} x2={cx + bPx / 2 + 25} y2={baseY - hPx} stroke="#2563eb" strokeWidth={1} />
                  <text x={cx + bPx / 2 + 30} y={baseY - hPx + 3} fontSize={7} fill="#2563eb">
                    d = {inp.d}m
                  </text>

                  <text x={cx} y={baseY + 15} textAnchor="middle" fontSize={8} fill="#64748b">
                    σed = {res.sigma_ed.toFixed(3)} MPa | fcd = {res.fcd.toFixed(2)} MPa
                  </text>

                  <rect x={ox} y={baseY + 2} width={w * res.ratio_sigma} height={4} fill={res.ratio_sigma > 0.8 ? '#ef4444' : '#22c55e'} rx={2} />
                  <text x={ox + w * res.ratio_sigma + 5} y={baseY + 8} fontSize={7} fill="#64748b">
                    {(res.ratio_sigma * 100).toFixed(0)}%
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
              <div>NEd,d = <b>{res.n_ed_design.toFixed(1)}</b> kN | MEd,d = <b>{res.m_ed_design.toFixed(1)}</b> kN·m</div>
              <div>fcd = <b>{res.fcd.toFixed(2)}</b> MPa | fyd = <b>{res.fyd.toFixed(1)}</b> MPa</div>
              <div>σed = <b>{res.sigma_ed.toFixed(3)}</b> MPa | e/l = <b>{res.e_ratio.toFixed(2)}</b></div>
              <div>MRd = <b>{res.mr_d.toFixed(1)}</b> kN·m | VRd = <b>{res.vr_d.toFixed(1)}</b> kN</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Fondation superficielle (EC7)"
                latex={String.raw`q_{Ed} = \frac{N}{A} \pm \frac{M}{W} \le q_{Rd}`}
                description="Contrainte de référence au sol"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`q_{Ed}`, meaning: 'Contrainte appliquée', value: res.n_ed_design.toFixed(1) },
                    { symbol: String.raw`q_{Rd}`, meaning: 'Capacité portante', value: res.m_ed_design.toFixed(1) },
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
              <li className={res.ratio_sigma <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_sigma <= 1.0 ? '✓' : '✗'} σed/fcd = {(res.ratio_sigma * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_m <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_m <= 1.0 ? '✓' : '✗'} MEd/MRd = {(res.ratio_m * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} VEd/VRd = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• fcd = {res.fcd.toFixed(2)} MPa</li>
              <li className="text-slate-500">• fyd = {res.fyd.toFixed(1)} MPa</li>
              <li className="text-slate-500">• e/l = {res.e_ratio.toFixed(2)}</li>
              <li className="text-slate-500">• MRd = {res.mr_d.toFixed(1)} kN·m</li>
              <li className="text-slate-500">• VRd = {res.vr_d.toFixed(1)} kN</li>
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
