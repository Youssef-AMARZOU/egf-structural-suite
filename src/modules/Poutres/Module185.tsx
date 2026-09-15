import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { TracesCableDalleInputs, TracesCableDalleOutput } from '../../types/engineering';

export default function Module185() {
  const [inp, setInp] = useState<TracesCableDalleInputs>({
    L: 8, tp1: [10, 0, 0], tp2: [10, 0, 0], ta: [0, 0, 0], tb: [8, 0, 0],
    P: 1200, del: 0.15, lam: 0.5, h: 0.25, c_inf: 0.04, c_sup: 0.04,
  });
  const [txt, setTxt] = useState({ tp1: '10, 0, 0', tp2: '10, 0, 0', ta: '0, 0, 0', tb: '8, 0, 0' });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;
  const payload: TracesCableDalleInputs = {
    ...inp,
    tp1: pick(parseList(txt.tp1), inp.tp1),
    tp2: pick(parseList(txt.tp2), inp.tp2),
    ta: pick(parseList(txt.ta), inp.ta),
    tb: pick(parseList(txt.tb), inp.tb),
  };
  const { data: res, error: err, live } = useModuleCalc<TracesCableDalleInputs, TracesCableDalleOutput>(
    'calculate_traces_cable_dalle_185', payload,
  );
  const S = (k: keyof TracesCableDalleInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof TracesCableDalleInputs, label: string, unit: string,
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

  const chartPts = (xs: number[], ys: number[], W: number, H: number, pad: number): [number, number][] => {
    if (xs.length === 0) return [];
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const span = ymax - ymin > 1e-12 ? ymax - ymin : 1;
    return xs.map((x, i) => (
      [pad + (x / Math.max(payload.L, 1e-9)) * (W - 2 * pad),
       H - pad - ((ys[i] - ymin) / span) * (H - 2 * pad)] as [number, number]
    ));
  };

  return (
    <Workstation
      title="185 Traces Câble Dalle"
      subtitle="Balayage M/V sous 3 charges trapézoïdales + profil de câble parabolique (dalle précontrainte) — RUST"
      eurocode="EC2 §5.10"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travée & charges</div>
          {slider('L', 'L', 'm', 2, 20, 0.5)}
          {field('tp1', 'tp1 (kN/m, 3 val.)')}
          {field('tp2', 'tp2 (kN/m, 3 val.)')}
          {field('ta', 'ta (m, débuts)')}
          {field('tb', 'tb (m, longueurs)')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Câble & dalle</div>
          {slider('P', 'P (précontrainte)', 'kN', 0, 3000, 50)}
          {slider('del', 'del (flèche câble)', 'm', 0, 0.5, 0.01)}
          {slider('lam', 'lam (point bas /L)', '', 0, 1, 0.05)}
          {slider('h', 'h (dalle)', 'm', 0.1, 1, 0.01)}
          {slider('c_inf', 'c_inf', 'm', 0, 0.2, 0.005)}
          {slider('c_sup', 'c_sup', 'm', 0, 0.2, 0.005)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Moment fléchissant M(x) — 101 pts" vbW={600} vbH={200}>
              {res && <DiagramOverlay type="moment" points={chartPts(res.x, res.moment, 600, 200, 30)} />}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Profil du câble y(x) depuis la sous-face" vbW={600} vbH={200}>
              {res && <DiagramOverlay type="moment" points={chartPts(res.x, res.cable_y, 600, 200, 30)} color="#F59E0B" />}
            </SectionCanvas>
          </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['M_max', `${res.m_max.toFixed(2)} kN.m`],
                  ['M_min', `${res.m_min.toFixed(2)} kN.m`],
                  ['|V|_max', `${res.v_max.toFixed(2)} kN`],
                  ['w_bal', `${res.w_bal.toFixed(2)} kN/m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Tracé du câble"
                latex={String.raw`y(x) = \frac{4\delta x(L-x)}{L^2} \quad w_{bal} = \frac{8P\delta}{L^2}`}
                description="Parabole de précontrainte + M/V"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\delta`, meaning: 'Flèche du câble', value: inp.del, unit: 'm' },
                  { symbol: String.raw`w_{bal}`, meaning: 'Charge équilibrée', value: res.w_bal.toFixed(2), unit: 'kN/m' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.m_max.toFixed(2), unit: 'kN.m' },
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
