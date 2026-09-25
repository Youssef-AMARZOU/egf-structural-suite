import { useState, useMemo } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { TracesCableDalleInputs, TracesCableDalleOutput } from '../../types/engineering';

const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
const pick = (parsed: number[], fb: number[]) => parsed.length > 0 ? parsed : fb;

export default function Module185() {
  const [inp, setInp] = useState<TracesCableDalleInputs>({
    L: 8, tp1: [10, 0, 0], tp2: [10, 0, 0], ta: [0, 0, 0], tb: [8, 0, 0],
    P: 1200, del: 0.15, lam: 0.5, h: 0.25, c_inf: 0.04, c_sup: 0.04,
  });
  const [txt, setTxt] = useState({ tp1: '10, 0, 0', tp2: '10, 0, 0', ta: '0, 0, 0', tb: '8, 0, 0' });

  const payload: TracesCableDalleInputs = useMemo(() => ({
    ...inp,
    tp1: pick(parseList(txt.tp1), inp.tp1),
    tp2: pick(parseList(txt.tp2), inp.tp2),
    ta: pick(parseList(txt.ta), inp.ta),
    tb: pick(parseList(txt.tb), inp.tb),
  }), [txt.tp1, txt.tp2, txt.ta, txt.tb, inp]);

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

  const field = (key: keyof typeof txt, label: string, placeholder: string) => (
    <div className="mb-1">
      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
        value={txt[key]} onChange={e => setTxt({ ...txt, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  const sketchData = useMemo(() => {
    if (!res) return null;
    const ox = 50, oy = 30, w = 500, hBeam = 40, gap = 50;
    const totalH = hBeam + gap * 2 + 60;

    const yBeamTop = gap + 20;
    const yBeamBot = yBeamTop + hBeam;
    const yCableTop = yBeamTop + parseFloat(inp.c_sup.toString()) / inp.h * hBeam;
    const yCableBot = yBeamBot - parseFloat(inp.c_inf.toString()) / inp.h * hBeam;

    const cableLowX = ox + inp.lam * w;
    const cableLowY = yCableBot;

    const loadScale = gap * 0.7 / Math.max(...res.moment.map(Math.abs), 1);
    const maxLoad = Math.max(...inp.tp1, ...inp.tp2, 1);
    const loadH = gap * 0.6 / Math.max(maxLoad, 1);

    return { ox, oy, w, hBeam, gap, totalH, yBeamTop, yBeamBot, yCableTop, yCableBot, cableLowX, cableLowY, loadScale, loadH };
  }, [res, inp]);

  return (
    <Workstation
      title="185 Traces Câble Dalle"
      subtitle="Balayage M/V sous charges trapézoïdales + profil câble parabolique (dalle précontrainte) — RUST"
      eurocode="EC2 §5.10"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Travée</div>
          {slider('L', 'Longueur L', 'm', 2, 20, 0.5)}
          {slider('h', 'Épaisseur dalle h', 'm', 0.1, 1, 0.01)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charges trapézoïdales</div>
          {field('tp1', 'p₁ (kN/m, début de charge)', '10, 0, 0')}
          {field('tp2', 'p₂ (kN/m, fin de charge)', '10, 0, 0')}
          {field('ta', 'a (m, début de la charge)', '0, 0, 0')}
          {field('tb', 'b (m, longueur de la charge)', '8, 0, 0')}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Précontrainte</div>
          {slider('P', 'Force P', 'kN', 0, 3000, 50)}
          {slider('del', 'Flèche δ', 'm', 0, 0.5, 0.01)}
          {slider('lam', 'Position λ (point bas /L)', '', 0.05, 0.95, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Enrobage</div>
          {slider('c_inf', 'c inf (dessous)', 'm', 0, 0.2, 0.005)}
          {slider('c_sup', 'c sup (dessus)', 'm', 0, 0.2, 0.005)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Vue en coupe — dalle + profil câble + charges" vbW={600} vbH={260}>
              {sketchData && (() => {
                const s = sketchData;
                return (
                  <>
                    <line x1={s.ox} y1={s.yBeamBot} x2={s.ox + s.w} y2={s.yBeamBot} stroke="#475569" strokeWidth={1.5} />
                    <line x1={s.ox} y1={s.yBeamTop} x2={s.ox + s.w} y2={s.yBeamTop} stroke="#475569" strokeWidth={1.5} />
                    <line x1={s.ox} y1={s.yBeamTop} x2={s.ox} y2={s.yBeamBot} stroke="#475569" strokeWidth={1.5} />
                    <line x1={s.ox + s.w} y1={s.yBeamTop} x2={s.ox + s.w} y2={s.yBeamBot} stroke="#475569" strokeWidth={1.5} />
                    <rect x={s.ox} y={s.yBeamTop} width={s.w} height={s.hBeam} fill="#e2e8f0" fillOpacity={0.3} stroke="none" />

                    <polygon points={`${s.ox},${s.yBeamBot + 12} ${s.ox - 8},${s.yBeamBot + 24} ${s.ox + 8},${s.yBeamBot + 24}`}
                      fill="#94A3B8" stroke="#64748B" strokeWidth={0.5} />
                    <text x={s.ox} y={s.yBeamBot + 36} fontSize={9} fill="#CBD5E1" textAnchor="middle">A₁</text>
                    <polygon points={`${s.ox + s.w},${s.yBeamBot + 12} ${s.ox + s.w - 8},${s.yBeamBot + 24} ${s.ox + s.w + 8},${s.yBeamBot + 24}`}
                      fill="#94A3B8" stroke="#64748B" strokeWidth={0.5} />
                    <text x={s.ox + s.w} y={s.yBeamBot + 36} fontSize={9} fill="#CBD5E1" textAnchor="middle">A₂</text>

                    {inp.tp1.map((p1, i) => {
                      const a = inp.ta[i] || 0;
                      const b = inp.tb[i] || 0;
                      if (b <= 0) return null;
                      const x1 = s.ox + (a / inp.L) * s.w;
                      const x2 = s.ox + ((a + b) / inp.L) * s.w;
                      const p2 = inp.tp2[i] || 0;
                      const h1 = Math.abs(p1) * s.loadH;
                      const h2 = Math.abs(p2) * s.loadH;
                      const yTop = s.yBeamTop - Math.max(h1, h2) - 5;
                      const pts = `${x1},${s.yBeamTop} ${x1},${yTop + (h1 < h2 ? h2 - h1 : 0)} ${x2},${yTop + (h2 < h1 ? h1 - h2 : 0)} ${x2},${s.yBeamTop}`;
                      return (
                        <g key={`load-${i}`}>
                          <polygon points={pts} fill="#3B82F6" fillOpacity={0.25} stroke="#3B82F6" strokeWidth={0.8} />
                          {Array.from({ length: Math.max(3, Math.floor((x2 - x1) / 15)) }, (_, j) => {
                            const frac = j / Math.max(1, Math.floor((x2 - x1) / 15) - 1);
                            const x = x1 + frac * (x2 - x1);
                            const pH = h1 + (h2 - h1) * frac;
                            return (
                              <line key={j} x1={x} y1={s.yBeamTop - pH - 5} x2={x} y2={s.yBeamTop - 2}
                                stroke="#3B82F6" strokeWidth={0.8} markerEnd="url(#arrowBlue)" />
                            );
                          })}
                          <text x={(x1 + x2) / 2} y={yTop - 3} fontSize={8} fill="#60A5FA" textAnchor="middle">
                            {p1 !== 0 || p2 !== 0 ? `${p1}/${p2} kN/m` : ''}
                          </text>
                        </g>
                      );
                    })}

                    <defs>
                      <marker id="arrowBlue" markerWidth={6} markerHeight={4} refX={3} refY={2} orient="auto">
                        <path d="M0,0 L6,2 L0,4 Z" fill="#3B82F6" />
                      </marker>
                    </defs>

                    <path
                      d={(() => {
                        const ySup = s.yCableTop;
                        const yInf = s.yCableBot;
                        const lamX = s.ox + inp.lam * s.w;
                        const steps = 40;
                        let d = '';
                        for (let i = 0; i <= steps; i++) {
                          const frac = i / steps;
                          const x = s.ox + frac * s.w;
                          const tRel = frac * inp.L;
                          let yCable: number;
                          if (tRel <= inp.lam * inp.L) {
                            const t = inp.lam * inp.L > 1e-9 ? tRel / (inp.lam * inp.L) : 0;
                            yCable = ySup - (ySup - yInf) * (2 * t - t * t);
                          } else {
                            const t = (1 - inp.lam) * inp.L > 1e-9 ? (tRel - inp.lam * inp.L) / ((1 - inp.lam) * inp.L) : 0;
                            yCable = yInf + (ySup - yInf) * t * t;
                          }
                          d += (i === 0 ? 'M' : 'L') + `${x},${yCable} `;
                        }
                        return d;
                      })()}
                      fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6,3"
                    />
                    <circle cx={s.cableLowX} cy={s.cableLowY} r={3} fill="#F59E0B" stroke="#92400E" strokeWidth={1} />

                    <line x1={s.cableLowX} y1={s.cableLowY - 10} x2={s.cableLowX} y2={s.cableLowY + 10}
                      stroke="#F59E0B" strokeWidth={0.5} strokeDasharray="2,2" />
                    <text x={s.cableLowX} y={s.cableLowY - 14} fontSize={8} fill="#FBBF24" textAnchor="middle">
                      λL = {(inp.lam * inp.L).toFixed(1)} m
                    </text>

                    <line x1={s.ox + 5} y1={s.yBeamBot + 40} x2={s.ox + s.w - 5} y2={s.yBeamBot + 40}
                      stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={s.ox + 5} y1={s.yBeamBot + 36} x2={s.ox + 5} y2={s.yBeamBot + 44} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={s.ox + s.w - 5} y1={s.yBeamBot + 36} x2={s.ox + s.w - 5} y2={s.yBeamBot + 44} stroke="#94A3B8" strokeWidth={0.8} />
                    <text x={s.ox + s.w / 2} y={s.yBeamBot + 52} fontSize={9} fill="#CBD5E1" textAnchor="middle">L = {inp.L} m</text>

                    <line x1={s.ox + s.w + 10} y1={s.yBeamTop} x2={s.ox + s.w + 10} y2={s.yBeamBot}
                      stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={s.ox + s.w + 6} y1={s.yBeamTop} x2={s.ox + s.w + 14} y2={s.yBeamTop} stroke="#94A3B8" strokeWidth={0.8} />
                    <line x1={s.ox + s.w + 6} y1={s.yBeamBot} x2={s.ox + s.w + 14} y2={s.yBeamBot} stroke="#94A3B8" strokeWidth={0.8} />
                    <text x={s.ox + s.w + 18} y={(s.yBeamTop + s.yBeamBot) / 2 + 3} fontSize={8} fill="#CBD5E1">h={inp.h} m</text>

                    <InlineLegend
                      items={[
                        { label: 'Câble (profil)', color: '#F59E0B', dashed: true },
                        { label: 'Charges trapézoïdales', color: '#3B82F6' },
                        { label: 'Dalle', color: '#94A3B8' },
                      ]}
                      x={s.ox + 5} y={5}
                    />
                  </>
                );
              })()}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Diagramme de moment fléchissant M(x)" vbW={600} vbH={200}>
              {res && (() => {
                const ox = 50, oy = 20, w = 480, h = 140;
                const pts: [number, number][] = res.x.map((x, i) => [
                  ox + (x / inp.L) * w,
                  oy + h / 2 - (res.moment[i] / Math.max(Math.abs(res.m_max), Math.abs(res.m_min), 1)) * (h * 0.4),
                ]);
                const xVals = [0, inp.L / 4, inp.L / 2, (3 * inp.L) / 4, inp.L];
                const allM = res.moment;
                const yMin = Math.min(...allM);
                const yMax = Math.max(...allM);
                const yVals = [...new Set([yMin, 0, yMax])].sort((a, b) => a - b)
                  .filter((v, i, a) => i === 0 || Math.abs(((a[i] - a[i - 1]) / Math.max(Math.abs(yMax), Math.abs(yMin), 1)) * h * 0.4) >= 15);
                return (
                  <>
                    <line x1={ox} y1={oy + h / 2} x2={ox + w} y2={oy + h / 2} stroke="#334155" strokeWidth={0.5} />
                    <DiagramOverlay type="moment" points={pts} />
                    <AxisTicks
                      origin={[ox, oy + h / 2 + 15]}
                      end={[ox + w, oy + h / 2 + 15]}
                      values={xVals}
                      map={(v) => [ox + (v / inp.L) * w, oy + h / 2 + 15]}
                      unit="m" side="below" decimals={1}
                    />
                    <AxisTicks
                      origin={[ox - 5, oy]}
                      end={[ox - 5, oy + h]}
                      values={yVals}
                      map={(v) => [ox - 5, oy + h / 2 - (v / Math.max(Math.abs(yMax), Math.abs(yMin), 1)) * (h * 0.4)]}
                      unit="kN·m" side="left" decimals={0}
                    />
                    <InlineLegend
                      items={[{ label: 'M(x)', color: '#EF4444' }]}
                      x={ox + w - 100} y={5}
                    />
                  </>
                );
              })()}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Effort tranchant V(x)" vbW={600} vbH={180}>
              {res && (() => {
                const ox = 50, oy = 20, w = 480, h = 130;
                const vMax = Math.max(...res.shear.map(Math.abs), 1);
                const pts: [number, number][] = res.x.map((x, i) => [
                  ox + (x / inp.L) * w,
                  oy + h / 2 - (res.shear[i] / vMax) * (h * 0.4),
                ]);
                const xVals = [0, inp.L / 4, inp.L / 2, (3 * inp.L) / 4, inp.L];
                const yMin = Math.min(...res.shear);
                const yMax = Math.max(...res.shear);
                const yVals = [yMin, 0, yMax].sort((a, b) => a - b)
                  .filter((v, i, a) => i === 0 || Math.abs(((a[i] - a[i - 1]) / vMax) * h * 0.4) >= 15);
                return (
                  <>
                    <line x1={ox} y1={oy + h / 2} x2={ox + w} y2={oy + h / 2} stroke="#334155" strokeWidth={0.5} />
                    <DiagramOverlay type="shear" points={pts} color="#3B82F6" />
                    <AxisTicks
                      origin={[ox, oy + h / 2 + 15]}
                      end={[ox + w, oy + h / 2 + 15]}
                      values={xVals}
                      map={(v) => [ox + (v / inp.L) * w, oy + h / 2 + 15]}
                      unit="m" side="below" decimals={1}
                    />
                    <AxisTicks
                      origin={[ox - 5, oy]}
                      end={[ox - 5, oy + h]}
                      values={yVals}
                      map={(v) => [ox - 5, oy + h / 2 - (v / vMax) * (h * 0.4)]}
                      unit="kN" side="left" decimals={0}
                    />
                    <InlineLegend
                      items={[{ label: 'V(x)', color: '#3B82F6' }]}
                      x={ox + w - 100} y={5}
                    />
                  </>
                );
              })()}
            </SectionCanvas>
          </div>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['M_max', `${res.m_max.toFixed(2)} kN·m`],
                  ['M_min', `${res.m_min.toFixed(2)} kN·m`],
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
                title="Équilibre du câble"
                latex={String.raw`y(x) = \frac{4\delta\, x(L-x)}{L^2} \quad w_{bal} = \frac{8P\delta}{L^2}`}
                description="Deux demi-paraboles se rejoignant au point bas λL"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\delta`, meaning: 'Flèche du câble', value: (inp.del * 1000).toFixed(0), unit: 'mm' },
                  { symbol: String.raw`\lambda`, meaning: 'Position du point bas', value: inp.lam.toFixed(2), unit: '' },
                  { symbol: String.raw`w_{bal}`, meaning: 'Charge équilibrée', value: res.w_bal.toFixed(2), unit: 'kN/m' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.m_max.toFixed(2), unit: 'kN·m' },
                  { symbol: String.raw`|V|_{max}`, meaning: 'Tranchant max', value: res.v_max.toFixed(2), unit: 'kN' },
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
