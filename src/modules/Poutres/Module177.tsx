import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { BalconsInputs, BalconsOutput } from '../../types/engineering';

export default function Module177() {
  const [inp, setInp] = useState<BalconsInputs>({
    L: 1.5, Lg: 0.3, g0: 2.5, g1: 5.0, g2: 0,
    q: 2.5, psi: 0.3, Eqp: 30000, Infi: 0.00002, Ifi: 0.00001,
    h: 200, fctm: 2.9,
  });
  const { data: res, error: err, live } = useModuleCalc<BalconsInputs, BalconsOutput>(
    'calculate_balcons_177', inp,
  );
  const S = (k: keyof BalconsInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.fleche > inp.L * 1000 / 150 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BalconsInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 150, oy = 30, bw = 200, bh = 25, sw = 50;

  return (
    <Workstation
      title="177 Balcons"
      subtitle="Balcon en porte-à-faux — intégration courbure (EC2) — RUST"
      eurocode="EC2 §7.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('L', 'L (balcon)', 'm', 0.5, 4, 0.1)}
          {slider('Lg', 'Lg (semelle)', 'm', 0, 1, 0.05)}
          {slider('h', 'h', 'mm', 100, 400, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges (kN/m)</div>
          {slider('g0', 'g0 (poids propre)', 'kN/m', 0, 15, 0.5)}
          {slider('g1', 'g1 (garde-corps)', 'kN/m', 0, 20, 0.5)}
          {slider('g2', 'g2', 'kN/m', 0, 20, 0.5)}
          {slider('q', 'q (variable)', 'kN/m', 0, 10, 0.5)}
          {slider('psi', 'ψ', '', 0, 1, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('Eqp', 'E', 'MPa', 10000, 60000, 1000)}
          {slider('Infi', 'I infini', 'm⁴', 0, 0.0002, 0.000005)}
          {slider('Ifi', 'I fissuré', 'm⁴', 0, 0.0002, 0.000005)}
          {slider('fctm', 'fctm', 'MPa', 1, 6, 0.1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Profil balcon" vbW={500} vbH={120}>
            <rect x={ox - sw} y={oy - 10} width={sw} height={bh + 20} fill="#94A3B8" stroke="#333" strokeWidth={1} />
            <text x={ox - sw / 2} y={oy + bh + 30} fontSize={8} fill="#666" textAnchor="middle">Mur</text>
            {res && (() => {
              const maxD = res.fleche * 1000 || 1;
              const sc = 60 / maxD;
              const dy = res.fleche * 1000 * sc;
              return (
                <>
                  <line x1={ox} y1={oy + bh / 2} x2={ox + bw} y2={oy + bh / 2 + dy} stroke="#6366F1" strokeWidth={3} />
                  <line x1={ox + bw} y1={oy + bh / 2} x2={ox + bw} y2={oy + bh / 2 + dy} stroke="#EF4444" strokeWidth={1} strokeDasharray="3,2" />
                  <text x={ox + bw + 10} y={oy + bh / 2 + dy / 2} fontSize={9} fill="#EF4444">δ = {(res.fleche * 1000).toFixed(1)} mm</text>
                </>
              );
            })()}
            <DimensionLine x1={ox} y1={oy + bh} x2={ox + bw} y2={oy + bh} offset={16} text={`L = ${inp.L} m`} />
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['δ', `${(res.fleche * 1000).toFixed(2)} mm`],
                  ['δ_adm (L/150)', `${(inp.L * 1000 / 150).toFixed(1)} mm`],
                  ['Mcr', `${res.Mcr.toFixed(1)} kN·m`],
                  ['Courbure max', res.courbure_max.toExponential(2)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Balcon en console"
                latex={String.raw`f_{max} = \frac{pL^4}{8EI} + \frac{PL^3}{3EI}`}
                description="Fissuré / non fissuré, L/150"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f_{max}`, meaning: 'Flèche en bout', value: (res.fleche * 1000).toFixed(2), unit: 'mm' },
                  { symbol: String.raw`L/150`, meaning: 'Flèche admissible', value: (inp.L * 1000 / 150).toFixed(1), unit: 'mm' },
                  { symbol: String.raw`M_{cr}`, meaning: 'Moment de fissuration', value: res.Mcr.toFixed(1), unit: 'kN·m' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.fleche <= inp.L * 1000 / 150 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
