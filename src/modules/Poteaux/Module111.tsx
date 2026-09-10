import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { PoteauComparInputs, PoteauComparOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas, DimensionLine, RebarGroup,
} from '../../components/drafting';

const DEFAULT: PoteauComparInputs = {
  bx: 400, by: 400,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  n_layers: 3, bars_per_layer: 4, phi: 16,
  d1: 40, d2: 360,
  n_points: 30,
  k_steel: 1.08, euk: 2.5,
  ec2: 2.0, n_parabola: 2.0,
};


export default function Module111() {
  const [inp, setInp] = useState<PoteauComparInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<PoteauComparInputs, PoteauComparOutput>(
    'calculate_poteau_compar_111', inp,
  );

  const S = (k: keyof PoteauComparInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));


  const chartData = res
    ? res.n_values.map((n, i) => ({
        n,
        m: res.m_pos[i],
      }))
    : [];

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PoteauComparInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="111 Poteau Compar"
      subtitle="Interaction N-M — EC2 / BAEL"
      eurocode="EC2"
      status={status}
      live={live}
      params={
        <>

        {/* Geometry */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('bx', 'bx', 'mm', 100, 2000, 50)}
          {slider('by', 'by', 'mm', 100, 2000, 50)}
        </div>

        {/* Reinforcement */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('n_layers', 'Couches', '-', 1, 6, 1)}
          {slider('bars_per_layer', 'Bar/couche', '-', 1, 12, 1)}
          {slider('phi', 'φ', 'mm', 6, 40, 2)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {slider('d1', 'd1', 'mm', 20, 200, 5)}
          {slider('d2', 'd2', 'mm', 50, 1500, 10)}
        </div>

        {/* Materials */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1.0, 2.0, 0.05)}
          {slider('gs', 'γs', '-', 1.0, 1.5, 0.05)}
        </div>

        {/* Steel model */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modèle acier</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('k_steel', 'k', '-', 1.0, 1.2, 0.01)}
          {slider('euk', 'εuk', '%', 1.0, 10.0, 0.1)}
        </div>

        {/* Concrete model */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modèle béton</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('ec2', 'εc2', '%', 1.0, 5.0, 0.1)}
          {slider('n_parabola', 'n', '-', 1.0, 3.0, 0.1)}
        </div>

        {slider('n_points', 'Points', '-', 10, 100, 5)}

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
        </>
      }
      sketch={
        <>
<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
  <SectionCanvas title="Section + lits d'armatures" vbW={600} vbH={340}>
    {(() => {
      const k = Math.min(300 / inp.bx, 220 / inp.by);
      const ox = 220; const oy = 50;
      const W = inp.bx * k; const H = inp.by * k;
      const rows = Math.max(1, Math.round(inp.n_layers));
      const perRow = Math.max(1, Math.round(inp.bars_per_layer));
      const bars: { x: number; y: number; phi: number }[] = [];
      for (let r = 0; r < rows; r++) {
        const y = rows === 1 ? oy + H / 2 : oy + inp.d1 * k + (r / (rows - 1)) * ((inp.d2 - inp.d1) * k);
        for (let i = 0; i < perRow; i++) {
          const x = perRow === 1 ? ox + W / 2 : ox + 14 + (i / (perRow - 1)) * (W - 28);
          bars.push({ x, y, phi: inp.phi });
        }
      }
      return (
        <g>
          <rect x={ox} y={oy} width={W} height={H} fill="#60a5fa" opacity={0.2} stroke="#3b82f6" strokeWidth={1.2} />
          <RebarGroup bars={bars} pxPerMm={k} />
          <DimensionLine x1={ox} y1={oy + H} x2={ox + W} y2={oy + H} offset={26} text={`bx = ${inp.bx}`} />
          <DimensionLine x1={ox} y1={oy} x2={ox} y2={oy + H} offset={-30} text={`by = ${inp.by}`} />
          {res && (
            <text x={ox + W / 2} y={oy + H + 44} textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight="bold">
              Nmax={res.n_max.toFixed(0)} kN
            </text>
          )}
        </g>
      );
    })()}
  </SectionCanvas>
</div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme d'interaction N-M</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="m"
                  type="number"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'M (kNm)', position: 'bottom', fontSize: 11 }}
                />
                <YAxis
                  dataKey="n"
                  type="number"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'N (kN)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val.toFixed(1)} ${name === 'n' ? 'kN' : 'kNm'}`,
                    name === 'n' ? 'N' : 'M',
                  ]}
                />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Line
                  type="monotone"
                  dataKey="n"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="n"
                />
                <Line
                  type="monotone"
                  dataKey="m"
                  stroke="#dc2626"
                  strokeWidth={1.5}
                  dot={false}
                  name="m"
                  yAxisId={0}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>

        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <h2 className="text-sm font-bold mb-2">Résultats</h2>
            <div className="font-mono text-xs space-y-1">
              <div>Nmax = <b>{res.n_max.toFixed(0)}</b> kN</div>
              <div>Nbal = <b>{res.n_bal.toFixed(0)}</b> kN | Mbal = <b>{res.m_bal.toFixed(1)}</b> kNm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          </div>
        )}
              <FormulaCard
                title="Comparaison poteau M-N"
                latex={String.raw`N_{Rd} = \int_{A_c} \sigma_c \, dA + \sum A_{si} \, \sigma_{si}`}
                description="Courbe d'interaction balayée"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N_{Ed}`, meaning: 'Effort normal', value: res.n_max.toFixed(0) },
                    { symbol: String.raw`M_{Ed}`, meaning: 'Moment', value: res.n_bal.toFixed(0) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing…</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className="text-slate-500">
              • Section: {inp.bx}×{inp.by}mm
            </li>
            <li className="text-slate-500">
              • Armatures: {inp.n_layers} couches × {inp.bars_per_layer} φ{inp.phi}
            </li>
            <li className="text-slate-500">
              • As = {((inp.n_layers * inp.bars_per_layer * Math.PI * (inp.phi / 1000) ** 2 / 4) * 1e6).toFixed(0)} mm²
            </li>
            <li className="text-slate-500">
              • ρ = {(((inp.n_layers * inp.bars_per_layer * Math.PI * (inp.phi / 1000) ** 2 / 4) * 1e6) / (inp.bx * inp.by) * 100).toFixed(2)}%
            </li>
            <li className="text-green-600">
              • Nmax = {res.n_max.toFixed(0)} kN
            </li>
            <li className="text-green-600">
              • Point d'équilibre: N={res.n_bal.toFixed(0)} kN, M={res.m_bal.toFixed(1)} kNm
            </li>
          </ul>
        )}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
