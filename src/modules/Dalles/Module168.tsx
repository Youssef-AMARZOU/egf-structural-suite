import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { FlecheDispenseV5Inputs, FlecheDispenseV5Output } from '../../types/engineering';

export default function Module168() {
  const [inp, setInp] = useState<FlecheDispenseV5Inputs>({
    L: 6.0, d: 170, sigma_s: 250, sigma_sd: 300,
    fck: 30, rho: 0.005, rho1: 0.015, code: 1,
  });
  const { data: res, error: err, live } = useModuleCalc<FlecheDispenseV5Inputs, FlecheDispenseV5Output>(
    'calculate_fleche_dispense_v5_168', inp,
  );
  const S = (k: keyof FlecheDispenseV5Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio_ld > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FlecheDispenseV5Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const lOverD = inp.L * 1000 / inp.d;

  return (
    <Workstation
      title="168 Fleche dispense v5"
      subtitle="Dispense de vérification de flèche (Table B.3) — RUST"
      eurocode="EC2 §7.4.2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('L', 'L', 'm', 1, 15, 0.5)}
          {slider('d', 'd', 'mm', 50, 500, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('sigma_s', 'σs', 'MPa', 100, 400, 5)}
          {slider('sigma_sd', 'σsd', 'MPa', 100, 500, 5)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Armatures</div>
          <ParamSlider label="ρ" unit="%" value={inp.rho * 100} min={0} max={3} step={0.05} onChange={v => setInp({ ...inp, rho: v / 100 })} />
          <ParamSlider label="ρ1 (traction)" unit="%" value={inp.rho1 * 100} min={0} max={5} step={0.05} onChange={v => setInp({ ...inp, rho1: v / 100 })} />
          {slider('code', 'Code (1=BAEL, 2=EC2)', '', 1, 2, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Vérification L/d" vbW={500} vbH={70}>
            {res && (() => {
              const maxVal = Math.max(lOverD * 1.3, 80);
              const bx = 50, bw = 400;
              const sc = bw / maxVal;
              const barH = 20;
              const limX = bx + (lOverD / res.ratio_ld) * sc;
              const ok = res.ratio_ld <= 1.0;
              return (
                <>
                  <text x={bx} y={14} fontSize={11} fill="#CBD5E1" fontWeight="bold">L/d réel = {lOverD.toFixed(1)}</text>
                  <rect x={bx} y={18} width={Math.min(lOverD * sc, bw)} height={barH}
                    fill={ok ? '#34D399' : '#F87171'} rx={4} opacity={0.9} />
                  <text x={bx + Math.min(lOverD * sc, bw) + 6} y={32} fontSize={10} fill="#CBD5E1" fontWeight="bold">{lOverD.toFixed(1)}</text>
                  <line x1={limX} y1={16} x2={limX} y2={40}
                    stroke="#FBBF24" strokeWidth={2.5} strokeDasharray="5 3" />
                  <text x={limX + 4} y={58} fontSize={10} fill="#FBBF24" fontWeight="bold">Limite = {(lOverD / res.ratio_ld).toFixed(1)}</text>
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
                  ['L/d', lOverD.toFixed(1)],
                  ['k1', res.k_factor.toFixed(2)],
                  ['Ratio', res.ratio_ld.toFixed(2)],
                  ['δ_max', `${res.fleche_max.toFixed(1)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Dispense de flèche"
                latex={String.raw`\frac{l}{d} \le K\left(11 + 1.5\sqrt{f_{ck}}\frac{\rho_0}{\rho}\right)`}
                description="Rapport L/d EC2 §7.4.2"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`l/d`, meaning: 'Élancement', value: lOverD.toFixed(1) },
                  { symbol: String.raw`K`, meaning: 'Système statique', value: res.k_factor.toFixed(2) },
                  { symbol: String.raw`f`, meaning: 'Flèche max', value: res.fleche_max.toFixed(1), unit: 'mm' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio_ld <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
