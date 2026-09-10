import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { DalleAlveoleeInputs, DalleAlveoleeOutput } from '../../types/engineering';

export default function Module235() {
  const [inp, setInp] = useState<DalleAlveoleeInputs>({
    b: 1200, h: 265, n_vides: 6, d_vide: 180, ap: 900, sig_pinf: 1100, c: 40,
    fck: 45, fpu: 1860, m_ed: 120, v_ed: 90, m_els: 85,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleAlveoleeInputs, DalleAlveoleeOutput>(
    'calculate_dalle_alveolee_235',
    { ...inp, n_vides: Math.round(inp.n_vides) },
  );
  const S = (k: keyof DalleAlveoleeInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res
    ? 'computing'
    : res.ratio_m > 1 || res.ratio_v > 1
      ? 'fail'
      : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleAlveoleeInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- hollow-core cross-section (400x160 canvas) ----
  const W = 320, H = 100, x0 = 40, y0 = 30;
  const sx = W / inp.b, sy = H / inp.h;
  const n = Math.max(Math.round(inp.n_vides), 1);
  const step = W / n;

  return (
    <Workstation
      title="235 Dalle alvéolée précontrainte"
      subtitle="EN 1168 / EC2 — flexion, cisaillement sans étriers, contraintes ELS — RUST"
      eurocode="EN 1168 · EC2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie & précontrainte</div>
          {slider('b', 'b (élément)', 'mm', 600, 2400, 50)}
          {slider('h', 'h', 'mm', 150, 500, 5)}
          {slider('n_vides', 'nb alvéoles', '-', 1, 12, 1)}
          {slider('d_vide', 'Ø alvéole', 'mm', 80, 350, 5)}
          {slider('ap', 'Ap', 'mm²', 100, 3000, 20)}
          {slider('sig_pinf', 'σp∞', 'MPa', 600, 1400, 10)}
          {slider('c', 'Enrobage torons', 'mm', 20, 80, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & charges</div>
          {slider('fck', 'fck', 'MPa', 25, 80, 1)}
          {slider('fpu', 'fpu torons', 'MPa', 1500, 2100, 10)}
          {slider('m_ed', 'MEd', 'kN·m', 0, 500, 5)}
          {slider('v_ed', 'VEd', 'kN', 0, 400, 5)}
          {slider('m_els', 'M ELS', 'kN·m', 0, 400, 5)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Coupe alvéolée" vbW={400} vbH={160}>
            <rect x={x0} y={y0} width={W} height={H} fill="#DBEAFE" opacity={0.5} stroke="#64748b" strokeWidth={2} />
            {Array.from({ length: n }, (_, i) => (
              <ellipse
                key={i}
                cx={x0 + step * (i + 0.5)} cy={y0 + H / 2}
                rx={Math.min((inp.d_vide * sx) / 2, step / 2 - 2)} ry={(inp.d_vide * sy) / 2}
                fill="#fff" stroke="#1D4ED8" strokeWidth={1.5}
              />
            ))}
            <line
              x1={x0 + 6} y1={y0 + H - inp.c * sy} x2={x0 + W - 6} y2={y0 + H - inp.c * sy}
              stroke="#EF4444" strokeWidth={3}
            />
            <DimensionLine x1={x0} y1={y0 + H} x2={x0 + W} y2={y0 + H} offset={34} text={`b=${inp.b}`} />
            <DimensionLine x1={x0} y1={y0} x2={x0} y2={y0 + H} offset={-24} text={`h=${inp.h}`} />
            {res && (
              <text x={200} y={148} fontSize={10} fill="#22C55E" textAnchor="middle">
                Ap={inp.ap} mm² — MRd={res.m_rd.toFixed(0)} kN·m
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
                  ['MRd', `${res.m_rd.toFixed(1)} kN·m`],
                  ['VRd,c', `${res.v_rd.toFixed(0)} kN`],
                  ['Taux M/V', `${(res.ratio_m * 100).toFixed(0)}/${(res.ratio_v * 100).toFixed(0)} %`],
                  ['P∞', `${res.p_inf.toFixed(0)} kN`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Alvéolée précontrainte"
                latex={String.raw`V_{Rd,c} = \frac{I b_w}{S}\sqrt{f_{ctd}^2 + \sigma_{cp} f_{ctd}}`}
                description="Section nette + fibres ELS"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`M_{Rd}`, meaning: 'Moment résistant', value: res.m_rd.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`V_{Rd,c}`, meaning: 'Cisaillement sans étriers', value: res.v_rd.toFixed(0), unit: 'kN' },
                  { symbol: String.raw`\sigma_{cp}`, meaning: 'Précontrainte', value: res.p_inf.toFixed(0), unit: 'kN' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${status === 'fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'}`}>
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
