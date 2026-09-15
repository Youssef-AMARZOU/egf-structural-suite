import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { PlancherMetalliqueInputs, PlancherMetalliqueOutput } from '../../types/engineering';

const IPES = ['AUTO', 'IPE 80', 'IPE 100', 'IPE 120', 'IPE 140', 'IPE 160', 'IPE 180', 'IPE 200', 'IPE 220', 'IPE 240', 'IPE 270', 'IPE 300', 'IPE 330', 'IPE 360', 'IPE 400', 'IPE 450', 'IPE 500', 'IPE 550', 'IPE 600'];

export default function Module237() {
  const [inp, setInp] = useState<PlancherMetalliqueInputs>({
    l: 6, w: 12, p: 0, fy: 275, profil: -1, lim_fleche: 250,
  });
  const { data: res, error: err, live } = useModuleCalc<PlancherMetalliqueInputs, PlancherMetalliqueOutput>(
    'calculate_plancher_metallique_237', inp,
  );
  const S = (k: keyof PlancherMetalliqueInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const worst = res ? Math.max(res.ratio_m, res.ratio_v, res.ratio_f) : 0;
  const status = err ? 'fail' : !res ? 'computing' : worst > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PlancherMetalliqueInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  const bars = res ? [
    { label: 'Flexion', r: res.ratio_m, col: '#3B82F6' },
    { label: 'Cisaillement', r: res.ratio_v, col: '#7C3AED' },
    { label: 'Flèche', r: res.ratio_f, col: '#F59E0B' },
  ] : [];

  return (
    <Workstation
      title="237 Plancher métallique (IPE)"
      subtitle="EC3 — flexion / cisaillement / flèche, choix auto du profilé — RUST"
      eurocode="EC3 §6"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Solive</div>
          {slider('l', 'Portée', 'm', 1, 20, 0.25)}
          {slider('w', 'w', 'kN/m', 0, 100, 1)}
          {slider('p', 'P centre', 'kN', 0, 200, 1)}
          {slider('fy', 'fy', 'MPa', 235, 460, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Choix</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Profilé</label>
            <select
              value={inp.profil}
              onChange={(e) => setInp({ ...inp, profil: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
            >
              {IPES.map((s, i) => <option key={s} value={i - 1}>{s}</option>)}
            </select>
          </div>
          {slider('lim_fleche', 'Limite flèche L/', '-', 150, 500, 10)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title={`Taux d'utilisation${res ? ` — ${res.profil}` : ''}`} vbW={400} vbH={160}>
            {res ? (
              <g>
                {bars.map((b, i) => (
                  <g key={b.label}>
                    <text x={10} y={38 + i * 42} fontSize={10} fill="#94a3b8">{b.label}</text>
                    <rect x={110} y={22 + i * 42} width={230} height={20} fill="#F1F5F9" opacity={0.3} stroke="#64748b" />
                    <rect
                      x={110} y={22 + i * 42} width={Math.min(b.r, 1.25) * 230 / 1.25} height={20}
                      fill={b.r <= 1 ? b.col : '#EF4444'}
                    />
                    <line
                      x1={110 + 230 / 1.25} y1={18 + i * 42}
                      x2={110 + 230 / 1.25} y2={46 + i * 42}
                      stroke="#e2e8f0" strokeWidth={2}
                    />
                    <text x={345} y={37 + i * 42} fontSize={10} fill={b.r <= 1 ? '#94a3b8' : '#EF4444'}>
                      {(b.r * 100).toFixed(0)}%
                    </text>
                  </g>
                ))}
              </g>
            ) : (
              <text x={200} y={80} fontSize={11} fill="#94a3b8" textAnchor="middle">
                {err ?? 'computing…'}
              </text>
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
                  ['Profilé', res.profil],
                  ['Masse', `${res.masse.toFixed(1)} kg/m`],
                  ['M', `${(res.ratio_m * 100).toFixed(0)} %`],
                  ['V', `${(res.ratio_v * 100).toFixed(0)} %`],
                  ['Flèche', `${(res.ratio_f * 100).toFixed(0)} %`],
                  ['M max', `${res.m_max.toFixed(1)} kN·m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Profilé métallique (EC3)"
                latex={String.raw`M_{Ed} \le M_{c,Rd} = W f_y/\gamma_{M0}`}
                description="Choix auto IPE le plus léger"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\eta_M`, meaning: 'Taux flexion', value: (res.ratio_m * 100).toFixed(0), unit: '%' },
                  { symbol: String.raw`\eta_V`, meaning: 'Taux cisaillement', value: (res.ratio_v * 100).toFixed(0), unit: '%' },
                  { symbol: String.raw`\eta_f`, meaning: 'Taux flèche', value: (res.ratio_f * 100).toFixed(0), unit: '%' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${status === 'fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'}`}>
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
