import { useState } from 'react';
import type { BoussinesqLagrangeInputs, BoussinesqLagrangeOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: BoussinesqLagrangeInputs = {
  ha: 2.0, hb: 3.0, hc: 0.0,
  ea: 30.0, eb: 15.0, ec: 50.0,
  q: 0.1, lx: 6.0, ly: 4.0,
  nx: 6, ny: 4, dx: 1.0, dy: 1.0,
  xr: 3.0, yr: 2.0,
  code: 1, r_plaque: 0.375,
};


export default function Module125() {
  const [inp, setInp] = useState<BoussinesqLagrangeInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<BoussinesqLagrangeInputs, BoussinesqLagrangeOutput>(
    'calculate_boussinesq_lagrange_125', inp,
  );
  const S = (k: keyof BoussinesqLagrangeInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const totalDepth = inp.ha + inp.hb + inp.hc;

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof BoussinesqLagrangeInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="125 Boussinesq-Lagrange"
      subtitle="Tassement multicouche — plaques Westergaard"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Couche 1 (haut)</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ha', 'ha', 'm', 0, 20, 0.5)}
          {slider('ea', 'Ea', 'MN/m²', 1, 200, 1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Couche 2</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('hb', 'hb', 'm', 0, 20, 0.5)}
          {slider('eb', 'Eb', 'MN/m²', 1, 200, 1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Couche 3 (base)</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('hc', 'hc', 'm', 0, 20, 0.5)}
          {slider('ec', 'Ec', 'MN/m²', 1, 200, 1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charge</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('q', 'q', 'MN/m²', 0.001, 1, 0.01)}
          {slider('r_plaque', 'R plaque', 'm', 0.1, 2, 0.025)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Grille</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('nx', 'nx', '-', 2, 20, 1)}
          {slider('ny', 'ny', '-', 2, 20, 1)}
          {slider('dx', 'dx', 'm', 0.1, 5, 0.1)}
          {slider('dy', 'dy', 'm', 0.1, 5, 0.1)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Plaque Westergaard</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('code', 'code', '-', 0, 1, 1)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Profil de sol" vbW={300} vbH={200}>
            {(() => {
              const ox = 60, oy = 20;
              const maxH = Math.max(totalDepth, 1);
              const sc = 140 / maxH;
              const w = 180;
              const h1 = inp.ha * sc;
              const h2 = inp.hb * sc;
              const h3 = inp.hc * sc;
              return (
                <g>
                  <rect x={ox} y={oy} width={w} height={h1} fill="#93c5fd" stroke="#3b82f6" strokeWidth={0.5} />
                  <rect x={ox} y={oy + h1} width={w} height={h2} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.5} />
                  {h3 > 0 && <rect x={ox} y={oy + h1 + h2} width={w} height={h3} fill="#a78bfa" stroke="#7c3aed" strokeWidth={0.5} />}
                  <text x={ox + w + 5} y={oy + h1 / 2 + 3} fontSize={7} fill="#64748b">ha={inp.ha}m E={inp.ea}</text>
                  <text x={ox + w + 5} y={oy + h1 + h2 / 2 + 3} fontSize={7} fill="#64748b">hb={inp.hb}m E={inp.eb}</text>
                  {h3 > 0 && <text x={ox + w + 5} y={oy + h1 + h2 + h3 / 2 + 3} fontSize={7} fill="#64748b">hc={inp.hc}m E={inp.ec}</text>}
                  <text x={ox + w / 2} y={oy - 5} textAnchor="middle" fontSize={8} fill="#1e293b" fontWeight="bold">Charge q={inp.q} MN/m²</text>
                  <line x1={ox + w / 2 - 30} y1={oy - 2} x2={ox + w / 2 + 30} y2={oy - 2} stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrow)" />
                  <defs><marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill="#ef4444" /></marker></defs>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Tassement (Recharts)</h2>
          {res && res.w_settlement.length > 0 && (
            <div className="h-48">
              <SectionCanvas title="Tassement (Recharts)" vbW={300} vbH={120}>
                {(() => {
                  const data = res.w_settlement.map((w) => w * 1000);
                  const maxVal = Math.max(...data, 0.1);
                  const barW = Math.min(300 / data.length - 1, 8);
                  return data.map((v, i) => {
                    const h = (v / maxVal) * 100;
                    const x = (i / data.length) * 300;
                    const color = v > 30 ? '#ef4444' : v > 20 ? '#f59e0b' : '#22c55e';
                    return <rect key={i} x={x} y={110 - h} width={barW} height={h} fill={color} rx={1} />;
                  });
                })()}
                <line x1={0} y1={110} x2={300} y2={110} stroke="#94a3b8" strokeWidth={0.5} />
                <text x={5} y={10} fontSize={7} fill="#64748b">w (mm)</text>
              </SectionCanvas>
            </div>
          )}
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>wmax = <b>{(res.w_max * 1000).toFixed(1)}</b> mm</div>
              <div>wavg = <b>{(res.w_avg * 1000).toFixed(1)}</b> mm</div>
              <div>pente max = <b>{(res.slope_max * 1000).toFixed(2)}</b> mm/m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>k rigide = <b>{res.kw_rigid.toFixed(1)}</b> MN/m³</div>
              <div>k souple = <b>{res.kw_flexible.toFixed(1)}</b> MN/m³</div>
              <div>Rsol max = <b>{res.reaction_max.toFixed(3)}</b> MN/m²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Boussinesq multicouche"
                latex={String.raw`\Delta\sigma_z = \frac{3Q}{2\pi z^2}\cos^5\theta`}
                description="Diffusion ponctuelle + Westergaard"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`Q`, meaning: 'Charge ponctuelle', value: res.kw_rigid.toFixed(1) },
                    { symbol: String.raw`z`, meaning: 'Profondeur', value: res.kw_flexible.toFixed(1) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.w_max < 0.020 ? 'text-green-600' : res.w_max < 0.030 ? 'text-yellow-600' : 'text-red-600'}>
              {res.w_max < 0.020 ? '✓' : res.w_max < 0.030 ? '⚠' : '✗'} Tassement max = {(res.w_max * 1000).toFixed(1)}mm
            </li>
            <li className={res.slope_max < 0.002 ? 'text-green-600' : 'text-yellow-600'}>
              {res.slope_max < 0.002 ? '✓' : '⚠'} Pente max = {(res.slope_max * 1000).toFixed(2)}mm/m
            </li>
            <li className="text-slate-500">• k rigid = {res.kw_rigid.toFixed(1)} MN/m³</li>
            <li className="text-slate-500">• k flexible = {res.kw_flexible.toFixed(1)} MN/m³</li>
            <li className="text-slate-500">• Profil: {inp.ha}m / {inp.hb}m / {inp.hc}m</li>
            <li className="text-slate-500">• Grille: {inp.nx}×{inp.ny} = {(inp.nx + 1) * (inp.ny + 1)} noeuds</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
