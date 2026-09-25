import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import type { CentreTorsionGeneralInputs, CentreTorsionGeneralOutput } from '../../types/engineering';

const DEFAULT: CentreTorsionGeneralInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  n_voiles: 3, h: 200, l_totale: 6000,
  e1: 200, h1: 3000, e2: 200, h2: 3000,
  e3: 200, h3: 3000, l12: 3000, l23: 3000,
  vx: 100, vy: 50, mt: 200,
};

export default function Module151() {
  const [inp, setInp] = useState<CentreTorsionGeneralInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<CentreTorsionGeneralInputs, CentreTorsionGeneralOutput>(
    'calculate_centre_torsion_general_151', inp,
  );
  const S = (k: keyof CentreTorsionGeneralInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  const ox = 40, oy = 20, w = 420, h = 160;
  const cx = ox + w / 2;
  const cy = oy + h / 2;

  const status = err ? 'fail' : !res ? 'computing' : res.ratio > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof CentreTorsionGeneralInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="151 Centre Torsion"
      subtitle="Centre de torsion général — Henry Thonier — RUST"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'Résistance fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'Acier fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('n_voiles', 'Nb voiles', '-', 1, 5, 1)}
          {slider('h', 'Épaisseur h', 'mm', 50, 500, 10)}
          {slider('l_totale', 'Longueur totale L_tot', 'mm', 500, 20000, 100)}
          {slider('e1', 'Épaisseur e1', 'mm', 50, 500, 10)}
          {slider('h1', 'Hauteur h1', 'mm', 100, 10000, 100)}
          {slider('e2', 'Épaisseur e2', 'mm', 50, 500, 10)}
          {slider('h2', 'Hauteur h2', 'mm', 100, 10000, 100)}
          {slider('l12', 'Distance L12', 'mm', 500, 20000, 100)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations</div>
          {slider('vx', 'Tranchant Vx', 'kN', 0, 10000, 10)}
          {slider('vy', 'Tranchant Vy', 'kN', 0, 10000, 10)}
          {slider('mt', 'Moment torsion Mt', 'kN·m', 0, 50000, 100)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Plan — Centre de torsion" vbW={500} vbH={200}>
            <rect x={ox} y={oy} width={w} height={h} fill="#e2e8f0" stroke="#2563eb" strokeWidth={1.5} rx={2} />
            <line x1={cx} y1={oy} x2={cx} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />
            <line x1={ox} y1={cy} x2={ox + w} y2={cy} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="4,4" />
            {res && (
              <>
                <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
                <circle cx={cx} cy={cy} r={2} fill="#ef4444" />
                <text x={cx + 8} y={cy - 5} fontSize={7} fill="#2563eb">G ({res.xg.toFixed(2)}, {res.yg.toFixed(2)})</text>
                <text x={cx + 8} y={cy + 5} fontSize={7} fill="#ef4444">C ({res.xc.toFixed(2)}, {res.yc.toFixed(2)})</text>
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
                  ['IGxy', `${res.igxy.toFixed(4)} m⁴`],
                  ['α', `${res.alpha.toFixed(3)} rad`],
                  ['xG / yG', `${res.xg.toFixed(3)} / ${res.yg.toFixed(3)} m`],
                  ['xC / yC', `${res.xc.toFixed(3)} / ${res.yc.toFixed(3)} m`],
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
                title="Centre de torsion"
                latex={String.raw`x_T = \frac{\sum k_i x_i}{\sum k_i}`}
                description="Pondération par les raideurs"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`x_T`, meaning: 'Abscisse du centre', value: res.xc.toFixed(3), unit: 'm' },
                  { symbol: String.raw`y_T`, meaning: 'Ordonnée du centre', value: res.yc.toFixed(3), unit: 'm' },
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
