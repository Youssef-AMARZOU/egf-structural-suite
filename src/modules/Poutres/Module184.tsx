import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { TraveeChargesQQInputs, TraveeChargesQQOutput } from '../../types/engineering';

export default function Module184() {
  const [inp, setInp] = useState<TraveeChargesQQInputs>({
    nc: 1, L: 6, tp1: [10], tp2: [20], ta: [0], tb: [4], Mg: 0, Md: 0,
  });
  const [txt, setTxt] = useState({ tp1: '10', tp2: '20', ta: '0', tb: '4' });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;
  const payload: TraveeChargesQQInputs = {
    ...inp,
    tp1: pick(parseList(txt.tp1), inp.tp1),
    tp2: pick(parseList(txt.tp2), inp.tp2),
    ta: pick(parseList(txt.ta), inp.ta),
    tb: pick(parseList(txt.tb), inp.tb),
    nc: pick(parseList(txt.tp1), inp.tp1).length,
  };
  const { data: res, error: err, live } = useModuleCalc<TraveeChargesQQInputs, TraveeChargesQQOutput>(
    'calculate_travee_charges_qq_184', payload,
  );
  const S = (k: keyof TraveeChargesQQInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof TraveeChargesQQInputs, label: string, unit: string,
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

  const ox = 50, oy = 20, w = 500, hm = 120, hv = 120;

  return (
    <Workstation
      title="184 Travée Charges QQ"
      subtitle="Moment et effort tranchant pour charges trapézoïdales partielles — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('L', 'L (portée)', 'm', 1, 15, 0.5)}
          {slider('Mg', 'Mg', 'kN·m', -500, 500, 5)}
          {slider('Md', 'Md', 'kN·m', -500, 500, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges (virgule séparé)</div>
          {field('tp1', 'p1 (début)')}
          {field('tp2', 'p2 (fin)')}
          {field('ta', 'a (début, depuis appui)')}
          {field('tb', 'b (longueur charge)')}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Moment & Effort Tranchant" vbW={600} vbH={300}>
            {res && res.x.length > 0 && (() => {
              const n = res.x.length;
              void n;
              const maxM = Math.max(...res.moment.map(Math.abs), 1);
              const maxV = Math.max(...res.shear.map(Math.abs), 1);
              const scM = hm / (maxM * 1.5);
              const scV = hv / (maxV * 1.5);
              const zeroM = oy + hm * 0.4;
              const zeroV = oy + hm + 40 + hv * 0.4;
              const mPts: [number, number][] = res.x.map((x, i) => (
                [ox + x / payload.L * w, zeroM - res.moment[i] * scM] as [number, number]
              ));
              const vPts: [number, number][] = res.x.map((x, i) => (
                [ox + x / payload.L * w, zeroV - res.shear[i] * scV] as [number, number]
              ));
              return (
                <>
                  <text x={ox - 5} y={oy + hm / 2} fontSize={8} fill="#6366F1" textAnchor="end" transform={`rotate(-90, ${ox - 5}, ${oy + hm / 2})`}>M (kN·m)</text>
                  <line x1={ox} y1={zeroM} x2={ox + w} y2={zeroM} stroke="#ccc" strokeWidth={0.5} />
                  <text x={ox - 5} y={zeroV + hv / 2} fontSize={8} fill="#F59E0B" textAnchor="end" transform={`rotate(-90, ${ox - 5}, ${zeroV + hv / 2})`}>V (kN)</text>
                  <line x1={ox} y1={zeroV} x2={ox + w} y2={zeroV} stroke="#ccc" strokeWidth={0.5} />
                  {res.x.slice(0, -1).map((x, i) => {
                    const q0 = res.charge[i];
                    const q1 = res.charge[i + 1];
                    const x0 = ox + x / payload.L * w;
                    const x1 = ox + res.x[i + 1] / payload.L * w;
                    const qMax = Math.max(...res.charge, 1);
                    const scQ = 30 / qMax;
                    return (
                      <polygon key={`qp-${i}`}
                        points={`${x0},${oy + hm + 40 + hv + 50} ${x1},${oy + hm + 40 + hv + 50} ${x1},${oy + hm + 40 + hv + 50 - q1 * scQ} ${x0},${oy + hm + 40 + hv + 50 - q0 * scQ}`}
                        fill="#22C55E" opacity={0.3} />
                    );
                  })}
                  <text x={ox - 5} y={oy + hm + 40 + hv + 50 - 15} fontSize={7} fill="#22C55E" textAnchor="end">q(x)</text>
                  <DiagramOverlay type="moment" points={mPts} />
                  <DiagramOverlay type="shear" points={vPts} />
                  <text x={ox + w / 2} y={oy + hm + 20} fontSize={8} fill="#6366F1" textAnchor="middle">
                    M_max = {Math.max(...res.moment).toFixed(1)} kN·m
                  </text>
                  <text x={ox + w / 2} y={zeroV - hv * 0.6} fontSize={8} fill="#F59E0B" textAnchor="middle">
                    V_max = {Math.max(...res.shear.map(Math.abs)).toFixed(1)} kN
                  </text>
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
                  ['M_max', `${Math.max(...res.moment).toFixed(1)} kN·m`],
                  ['V_max', `${Math.max(...res.shear.map(Math.abs)).toFixed(1)} kN`],
                  ['Portée', `${payload.L} m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="M(x), V(x) trapézoïdal"
                latex={String.raw`M(x) = M_A + \int_0^x V(t)\,dt`}
                description="Charges trapézoïdales partielles"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: Math.max(...res.moment).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`V_{max}`, meaning: 'Effort max', value: Math.max(...res.shear.map(Math.abs)).toFixed(1), unit: 'kN' },
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
