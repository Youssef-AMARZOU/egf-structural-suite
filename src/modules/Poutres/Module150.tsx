import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import type { Cdt1vvoileInputs, Cdt1vvoileOutput } from '../../types/engineering';

const DEFAULT: Cdt1vvoileInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  n_elements: 2,
  b1: 200, h1: 3000, th1: 0, a1: 0, b2: 0,
  b22: 200, th2: 0, a2: 3000, b3: 0,
  b33: 200, th3: 0, a3: 6000,
  vx: 100, vy: 50, mt: 200,
};

export default function Module150() {
  const [inp, setInp] = useState<Cdt1vvoileInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<Cdt1vvoileInputs, Cdt1vvoileOutput>(
    'calculate_cdt_1vvoile_150', inp,
  );
  const S = (k: keyof Cdt1vvoileInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  const ox = 40, oy = 20, w = 420, h = 160;
  const cx = ox + w / 2;
  const cy = oy + h / 2;

  const status = !res ? 'computing' : res.ratio > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Cdt1vvoileInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="150 CDT 1V Voile"
      subtitle="Voile porteux 1 étage — Inertie principale — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Élément 1</div>
          {slider('b1', 'b1', 'mm', 50, 500, 10)}
          {slider('h1', 'h1', 'mm', 100, 10000, 100)}
          {slider('th1', 'θ1', 'rad', -3.14, 3.14, 0.01)}
          {slider('a1', 'a1', 'mm', 0, 20000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Élément 2</div>
          {slider('b22', 'b2', 'mm', 50, 500, 10)}
          {slider('th2', 'θ2', 'rad', -3.14, 3.14, 0.01)}
          {slider('a2', 'a2', 'mm', 0, 20000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations</div>
          {slider('vx', 'Vx', 'kN', 0, 10000, 10)}
          {slider('vy', 'Vy', 'kN', 0, 10000, 10)}
          {slider('mt', 'Mt', 'kN·m', 0, 50000, 100)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Plan — Voile" vbW={500} vbH={200}>
            <rect x={ox} y={oy} width={w} height={h} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />
            <line x1={cx} y1={oy} x2={cx} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />
            <line x1={ox} y1={cy} x2={ox + w} y2={cy} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />
            {res && (
              <>
                <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
                <text x={cx + 8} y={cy - 5} fontSize={7} fill="#2563eb">G ({res.xg.toFixed(2)}, {res.yg.toFixed(2)})</text>
                <text x={ox + 5} y={oy + 15} fontSize={7} fill="#64748b">IGx={res.igx.toFixed(4)} m⁴</text>
                <text x={ox + 5} y={oy + 25} fontSize={7} fill="#64748b">IGy={res.igy.toFixed(4)} m⁴</text>
                <text x={ox + 5} y={oy + 35} fontSize={7} fill="#64748b">α={res.alpha.toFixed(3)} rad</text>
                <text x={ox + w / 2} y={oy + h + 12} textAnchor="middle" fontSize={8} fill="#64748b">
                  ZA={res.za.toFixed(3)}m² | σ_max={res.sigma_max.toFixed(2)}MPa
                </text>
                <DimensionLine x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} offset={-14} text={`ZA = ${res.za.toFixed(3)} m²`} />
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
                  ['IGx', `${res.igx.toFixed(4)} m⁴`],
                  ['IGy', `${res.igy.toFixed(4)} m⁴`],
                  ['α', `${res.alpha.toFixed(3)} rad`],
                  ['xG / yG', `${res.xg.toFixed(3)} / ${res.yg.toFixed(3)} m`],
                  ['xC / yC', `${res.xc.toFixed(3)} / ${res.yc.toFixed(3)} m`],
                  ['ZA', `${res.za.toFixed(3)} m²`],
                  ['σ_max', `${res.sigma_max.toFixed(2)} MPa`],
                  ['σ_max/f_ctd', `${(res.ratio * 100).toFixed(0)}%`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Voile 1 niveau"
                latex={String.raw`I_{1,2} = \frac{I_y+I_z}{2} \pm \sqrt{\left(\frac{I_y-I_z}{2}\right)^2 + I_{yz}^2}`}
                description="Inerties principales du voile"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`I_1`, meaning: 'Inertie majeure', value: res.igx.toFixed(4), unit: 'm⁴' },
                  { symbol: String.raw`I_2`, meaning: 'Inertie mineure', value: res.igy.toFixed(4), unit: 'm⁴' },
                  { symbol: String.raw`\alpha`, meaning: 'Angle principal', value: res.alpha.toFixed(3), unit: 'rad' },
                ]}
              />
              <div className="font-bold text-xs">{res.verdict}</div>
              <ul className="text-xs space-y-1.5">
                <li className={res.ratio <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                  {res.ratio <= 1.0 ? '✓' : '✗'} σ_max/f_ctd = {(res.ratio * 100).toFixed(0)}%
                </li>
                {res.diag.map((d: string, i: number) => (
                  <li key={i} className={`px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>{d}</li>
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
