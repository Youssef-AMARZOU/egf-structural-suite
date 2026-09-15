import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { CarottesEN13791Inputs, CarottesEN13791Output } from '../../types/engineering';

export default function Module194() {
  const [inp, setInp] = useState<CarottesEN13791Inputs>({
    n: 6, D: 100, phi: 100, td: 200, Lph: 0.5, ta: 35, m: 3.5,
  });
  const { data: res, error: err, live } = useModuleCalc<CarottesEN13791Inputs, CarottesEN13791Output>(
    'calculate_carottes_en_13791_194', inp,
  );
  const S = (k: keyof CarottesEN13791Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof CarottesEN13791Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const k = 1.5;
  const ox = 200, oy = 30;
  const W = inp.D * k;
  const H = 120;

  return (
    <Workstation
      title="194 Carottes EN 13791"
      subtitle="Caractérisation béton par carottes — EN 13791:2007 — RUST"
      eurocode="EN 13791"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Carottes</div>
          {slider('n', 'n (nombre)', '', 1, 20, 1)}
          {slider('D', 'D (diamètre)', 'mm', 50, 200, 5)}
          {slider('phi', 'φ (diamètre)', 'mm', 50, 200, 5)}
          {slider('td', 'td (longueur)', 'mm', 50, 500, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Résultats</div>
          {slider('ta', 'ta (moyenne)', 'MPa', 5, 100, 0.5)}
          {slider('m', 'm (écart-type)', 'MPa', 0, 10, 0.1)}
          {slider('Lph', 'Lph (hauteur poinçon)', 'm', 0.1, 2, 0.05)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Éprouvette carottée" vbW={500} vbH={220} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
            <rect x={ox} y={oy} width={W} height={H} fill="#94a3b8" opacity={0.35} stroke="#475569" strokeWidth={1.5} />
            <line x1={ox} y1={oy} x2={ox + W} y2={oy} stroke="#475569" strokeWidth={2.5} />
            <line x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} stroke="#475569" strokeWidth={2.5} />
            <line x1={ox + W / 2} y1={oy} x2={ox + W / 2} y2={oy + H} stroke="#94a3b8" strokeWidth={0.7} strokeDasharray="4,3" />
            <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={22} text={`D = ${inp.D} mm (n = ${inp.n})`} />
            <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-26} text={`td = ${inp.td}`} />
            {res && (
              <text x={ox + W / 2} y={oy + H + 40} textAnchor="middle" fontSize={11} fill="#22c55e" fontWeight="bold">
                fck,is = {res.fck.toFixed(1)} MPa
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
                  ['fck', `${res.fck.toFixed(1)} MPa`],
                  ['fcm', `${res.fcm.toFixed(1)} MPa`],
                  ['FEC', `${res.fec.toFixed(1)} MPa`],
                  ['Ka', res.ka.toFixed(2)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Béton in situ (EN 13791)"
                latex={String.raw`f_{ck,is} = \min(f_{m,is} - 1.48\,s \; ; \; f_{is,min} + 4)`}
                description="Carottes, approche A"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f_{m,is}`, meaning: 'Moyenne in situ', value: res.fcm.toFixed(1), unit: 'MPa' },
                  { symbol: String.raw`s`, meaning: 'Écart-type', value: inp.m, unit: 'MPa' },
                  { symbol: String.raw`f_{ck,is}`, meaning: 'Résistance caract.', value: res.fck.toFixed(1), unit: 'MPa' },
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
