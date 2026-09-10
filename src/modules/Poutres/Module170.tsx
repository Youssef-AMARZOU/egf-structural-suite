import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { DescDeChargesInputs, DescDeChargesOutput } from '../../types/engineering';

export default function Module170() {
  const [inp, setInp] = useState<DescDeChargesInputs>({
    Gk: 3.5, Qk1: 2.5, Qk2: 1.0, Sk: 0, Wk: 0,
    psi0: 0.7, psi1: 0.5, psi2: 0.3,
  });
  const { data: res, error: err, live } = useModuleCalc<DescDeChargesInputs, DescDeChargesOutput>(
    'calculate_desc_de_charges_170', inp,
  );
  const S = (k: keyof DescDeChargesInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DescDeChargesInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="170 Desc de charges"
      subtitle="Combinaisons de charges EC0 (EN 1990) — RUST"
      eurocode="EC0"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges caractéristiques (kN/m²)</div>
          {slider('Gk', 'Gk (permanente)', 'kN/m²', 0, 20, 0.5)}
          {slider('Qk1', 'Qk1 (variable principale)', 'kN/m²', 0, 20, 0.5)}
          {slider('Qk2', 'Qk2 (variable secondaire)', 'kN/m²', 0, 20, 0.5)}
          {slider('Sk', 'Sk (neige)', 'kN/m²', 0, 10, 0.5)}
          {slider('Wk', 'Wk (vent)', 'kN/m²', 0, 10, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Coefficients de combinaison (EC0)</div>
          {slider('psi0', 'ψ0', '', 0, 1, 0.05)}
          {slider('psi1', 'ψ1', '', 0, 1, 0.05)}
          {slider('psi2', 'ψ2', '', 0, 1, 0.05)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Diagramme des combinaisons" vbW={500} vbH={120}>
            {res && (() => {
              const ox = 50, oy = 20, w = 400, h = 80;
              const maxVal = res.env_uls * 1.1;
              const sc = h / maxVal;
              const bars = [
                { val: res.env_uls, label: 'ELU', color: '#EF4444' },
                { val: res.env_sls_rare, label: 'Rare', color: '#F97316' },
                { val: res.env_sls_qk, label: 'Qk', color: '#22C55E' },
                { val: res.env_sls_qp, label: 'QP', color: '#3B82F6' },
              ];
              const barW = w / bars.length - 15;
              return (
                <>
                  {bars.map((b, i) => {
                    const x = ox + i * (barW + 15) + 10;
                    const bh = b.val * sc;
                    return (
                      <g key={i}>
                        <rect x={x} y={oy + h - bh} width={barW} height={bh} fill={b.color} rx={3} />
                        <text x={x + barW / 2} y={oy + h + 14} fontSize={9} fill="#666" textAnchor="middle">{b.label}</text>
                        <text x={x + barW / 2} y={oy + h - bh - 5} fontSize={9} fill="#333" textAnchor="middle">
                          {b.val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['ELU', `${res.env_uls.toFixed(2)} kN/m²`],
                  ['ELS rare', `${res.env_sls_rare.toFixed(2)} kN/m²`],
                  ['ELS QP', `${res.env_sls_qp.toFixed(2)} kN/m²`],
                  ['ELS Qk', `${res.env_sls_qk.toFixed(2)} kN/m²`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Combinaisons (EC0)"
                latex={String.raw`E_d = 1.35 G_k + 1.5 Q_{k,1} + 1.5\sum\psi_{0,i}Q_{k,i}`}
                description="ELU, ELS rare et quasi-permanent"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`G_k`, meaning: 'Permanentes', value: inp.Gk, unit: 'kN/m²' },
                  { symbol: String.raw`Q_k`, meaning: 'Variables', value: inp.Qk1, unit: 'kN/m²' },
                  { symbol: String.raw`E_{d,ELU}`, meaning: 'Combinaison ELU', value: res.env_uls.toFixed(2), unit: 'kN/m²' },
                ]}
              />
              <div className="p-2 rounded bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300 text-xs font-semibold">
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
