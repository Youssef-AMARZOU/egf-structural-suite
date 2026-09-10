import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup, DiagramOverlay } from '../../components/drafting';
import { PotCirculaireFlamblEC2V2Inputs, PotCirculaireFlamblEC2V2Output } from '../../types/engineering';

export default function Module196() {
  const [inp, setInp] = useState<PotCirculaireFlamblEC2V2Inputs>({
    D: 400, Lo: 4.0, NEd: 1200, e1: 20, fck: 30, fyk: 500, As: 2500, phi: 2.0, cover: 30,
  });
  const { data: res, error: err, live } = useModuleCalc<PotCirculaireFlamblEC2V2Inputs, PotCirculaireFlamblEC2V2Output>(
    'calculate_pot_circulaire_flambl_ec2_v2_196', inp,
  );
  const S = (k: keyof PotCirculaireFlamblEC2V2Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.ratio > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PotCirculaireFlamblEC2V2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const cx = 110, cy = 110, R = 80;
  const pxPerMm = R / (inp.D / 2);
  const nBars = 8;
  const phiBar = 2 * Math.sqrt(Math.max(0, inp.As / nBars) / Math.PI);
  const bars = Array.from({ length: nBars }, (_, i) => {
    const a = (i / nBars) * 2 * Math.PI;
    return { x: cx + (R - 14) * Math.cos(a), y: cy + (R - 14) * Math.sin(a), phi: phiBar };
  });

  const m2Pts: [number, number][] = res ? res.lo_curve.map((lo, i) => (
    [260 + (lo / Math.max(...res.lo_curve, 1)) * 300,
     200 - (res.m2_curve[i] / Math.max(...res.m2_curve, 1)) * 170] as [number, number]
  )) : [];

  return (
    <Workstation
      title="196 Pot Circulaire Flambement EC2"
      subtitle="Poteau circulaire, second ordre (courbure nominale EC2 §5.8.8) + fluage — RUST"
      eurocode="EC2 §5.8.8"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('D', 'D (diamètre)', 'mm', 150, 1000, 10)}
          {slider('Lo', 'Lo (longueur flambement)', 'm', 1, 12, 0.1)}
          {slider('cover', 'Enrobage', 'mm', 10, 80, 5)}
          {slider('As', 'As (total)', 'mm²', 0, 15000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations & matériaux</div>
          {slider('NEd', 'NEd', 'kN', 0, 5000, 50)}
          {slider('e1', 'e1 (excentrement 1er ordre)', 'mm', 0, 200, 5)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('phi', 'φ (fluage)', '', 0, 4, 0.1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section & M2(Lo)" vbW={600} vbH={220} scaleLabel={`1 px ≈ ${(1 / pxPerMm).toFixed(1)} mm`}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#333" strokeWidth={1.5} />
            <circle cx={cx} cy={cy} r={R - 14} fill="none" stroke="#6366F1" strokeWidth={1} strokeDasharray="4,2" />
            <RebarGroup bars={bars} pxPerMm={pxPerMm} />
            <DimensionLine x1={cx - R} y1={cy + R + 18} x2={cx + R} y2={cy + R + 18} offset={10} text={`D = ${inp.D}`} />
            {res && (
              <>
                <DiagramOverlay type="moment" points={m2Pts} color="#F59E0B" />
                <text x={410} y={15} fontSize={9} fill="#F59E0B" textAnchor="middle">M2 en fonction de Lo</text>
              </>
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
                  ['λ / λ_lim', `${res.lambda.toFixed(1)} / ${res.lambda_lim.toFixed(1)}`],
                  ['e2', `${res.e2_mm.toFixed(1)} mm`],
                  ['M_Ed,tot', `${res.M_tot.toFixed(1)} kN·m`],
                  ['ratio', res.ratio.toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Courbure nominale (EC2 §5.8.8)"
                latex={String.raw`e_2 = \frac{1}{r}\frac{l_0^2}{c}`}
                description="Poteau circulaire élancé + fluage"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`e_2`, meaning: 'Excentrement 2nd ordre', value: res.e2_mm.toFixed(1), unit: 'mm' },
                  { symbol: String.raw`\lambda`, meaning: 'Élancement', value: res.lambda.toFixed(1) },
                  { symbol: String.raw`M_{tot}`, meaning: 'Moment total', value: res.M_tot.toFixed(1), unit: 'kN·m' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                <li className={res.ratio <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                  {res.ratio <= 1.0 ? '✓' : '✗'} ratio = {res.ratio.toFixed(3)}
                </li>
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
