import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup } from '../../components/drafting';
import { CisaiSectionQQEnFCInputs, CisaiSectionQQEnFCOutput } from '../../types/engineering';

export default function Module179() {
  const n = 6;
  const R0 = 0.3;
  const [inp, setInp] = useState<CisaiSectionQQEnFCInputs>({
    NEd: 500, MEd: 200, R: R0, na: 6, Ac: 3.14e-4,
    tabs: [
      Array(n).fill(1),
      Array(n).fill(3.14e-4),
      Array.from({ length: n }, (_, i) => +(R0 - R0 * Math.cos(2 * Math.PI * i / n)).toFixed(4)),
    ],
    fyk: 500, gs: 1.15, k: 1.05, euk: 0.025,
    fcd: 17.0, ec1: 0.00175, ecu1: 0.0035, typ: 1, itour: 20,
  });
  const { data: res, error: err, live } = useModuleCalc<CisaiSectionQQEnFCInputs, CisaiSectionQQEnFCOutput>(
    'calculate_cisai_section_qq_en_fc_179', inp,
  );
  const S = (k: keyof CisaiSectionQQEnFCInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.ratio < 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof CisaiSectionQQEnFCInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const cx = 150, cy = 100, rPx = 70;
  const barPhi = 16;
  const pxPerMm = rPx / (inp.R * 1000);

  return (
    <Workstation
      title="179 Cisaillement Section QQ en FC"
      subtitle="Vérification cisaillement section arbitraire (FC2A) — RUST"
      eurocode="EC2 §6.2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations</div>
          {slider('NEd', 'NEd', 'kN', 0, 5000, 50)}
          {slider('MEd', 'MEd', 'kN·m', 0, 2000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('R', 'R (rayon)', 'm', 0.1, 1, 0.05)}
          {slider('na', 'na (barres)', '', 2, 20, 1)}
          {slider('Ac', 'Ac (barre)', 'm²', 0, 0.002, 0.00001)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Acier</div>
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          {slider('k', 'k', '', 0.5, 2, 0.05)}
          {slider('euk', 'εuk', '', 0.005, 0.05, 0.001)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Béton</div>
          {slider('fcd', 'fcd', 'MPa', 5, 40, 0.5)}
          {slider('ec1', 'εc1', '', 0.001, 0.003, 0.0001)}
          {slider('ecu1', 'εcu1', '', 0.002, 0.005, 0.0001)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Loi béton</label>
            <select className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15"
              value={inp.typ} onChange={e => setInp({ ...inp, typ: parseInt(e.target.value) })}>
              <option value={1}>Parabola-Rectangle</option>
              <option value={2}>Sargin</option>
              <option value={3}>Linéaire</option>
            </select>
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section circulaire fissurée" vbW={500} vbH={220}>
            <circle cx={cx} cy={cy} r={rPx} fill="#60a5fa" opacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
            <line x1={cx - rPx} y1={cy} x2={cx + rPx} y2={cy} stroke="#94a3b8" strokeWidth={0.7} strokeDasharray="4,3" />
            <RebarGroup
              bars={Array.from({ length: Math.round(inp.na) }, (_, i) => {
                const a = (i / Math.max(1, Math.round(inp.na))) * 2 * Math.PI;
                return { x: cx + (rPx - 12) * Math.cos(a), y: cy + (rPx - 12) * Math.sin(a), phi: barPhi };
              })}
              pxPerMm={pxPerMm}
            />
            <DimensionLine x1={cx} y1={cy} x2={cx + rPx} y2={cy} offset={-20} text={`R = ${inp.R} m`} />
            <text x={cx} y={cy + rPx + 30} fontSize={10} fill="#64748b" textAnchor="middle">
              NEd = {inp.NEd} kN — MEd = {inp.MEd} kN·m
            </text>
            {res && (
              <text x={cx} y={cy + rPx + 44} fontSize={11} fill={res.ratio >= 1 ? '#22c55e' : '#ef4444'} fontWeight="bold" textAnchor="middle">
                NRd = {res.NRd.toFixed(0)} — MRd = {res.MRd.toFixed(0)}
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
                  ['NRd', `${res.NRd.toFixed(1)} kN`],
                  ['MRd', `${res.MRd.toFixed(1)} kN·m`],
                  ['Ratio', res.ratio.toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Cisaillement QQ en FC"
                latex={String.raw`V_{Rd,c} = C_{Rd,c} k (100\rho_l f_{ck})^{1/3} b_w d`}
                description="Sections quelconques fissurées"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_{Rd}`, meaning: 'Effort résistant', value: res.NRd.toFixed(1), unit: 'kN' },
                  { symbol: String.raw`M_{Rd}`, meaning: 'Moment résistant', value: res.MRd.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`R_{d}/R_{e}`, meaning: 'Ratio', value: res.ratio.toFixed(3) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio >= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                <li className={res.ratio >= 1.0 ? 'text-green-600' : 'text-red-600'}>
                  {res.ratio >= 1.0 ? '✓' : '✗'} Ratio = {res.ratio.toFixed(3)}
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
