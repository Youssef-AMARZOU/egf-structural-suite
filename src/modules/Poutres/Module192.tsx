import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup, rowBars } from '../../components/drafting';
import { FlecheNuisibleEC2V2DInputs, FlecheNuisibleEC2V2DOutput } from '../../types/engineering';

export default function Module192() {
  const [inp, setInp] = useState<FlecheNuisibleEC2V2DInputs>({
    b: 200, h: 450, bw: 200, hf: 0, d: 400, dp: 50,
    L: 6000, fck: 30, fyd: 434.8, rho: 0.005, rho0: 0.001,
    As: 1000, Mt: 50, Mq: 30, T: 20, t0: 28, RH: 60, classe: 2,
  });
  const { data: res, error: err, live } = useModuleCalc<FlecheNuisibleEC2V2DInputs, FlecheNuisibleEC2V2DOutput>(
    'calculate_fleche_nuisible_ec2_v2d_192', inp,
  );
  const S = (k: keyof FlecheNuisibleEC2V2DInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.ratio > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FlecheNuisibleEC2V2DInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const k = Math.min(260 / inp.b, 150 / inp.h);
  const ox = 250 - (inp.b * k) / 2, oy = 30;
  const W = inp.b * k, H = inp.h * k;
  const ySteel = oy + inp.d * k;

  return (
    <Workstation
      title="192 Flèche Nuisible EC2 V2D"
      subtitle="Vérification flèche nuisible EC2 §7.4 — fluage + retrait — RUST"
      eurocode="EC2 §7.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'b', 'mm', 100, 1000, 10)}
          {slider('h', 'h', 'mm', 200, 1000, 10)}
          {slider('bw', 'bw', 'mm', 100, 1000, 10)}
          {slider('hf', 'hf', 'mm', 0, 300, 10)}
          {slider('d', 'd', 'mm', 100, 900, 10)}
          {slider('dp', 'dp', 'mm', 20, 200, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyd', 'fyd', 'MPa', 300, 600, 5)}
          {slider('rho', 'ρ', '', 0, 0.05, 0.001)}
          {slider('RH', 'RH', '%', 20, 100, 1)}
          {slider('t0', 't0', 'jours', 1, 365, 1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations</div>
          {slider('L', 'L', 'mm', 1000, 15000, 500)}
          {slider('Mt', 'Mt', 'kN·m', 0, 500, 5)}
          {slider('Mq', 'Mq', 'kN·m', 0, 500, 5)}
          {slider('As', 'As', 'mm²', 0, 5000, 50)}
          {slider('classe', 'Classe', '', 1, 3, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section en T + ferraillage" vbW={500} vbH={260} scaleLabel={`1 px ≈ ${(1 / k).toFixed(1)} mm`}>
              {inp.hf > 0 ? (
                <>
                  <rect x={ox} y={oy} width={W} height={Math.min(H, inp.hf * k)} fill="#60a5fa" opacity={0.3} stroke="#3b82f6" strokeWidth={1.2} />
                  <rect x={ox + (W - inp.bw * k) / 2} y={oy + Math.min(H, inp.hf * k)} width={inp.bw * k} height={H - Math.min(H, inp.hf * k)} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
                </>
              ) : (
                <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
              )}
              <RebarGroup bars={rowBars(4, ox + 12, ox + W - 12, ySteel, 16)} pxPerMm={k} />
              <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={22} text={`b = ${inp.b}`} />
              <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-28} text={`h = ${inp.h}`} />
              <DimensionLine x1={ox + W} y1={oy} x2={ox + W} y2={ySteel} offset={20} text={`d = ${inp.d}`} />
              {res && (
                <text x={250} y={oy + H + 40} textAnchor="middle" fontSize={11} fill={res.ratio <= 1 ? '#22c55e' : '#ef4444'} fontWeight="bold">
                  f = {res.fleche_fin.toFixed(2)} mm / Lim = {res.Lim.toFixed(1)} mm
                </text>
              )}
            </SectionCanvas>
          </div>

          {res && (
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
              <div className="text-xs font-semibold text-slate-500 mb-2">Comparaison Flèche / Limite</div>
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-6">
                <div className={`h-6 rounded-full ${res.ratio <= 1.0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(res.ratio * 100, 100)}%` }}>
                  <span className="text-white text-xs font-bold px-2">{(res.ratio * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
        </>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['f_elastique', `${res.fleche_el.toFixed(2)} mm`],
                  ['f_fluage', `${res.fleche_fp.toFixed(2)} mm`],
                  ['f_totale', `${res.fleche_fin.toFixed(2)} mm`],
                  ['Limite', `${res.Lim.toFixed(1)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Flèche nuisible (EC2 §7.4)"
                latex={String.raw`E_{c,eff} = \frac{E_{cm}}{1+\varphi} \quad f \le L/250`}
                description="Fluage + retrait, inertie fissurée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`f`, meaning: 'Flèche totale', value: res.fleche_fin.toFixed(2), unit: 'mm' },
                  { symbol: String.raw`L`, meaning: 'Portée', value: inp.L, unit: 'mm' },
                  { symbol: String.raw`f_{lim}`, meaning: 'Flèche limite', value: res.Lim.toFixed(1), unit: 'mm' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.ratio <= 1.0 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                <li className={res.ratio <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                  {res.ratio <= 1.0 ? '✓' : '✗'} f/Lim = {(res.ratio * 100).toFixed(0)}%
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
