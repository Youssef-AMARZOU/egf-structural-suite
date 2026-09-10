import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { DalleBpArmPassivEc2Inputs, DalleBpArmPassivEc2Output } from '../../types/engineering';

export default function Module166() {
  const [inp, setInp] = useState<DalleBpArmPassivEc2Inputs>({
    P: 0.5, b: 1000, h: 250, d: 220, e0: 20,
    Mg: 15, Mq: 10, MELU: 35, Ap: 300,
    fck: 30, fyk: 500, fp01: 1860, gs: 1.15, gc: 1.5,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleBpArmPassivEc2Inputs, DalleBpArmPassivEc2Output>(
    'calculate_dalle_bp_arm_passiv_ec2_166', inp,
  );
  const S = (k: keyof DalleBpArmPassivEc2Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing'
    : /KO|non/i.test(res.verdict) ? 'fail'
    : /OK/i.test(res.verdict) ? 'pass' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleBpArmPassivEc2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const sc = 0.08;
  const ox = 100, oy = 10;
  const bw = inp.b * sc;
  const bh = inp.h * sc;
  const dY = inp.d * sc;
  const e0Y = inp.e0 * sc;

  return (
    <Workstation
      title="166 Dalle bp arm passiv ec2"
      subtitle="Dalle précontrainte — ferraillage passif EC2 — RUST"
      eurocode="EC2 §5.10"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('b', 'b', 'mm', 200, 2000, 10)}
          {slider('h', 'h', 'mm', 100, 800, 10)}
          {slider('d', 'd', 'mm', 50, 700, 10)}
          {slider('e0', 'e0', 'mm', -100, 100, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges</div>
          {slider('P', 'P (MN)', 'MN', 0, 2, 0.05)}
          {slider('Mg', 'Mg', 'kN·m', 0, 100, 1)}
          {slider('Mq', 'Mq', 'kN·m', 0, 100, 1)}
          {slider('MELU', 'MELU', 'kN·m', 0, 150, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('fp01', 'fp01', 'MPa', 1000, 2000, 10)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Précontrainte</div>
          {slider('Ap', 'Ap', 'mm²', 0, 2000, 10)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section — aciers" vbW={400} vbH={120}>
            <rect x={ox} y={oy} width={bw} height={bh} fill="#e0e7ff" stroke="#6366F1" strokeWidth={2} />
            <line x1={ox - 10} y1={oy + dY} x2={ox + bw + 10} y2={oy + dY} stroke="#22C55E" strokeWidth={1} strokeDasharray="4,4" />
            <text x={ox - 15} y={oy + dY + 4} fontSize={9} fill="#22C55E">d</text>
            <line x1={ox + bw / 2} y1={oy + bh / 2} x2={ox + bw / 2} y2={oy + bh / 2 + e0Y} stroke="#F59E0B" strokeWidth={2} />
            <text x={ox + bw / 2 + 10} y={oy + bh / 2 + e0Y / 2} fontSize={9} fill="#F59E0B">e0</text>
            <line x1={ox} y1={oy + bh / 2} x2={ox + bw} y2={oy + bh / 2} stroke="#999" strokeWidth={0.5} strokeDasharray="2,2" />
            <rect x={ox + 10} y={oy + dY - 4} width={bw - 20} height={6} fill="#EF4444" rx={2} />
            {res && (
              <text x={ox + bw / 2} y={oy + dY + 18} fontSize={10} fill="#EF4444" textAnchor="middle">As2 = {res.as2.toFixed(0)} mm²/m</text>
            )}
            <circle cx={ox + bw / 2} cy={oy + bh / 2 + e0Y} r={5} fill="#F59E0B" />
            <text x={ox + bw / 2 + 15} y={oy + bh / 2 + e0Y + 4} fontSize={9} fill="#F59E0B">Ap</text>
            <DimensionLine x1={ox} y1={oy + bh} x2={ox + bw} y2={oy + bh} offset={12} text={`h = ${inp.h} mm, d = ${inp.d} mm`} />
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['As2', `${res.as2.toFixed(0)} mm²/m`],
                  ['As_min', `${res.as_min.toFixed(0)} mm²/m`],
                  ['ξ', res.ksi.toFixed(3)],
                  ['μ', res.mu.toFixed(4)],
                  ['σs', `${res.sigma_s.toFixed(1)} MPa`],
                  ['σp', `${res.sigma_p.toFixed(1)} MPa`],
                  ['εp', `${(res.eps_p * 1000).toFixed(2)} ‰`],
                  ['P_final', `${res.P_final.toFixed(3)} MN`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Dalle précontrainte EC2"
                latex={String.raw`\sigma = \frac{P}{A} \pm \frac{M}{W}`}
                description="Armatures passives itératives"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`P`, meaning: 'Précontrainte', value: res.P_final.toFixed(3), unit: 'MN' },
                  { symbol: String.raw`A_s`, meaning: 'Acier passif', value: res.as2.toFixed(0), unit: 'mm²/m' },
                  { symbol: String.raw`\sigma_s`, meaning: 'Contrainte acier', value: res.sigma_s.toFixed(1), unit: 'MPa' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.verdict.includes('OK') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'}`}>
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
