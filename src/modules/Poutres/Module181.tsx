import { useState, useMemo } from 'react';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { PoutresRotPlastMethGeneV5Inputs, PoutresRotPlastMethGeneV5Output } from '../../types/engineering';

const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;

export default function Module181() {
  const [inp, setInp] = useState<PoutresRotPlastMethGeneV5Inputs>({
    nap: 3, tLn: [5, 5], tEI: [50000, 50000], tp: [10, 10], tg: [200, 200],
    tMR: [150, 150], tb: [300, 300], th: [500, 500], tbw: [200, 200], thf: [150, 150], kkr: 0,
  });
  const [txt, setTxt] = useState({
    tLn: '5, 5', tEI: '50000, 50000', tp: '10, 10', tg: '200, 200',
    tMR: '150, 150', tb: '300, 300', th: '500, 500', tbw: '200, 200', thf: '150, 150',
  });

  const payload: PoutresRotPlastMethGeneV5Inputs = useMemo(() => ({
    ...inp,
    nap: pick(parseList(txt.tLn), inp.tLn).length + 1,
    tLn: pick(parseList(txt.tLn), inp.tLn),
    tEI: pick(parseList(txt.tEI), inp.tEI),
    tp: pick(parseList(txt.tp), inp.tp),
    tg: pick(parseList(txt.tg), inp.tg),
    tMR: pick(parseList(txt.tMR), inp.tMR),
    tb: pick(parseList(txt.tb), inp.tb),
    th: pick(parseList(txt.th), inp.th),
    tbw: pick(parseList(txt.tbw), inp.tbw),
    thf: pick(parseList(txt.thf), inp.thf),
  }), [txt.tLn, txt.tEI, txt.tp, txt.tg, txt.tMR, txt.tb, txt.th, txt.tbw, txt.thf, inp.kkr]);
  const { data: res, error: err, live } = useModuleCalc<PoutresRotPlastMethGeneV5Inputs, PoutresRotPlastMethGeneV5Output>(
    'calculate_poutres_rot_plast_meth_gene_v5_181', payload,
  );

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const actualLn = useMemo(() => pick(parseList(txt.tLn), inp.tLn), [txt.tLn, inp.tLn]);

  const mom = useMemo(() => {
    if (!res || res.moments_appuis.length - 1 <= 0) return null;
    const ox = 60, oy = 40, w = 480, h = 120;
    const nSpans = res.moments_appuis.length - 1;
    const spanW = w / nSpans;
    const allM = [...res.moments_appuis, ...res.moments_travee];
    const maxM = Math.max(...allM.map(m => Math.abs(m)), 1);
    const sc = h / (maxM * 1.5);
    const zeroY = oy + h * 0.3;
    const pts: [number, number][] = [];
    for (let i = 0; i < nSpans; i++) {
      pts.push([ox + i * spanW, zeroY - res.moments_appuis[i] * sc]);
      pts.push([ox + i * spanW + spanW / 2, zeroY - res.moments_travee[i] * sc]);
      pts.push([ox + (i + 1) * spanW, zeroY - res.moments_appuis[i + 1] * sc]);
    }
    return { pts, spanW, zeroY, sc, nSpans, ox, w };
  }, [res]);

  const field = (key: keyof typeof txt, label: string, placeholder: string) => (
    <div className="mb-1">
      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
        value={txt[key]} onChange={e => setTxt({ ...txt, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  return (
    <Workstation
      title="181 Poutres Rot Plast Meth Gene V5"
      subtitle="Méthode générale rotations plastiques — poutres T continues — RUST"
      eurocode="EC2 §5.6"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {field('tLn', 'Ln (m) — virgule', '5, 5')}
          {field('tEI', 'EI (kN·m²)', '50000, 50000')}
          {field('tp', 'Charges p (kN/m)', '10, 10')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section T</div>
          {field('tb', 'b (mm)', '300, 300')}
          {field('th', 'h (mm)', '500, 500')}
          {field('tbw', 'bw (mm) — âme', '200, 200')}
          {field('thf', 'hf (mm) — dalle', '150, 150')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Appuis & MR</div>
          {field('tg', 'tg (mm)', '200, 200')}
          {field('tMR', 'MR (kN·m)', '150, 150')}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Méthode</label>
            <select className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15"
              value={inp.kkr} onChange={e => setInp({ ...inp, kkr: parseInt(e.target.value) })}>
              <option value={0}>Élastique (3 moments)</option>
              <option value={1}>Rotules plastiques</option>
            </select>
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Diagramme de moments" vbW={600} vbH={200}>
            {res && mom ? (() => {
              const totalL = actualLn.reduce((a: number, b: number) => a + b, 0);
              const xVals = actualLn.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + l], [0]);
              const allM = [...res.moments_appuis, ...res.moments_travee];
              const yMin = Math.min(...allM);
              const yMax = Math.max(...allM);
              const yVals = [...new Set([yMin, 0, yMax])].sort((a, b) => a - b)
                .filter((v, i, a) => i === 0 || Math.abs((a[i - 1] * mom.sc) - (v * mom.sc)) >= 15);
              return (
                <>
                  {res.moments_appuis.map((_, i) => (
                    <g key={`s-${i}`}>
                      <polygon points={`${mom.ox + i * mom.spanW - 6},${mom.zeroY + 8} ${mom.ox + i * mom.spanW + 6},${mom.zeroY + 8} ${mom.ox + i * mom.spanW},${mom.zeroY}`}
                        fill="#94A3B8" stroke="#64748B" strokeWidth={0.5} />
                      <text x={mom.ox + i * mom.spanW} y={mom.zeroY + 20} fontSize={8} fill="#CBD5E1" textAnchor="middle">A{i + 1}</text>
                    </g>
                  ))}
                  <line x1={mom.ox} y1={mom.zeroY} x2={mom.ox + mom.w} y2={mom.zeroY} stroke="#ccc" strokeWidth={0.5} />
                  <DiagramOverlay type="moment" points={mom.pts} />
                  {res.moments_appuis.map((m, i) => (
                    <text key={`mv-${i}`} x={mom.ox + i * mom.spanW} y={mom.zeroY - m * mom.sc - 5}
                      fontSize={8} fill="#EF4444" textAnchor="middle">{m.toFixed(0)}</text>
                  ))}
                  {res.moments_travee.map((m, i) => (
                    <text key={`mt-${i}`} x={mom.ox + (i + 0.5) * mom.spanW} y={mom.zeroY - m * mom.sc - 5}
                      fontSize={8} fill="#22C55E" textAnchor="middle">{m.toFixed(0)}</text>
                  ))}
                  <AxisTicks
                    origin={[mom.ox, mom.zeroY + 30]}
                    end={[mom.ox + mom.w, mom.zeroY + 30]}
                    values={xVals}
                    map={(v) => [mom.ox + (v / totalL) * mom.w, mom.zeroY + 30]}
                    unit="m"
                    side="below"
                    decimals={1}
                  />
                  <AxisTicks
                    origin={[mom.ox, mom.zeroY - 80]}
                    end={[mom.ox, mom.zeroY + 40]}
                    values={yVals}
                    map={(v) => [mom.ox, mom.zeroY - v * mom.sc]}
                    unit="kN·m"
                    side="left"
                    decimals={0}
                  />
                  <InlineLegend
                    items={[
                      { label: 'Moments appuis', color: '#EF4444' },
                      { label: 'Moments travée', color: '#22C55E' },
                    ]}
                    x={mom.ox + mom.w - 140}
                    y={mom.zeroY - 80}
                  />
                </>
              );
            })() : (
              <text x={300} y={100} fontSize={12} fill="#94A3B8" textAnchor="middle">
                {res ? 'Données insuffisantes' : 'computing…'}
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
                  ['M_appuis max', `${Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1)} kN·m`],
                  ['M_travée max', `${Math.max(...res.moments_travee.map(m => Math.abs(m)), 0).toFixed(1)} kN·m`],
                  ['Travées', `${res.moments_travee.length}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-semibold text-blue-700 mb-1">Moments Appuis</div>
                    {res.moments_appuis.map((m, i) => (
                      <div key={i} className="font-mono">A{i + 1}: {m.toFixed(1)} kN·m</div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold text-green-700 mb-1">Moments Mi-Travée</div>
                    {res.moments_travee.map((m, i) => (
                      <div key={i} className="font-mono">T{i + 1}: {m.toFixed(1)} kN·m</div>
                    ))}
                  </div>
                  <div>
                    <div className="font-semibold text-red-700 mb-1">Moments Max</div>
                    {res.moments_max.map((m, i) => (
                      <div key={i} className="font-mono">T{i + 1}: {m.toFixed(1)} kN·m</div>
                    ))}
                  </div>
                </div>
              </div>
              <FormulaCard
                title="Poutres rotules + tables"
                latex={String.raw`M \le M_{Rd} \quad x_u/d \le 0.45`}
                description="Sections en T, largeur efficace"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{app}`, meaning: 'Moment sur appui max', value: Math.max(...res.moments_appuis.map(m => Math.abs(m))).toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`M_{Rd}`, meaning: 'Capacité', value: Math.max(...res.moments_max.map(m => Math.abs(m)), 0).toFixed(1), unit: 'kN·m' },
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
