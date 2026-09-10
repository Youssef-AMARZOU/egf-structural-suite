import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { RaftRotPlastInputs, RaftRotPlastOutput } from '../../types/engineering';

export default function Module189() {
  const [inp, setInp] = useState<RaftRotPlastInputs>({
    spans: [5, 6, 5], g: 25, q: 10, gg: 1.35, gq: 1.5,
    b: 1, h: 0.4, d: 0.35, fck: 30, fyk: 500, gc: 1.5, gs: 1.15, euk: 0.075, k_steel: 1.08,
  });
  const [txt, setTxt] = useState({ spans: '5, 6, 5' });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const parsed = parseList(txt.spans);
  const payload: RaftRotPlastInputs = {
    ...inp, spans: parsed.length > 0 ? parsed : inp.spans,
  };
  const { data: res, error: err, live } = useModuleCalc<RaftRotPlastInputs, RaftRotPlastOutput>(
    'calculate_raft_rot_plast_189', payload,
  );
  const S = (k: keyof RaftRotPlastInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.rotation_ok ? verdictStatus(res.verdict) : 'fail';

  const slider = (
    key: keyof RaftRotPlastInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const envPts = (ys: number[]): [number, number][] => {
    if (!res) return [];
    const all = [...res.envelope_min, ...res.envelope_max];
    const ymin = Math.min(...all);
    const ymax = Math.max(...all, ymin + 1e-9);
    const xmax = Math.max(...res.envelope_x, 1e-9);
    return res.envelope_x.map((x, i) => (
      [30 + (x / xmax) * 540, 170 - ((ys[i] - ymin) / (ymax - ymin)) * 140] as [number, number]
    ));
  };

  return (
    <Workstation
      title="189 Raft Rot Plast Dalle"
      subtitle="Bande de radier/dalle continue : enveloppe des moments (3 moments), As, MRd, rotation plastique xu/d — RUST"
      eurocode="EC2 §5.6"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travées & charges</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Travées (m, virgule)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.spans} onChange={e => setTxt({ ...txt, spans: e.target.value })} />
          </div>
          {slider('g', 'g (permanente)', 'kN/m', 0, 100, 1)}
          {slider('q', 'q (exploitation)', 'kN/m', 0, 50, 1)}
          {slider('gg', 'γg', '', 1, 1.5, 0.05)}
          {slider('gq', 'γq', '', 1, 1.6, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section & matériaux</div>
          {slider('b', 'b', 'm', 0.2, 3, 0.05)}
          {slider('h', 'h', 'm', 0.1, 1.5, 0.05)}
          {slider('d', 'd', 'm', 0.1, 1.4, 0.05)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('euk', 'euk', '', 0.01, 0.2, 0.005)}
          {slider('k_steel', 'k (écrouissage)', '', 1, 1.3, 0.01)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Enveloppe des moments (min bleu / max orange)" vbW={600} vbH={200}>
            {res && (
              <>
                <DiagramOverlay type="moment" points={envPts(res.envelope_min)} />
                <DiagramOverlay type="moment" points={envPts(res.envelope_max)} color="#F59E0B" />
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
                  ['M_env max', `${Math.max(...res.envelope_max.map(m => Math.abs(m))).toFixed(1)} kN.m`],
                  ['As sup max', `${Math.max(...res.as_sup, 0).toFixed(2)} cm²/m`],
                  ['As travée max', `${Math.max(...res.as_span, 0).toFixed(2)} cm²/m`],
                  ['xu/d max', Math.max(...res.xud).toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs overflow-x-auto">
                <div className="font-semibold mb-2">Ferraillage & résistances</div>
                <table className="font-mono w-full">
                  <thead><tr className="text-slate-500">
                    <th className="text-left p-1">Position</th><th className="p-1">M_dim (kN.m)</th>
                    <th className="p-1">As (cm²/m)</th><th className="p-1">MRd (kN.m)</th><th className="p-1">xu/d</th>
                  </tr></thead>
                  <tbody>
                    {res.as_sup.map((as, i) => (
                      <tr key={`s${i}`} className="border-t border-slate-200 dark:border-white/10">
                        <td className="p-1">Appui {i}</td>
                        <td className="p-1 text-center">{Math.max(Math.abs(res.support_m_min[i]), Math.abs(res.support_m_max[i])).toFixed(1)}</td>
                        <td className="p-1 text-center">{as.toFixed(2)}</td>
                        <td className="p-1 text-center">{res.mrd_sup[i].toFixed(1)}</td>
                        <td className="p-1 text-center">{res.xud[i].toFixed(3)}</td>
                      </tr>
                    ))}
                    {res.as_span.map((as, i) => (
                      <tr key={`t${i}`} className="border-t border-slate-200 dark:border-white/10">
                        <td className="p-1">Travée {i + 1}</td>
                        <td className="p-1 text-center">{res.span_m_max[i].toFixed(1)}</td>
                        <td className="p-1 text-center">{as.toFixed(2)}</td>
                        <td className="p-1 text-center">{res.mrd_span[i].toFixed(1)}</td>
                        <td className="p-1 text-center">{res.xud[res.as_sup.length + i].toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <FormulaCard
                title="Dalle : redistribution"
                latex={String.raw`M_{env} \quad A_s \quad x_u/d \le 0.45`}
                description="Enveloppe ELU + rotation"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{env}`, meaning: 'Enveloppe max', value: Math.max(...res.envelope_max.map(m => Math.abs(m))).toFixed(1), unit: 'kN.m' },
                  { symbol: String.raw`A_s`, meaning: 'Armatures max', value: Math.max(...res.as_span, ...res.as_sup, 0).toFixed(2), unit: 'cm²/m' },
                  { symbol: String.raw`x_u/d`, meaning: 'Ratio max', value: Math.max(...res.xud).toFixed(3) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.rotation_ok ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {!res.rotation_ok && <li className="font-mono text-red-500">ATTENTION : capacité de rotation insuffisante (xu/d)</li>}
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
