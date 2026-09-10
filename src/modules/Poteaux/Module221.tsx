import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { FeuFlambementInputs, FeuFlambementOutput } from '../../types/engineering';

const SECTIONS = ['Rectangulaire', 'Circulaire', 'Voile (par m)'];

export default function Module221() {
  const [inp, setInp] = useState<FeuFlambementInputs>({
    section: 0, b: 300, h: 300, a: 40, as_tot: 2000, l0fi: 1.75, fck: 30, fyk: 500, r: 90, n_ed_fi: 700,
  });
  const { data: res, error: err, live } = useModuleCalc<FeuFlambementInputs, FeuFlambementOutput>(
    'calculate_feu_flambement_221',
    { ...inp, section: Math.round(inp.section) },
  );
  const S = (k: keyof FeuFlambementInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.ratio > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FeuFlambementInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  const W = 120, H = 170, x0 = 140, y0 = 35;
  const azPx = res ? Math.min(res.az * 0.8, W / 2 - 4) : 0;

  return (
    <Workstation
      title="221 Flambement au feu"
      subtitle="Poteaux rect./circ. + voiles — zone endommagée + courbe χfi — RUST"
      eurocode="EC2-1-2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Élément</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Section</label>
            <select
              value={inp.section}
              onChange={(e) => setInp({ ...inp, section: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
            >
              {SECTIONS.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </div>
          {slider('b', inp.section === 1 ? 'D' : 'b', 'mm', 150, 800, 10)}
          {inp.section !== 1 && slider('h', inp.section === 2 ? 'épaisseur' : 'h', 'mm', 100, 800, 10)}
          {slider('a', 'a', 'mm', 20, 80, 1)}
          {slider('as_tot', 'As', 'mm²', 0, 15000, 100)}
          {slider('l0fi', 'l0,fi', 'm', 0.5, 8, 0.25)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Feu & charge</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('r', 'R', 'min', 30, 240, 30)}
          {slider('n_ed_fi', 'NEd,fi', 'kN', 0, 5000, 10)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Poteau chauffé — zone endommagée" vbW={400} vbH={240}>
            <rect x={x0} y={y0} width={W} height={H} fill="#FECACA" opacity={0.5} stroke="#991B1B" strokeWidth={2} />
            {res && (
              <>
                <rect
                  x={x0 + azPx} y={y0 + azPx} width={W - 2 * azPx} height={H - 2 * azPx}
                  fill="#DBEAFE" opacity={0.5} stroke="#1D4ED8" strokeWidth={2}
                />
                <DimensionLine
                  x1={x0} y1={y0} x2={x0 + azPx} y2={y0} offset={-12}
                  text={`az=${res.az.toFixed(0)}`}
                />
                <text x={x0 + W / 2} y={y0 + H + 16} fontSize={10} fill="#94a3b8" textAnchor="middle">
                  az={res.az.toFixed(0)} mm — χ={res.chi.toFixed(2)}
                </text>
              </>
            )}
            <line x1={x0 + W + 20} y1={y0} x2={x0 + W + 20} y2={y0 + H} stroke="#64748b" strokeWidth={2} strokeDasharray="6,3" />
            <text x={x0 + W + 26} y={y0 + H / 2} fontSize={10} fill="#94a3b8">l0,fi={inp.l0fi} m</text>
            <text x={x0 + W / 2} y={y0 - 8} fontSize={12} textAnchor="middle">🔥</text>
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['NRd,fi', `${res.n_rd_fi.toFixed(0)} kN`],
                  ['χfi', res.chi.toFixed(2)],
                  ['λfi', res.lambda_fi.toFixed(0)],
                  ['az', `${res.az.toFixed(0)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flambement au feu"
                latex={String.raw`N_{Ed,fi} \le N_{Rd,fi}`}
                description="Zone endommagée + chi-feu"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`a_z`, meaning: 'Zone endommagée', value: res.az.toFixed(0), unit: 'mm' },
                  { symbol: String.raw`\chi_{fi}`, meaning: 'Réduction', value: res.chi.toFixed(2) },
                  { symbol: String.raw`N_{Rd,fi}`, meaning: 'Capacité à chaud', value: res.n_rd_fi.toFixed(0), unit: 'kN' },
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
