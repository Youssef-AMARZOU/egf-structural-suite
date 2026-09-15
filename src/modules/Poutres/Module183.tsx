import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { PoutreContinueQtesV2Inputs, PoutreContinueQtesV2Output } from '../../types/engineering';

export default function Module183() {
  const [inp, setInp] = useState<PoutreContinueQtesV2Inputs>({
    nap: 3, tLn: [5, 5], tEI: [50000, 50000], tp: [10, 10], tg: [200, 200],
    tMR: [150, 150], tb: [200, 200], th: [500, 500], td: [450, 450],
    fck: 30, fyd: 434.8, cotq: 2.0,
  });
  const [txt, setTxt] = useState({
    tLn: '5, 5', tEI: '50000, 50000', tp: '10, 10', tg: '200, 200',
    tMR: '150, 150', tb: '200, 200', th: '500, 500', td: '450, 450',
  });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;
  const payload: PoutreContinueQtesV2Inputs = {
    ...inp,
    nap: pick(parseList(txt.tLn), inp.tLn).length + 1,
    tLn: pick(parseList(txt.tLn), inp.tLn),
    tEI: pick(parseList(txt.tEI), inp.tEI),
    tp: pick(parseList(txt.tp), inp.tp),
    tg: pick(parseList(txt.tg), inp.tg),
    tMR: pick(parseList(txt.tMR), inp.tMR),
    tb: pick(parseList(txt.tb), inp.tb),
    th: pick(parseList(txt.th), inp.th),
    td: pick(parseList(txt.td), inp.td),
  };
  const { data: res, error: err, live } = useModuleCalc<PoutreContinueQtesV2Inputs, PoutreContinueQtesV2Output>(
    'calculate_poutre_continue_qtes_v2_183', payload,
  );
  const S = (k: keyof PoutreContinueQtesV2Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PoutreContinueQtesV2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const field = (key: keyof typeof txt, label: string) => (
    <div className="mb-1">
      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
        value={txt[key]} onChange={e => setTxt({ ...txt, [key]: e.target.value })} />
    </div>
  );

  const ox = 60, oy = 20, w = 480, hm = 100, hv = 100;

  return (
    <Workstation
      title="183 Poutre Continue Qtes V2"
      subtitle="Dimensionnement complet poutre continue — moments, cisaillement, ferraillage — RUST"
      eurocode="EC2 §5.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {field('tLn', 'Ln (m) — virgule')}
          {field('tEI', 'EI (kN·m²)')}
          {field('tp', 'Charges p (kN/m)')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {field('tb', 'b (mm)')}
          {field('th', 'h (mm)')}
          {field('td', 'd (mm)')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & Cisaillement</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyd', 'fyd', 'MPa', 300, 600, 5)}
          {slider('cotq', 'cot θ', '', 1, 2.5, 0.1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Moments & Cisaillement" vbW={600} vbH={250}>
            {res && (() => {
              const nSpans = res.moments_appuis.length - 1;
              if (nSpans <= 0) return <text x={300} y={125} fontSize={12} fill="#94A3B8" textAnchor="middle">Données insuffisantes</text>;
              const spanW = w / nSpans;
              const allM = [...res.moments_appuis, ...res.moments_travee];
              const maxM = Math.max(...allM.map(m => Math.abs(m)), 1);
              const scM = hm / (maxM * 1.5);
              const maxV = Math.max(...res.Vmax, 1);
              const scV = hv / (maxV * 1.2);
              const zeroYm = oy + hm * 0.3;
              const zeroYv = oy + hm + 40 + hv * 0.3;
              const mPts: [number, number][] = [];
              for (let i = 0; i < nSpans; i++) {
                mPts.push([ox + i * spanW, zeroYm - res.moments_appuis[i] * scM]);
                mPts.push([ox + (i + 0.5) * spanW, zeroYm - res.moments_travee[i] * scM]);
                mPts.push([ox + (i + 1) * spanW, zeroYm - res.moments_appuis[i + 1] * scM]);
              }
              const actualLn = pick(parseList(txt.tLn), inp.tLn);
              const totalL = actualLn.reduce((a: number, b: number) => a + b, 0);
              const xVals = actualLn.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + l], [0]);
              const yMinM = Math.min(...allM);
              const yMaxM = Math.max(...allM);
              const yMVals = [...new Set([yMinM, 0, yMaxM])].sort((a, b) => a - b)
                .filter((v, i, a) => i === 0 || Math.abs((a[i - 1] * scM) - (v * scM)) >= 15);
              const yVVals = [0, maxV];
              return (
                <>
                  <text x={ox - 5} y={oy + hm / 2} fontSize={8} fill="#6366F1" textAnchor="end" transform={`rotate(-90, ${ox - 5}, ${oy + hm / 2})`}>M (kN·m)</text>
                  <line x1={ox} y1={zeroYm} x2={ox + w} y2={zeroYm} stroke="#ccc" strokeWidth={0.5} />
                  {res.moments_appuis.map((_, i) => (
                    <polygon key={`s-${i}`} points={`${ox + i * spanW - 5},${zeroYm + 6} ${ox + i * spanW + 5},${zeroYm + 6} ${ox + i * spanW},${zeroYm}`}
                      fill="#94A3B8" stroke="#64748B" strokeWidth={0.5} />
                  ))}
                  <DiagramOverlay type="moment" points={mPts} />
                  {res.moments_appuis.map((m, i) => (
                    <text key={`mv-${i}`} x={ox + i * spanW} y={zeroYm - m * scM - 4} fontSize={7} fill="#EF4444" textAnchor="middle">{m.toFixed(0)}</text>
                  ))}
                  {res.moments_travee.map((m, i) => (
                    <text key={`mt-${i}`} x={ox + (i + 0.5) * spanW} y={zeroYm - m * scM - 4} fontSize={7} fill="#22C55E" textAnchor="middle">{m.toFixed(0)}</text>
                  ))}
                  <AxisTicks
                    origin={[ox, zeroYm + 15]}
                    end={[ox + w, zeroYm + 15]}
                    values={xVals}
                    map={(v) => [ox + (v / totalL) * w, zeroYm + 15]}
                    unit="m"
                    side="below"
                    decimals={1}
                  />
                  <AxisTicks
                    origin={[ox, oy]}
                    end={[ox, oy + hm]}
                    values={yMVals}
                    map={(v) => [ox, zeroYm - v * scM]}
                    unit="kN·m"
                    side="left"
                    decimals={0}
                  />
                  <text x={ox - 5} y={zeroYv + hv / 2} fontSize={8} fill="#F59E0B" textAnchor="end" transform={`rotate(-90, ${ox - 5}, ${zeroYv + hv / 2})`}>V (kN)</text>
                  <line x1={ox} y1={zeroYv} x2={ox + w} y2={zeroYv} stroke="#ccc" strokeWidth={0.5} />
                  {res.Vmax.map((v, i) => (
                    <rect key={`vr-${i}`} x={ox + i * spanW + spanW * 0.1} y={zeroYv - v * scV}
                      width={spanW * 0.8} height={v * scV} fill="#F59E0B" opacity={0.4} stroke="#F59E0B" strokeWidth={0.5} />
                  ))}
                  {res.Vmax.map((v, i) => (
                    <text key={`vv-${i}`} x={ox + (i + 0.5) * spanW} y={zeroYv - v * scV - 4} fontSize={7} fill="#F59E0B" textAnchor="middle">{v.toFixed(0)}</text>
                  ))}
                  <AxisTicks
                    origin={[ox, zeroYv]}
                    end={[ox, zeroYv + hv]}
                    values={yVVals}
                    map={(v) => [ox, zeroYv - v * scV]}
                    unit="kN"
                    side="left"
                    decimals={0}
                  />
                  {res.Asw.map((a, i) => (
                    <text key={`aw-${i}`} x={ox + (i + 0.5) * spanW} y={zeroYv + hv + 15} fontSize={7} fill="#8B5CF6" textAnchor="middle">
                      Asw={a.toFixed(0)} mm²/m
                    </text>
                  ))}
                  <InlineLegend
                    items={[
                      { label: 'Moments', color: '#6366F1' },
                      { label: 'Cisaillement', color: '#F59E0B' },
                    ]}
                    x={ox + w - 130}
                    y={oy + 5}
                  />
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
                  ['M_appuis max', `${Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1)} kN·m`],
                  ['V_max', `${Math.max(...res.Vmax, 0).toFixed(1)} kN`],
                  ['Asw max', `${Math.max(...res.Asw, 0).toFixed(0)} mm²/m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Trois moments (Clapeyron)"
                latex={String.raw`M_A L_1 + 2M_B(L_1+L_2) + M_C L_2 = -6A_1\bar{x}_1/L_1 - 6A_2\bar{x}'_2/L_2`}
                description="Poutre continue élastique"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{app}`, meaning: 'Moment sur appui max', value: Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`V_{max}`, meaning: 'Effort tranchant max', value: Math.max(...res.Vmax, 0).toFixed(1), unit: 'kN' },
                  { symbol: String.raw`A_{sw}`, meaning: 'Armatures transversales', value: Math.max(...res.Asw, 0).toFixed(0), unit: 'mm²/m' },
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
