import { useState } from 'react';
import type { NavierInputs, NavierOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, AxisTicks, InlineLegend } from '../../components/drafting';

const DEFAULT: NavierInputs = {
  h: 200, e: 30000, nu: 0.2,
  la: 6.0, lb: 5.0,
  q: 5.0, a1: 1.0, a2: 3.0, b1: 1.0, b2: 4.0,
  x: 3.0, y: 2.5, n_terms: 20,
};

export default function Module108() {
  const [inp, setInp] = useState<NavierInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<NavierInputs, NavierOutput>(
    'calculate_navier_108', inp,
  );
  const S = (k: keyof NavierInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof NavierInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const h_m = inp.h / 1000.0;
  const d_rig = inp.e * h_m ** 3 / 12.0 / (1.0 - inp.nu ** 2);

  return (
    <Workstation
      title="108 Navier"
      subtitle="Série de Navier — dalle rectangulaire articulée"
      category="Dalles"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Dalle</div>
          {slider('h', 'h', 'mm', 80, 800, 10)}
          {slider('e', 'E', 'MPa', 5000, 50000, 1000)}
          {slider('nu', 'ν', '-', 0, 0.5, 0.01)}
          <div className="grid grid-cols-2 gap-2">
            {slider('la', 'La', 'm', 1, 30, 0.5)}
            {slider('lb', 'Lb', 'm', 1, 30, 0.5)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Charge surfacique</div>
          {slider('q', 'q', 'kPa', 0, 100, 0.5)}
          <div className="grid grid-cols-2 gap-2">
            {slider('a1', 'x₁', 'm', 0, 30, 0.1)}
            {slider('a2', 'x₂', 'm', 0, 30, 0.1)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {slider('b1', 'y₁', 'm', 0, 30, 0.1)}
            {slider('b2', 'y₂', 'm', 0, 30, 0.1)}
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Point d'évaluation</div>
          <div className="grid grid-cols-3 gap-2">
            {slider('x', 'x', 'm', 0, 30, 0.1)}
            {slider('y', 'y', 'm', 0, 30, 0.1)}
            {slider('n_terms', 'Termes', '-', 5, 50, 1)}
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Plan de dalle" vbW={500} vbH={420}>
            {(() => {
              const sc = Math.min(400 / inp.la, 350 / inp.lb);
              const ox = 50, oy = 30;
              const w = inp.la * sc, h = inp.lb * sc;

              const loadVisible = inp.a2 > inp.a1 && inp.b2 > inp.b1;
              const lx = loadVisible ? ox + inp.a1 * sc : 0;
              const ly = loadVisible ? oy + inp.b1 * sc : 0;
              const lw = loadVisible ? (inp.a2 - inp.a1) * sc : 0;
              const lh = loadVisible ? (inp.b2 - inp.b1) * sc : 0;

              const px = ox + inp.x * sc;
              const py = oy + inp.y * sc;

              const xVals = Array.from({ length: Math.floor(inp.la) + 1 }, (_, i) => i);
              const yVals = Array.from({ length: Math.floor(inp.lb) + 1 }, (_, i) => i);

              return (
                <g>
                  {/* Slab outline */}
                  <rect x={ox} y={oy} width={w} height={h} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.5} />

                  {/* Hinge symbols (triangles) at 4 edges */}
                  {[0, 1, 2, 3].map(i => {
                    const positions = [
                      [ox + w / 2, oy - 6],
                      [ox + w / 2, oy + h + 6],
                      [ox - 6, oy + h / 2],
                      [ox + w + 6, oy + h / 2],
                    ];
                    const [cx, cy] = positions[i];
                    const rot = i < 2 ? 0 : 90;
                    return (
                      <g key={`h${i}`} transform={`translate(${cx},${cy}) rotate(${rot})`}>
                        <polygon points="-5,4 5,4 0,-4" fill="none" stroke="#94a3b8" strokeWidth={0.8} />
                        <line x1={-7} y1={5} x2={7} y2={5} stroke="#94a3b8" strokeWidth={0.8} />
                      </g>
                    );
                  })}

                  {/* Load area */}
                  {loadVisible && (
                    <g>
                      <rect x={lx} y={ly} width={lw} height={lh} fill="#dc2626" opacity={0.15} stroke="#dc2626" strokeWidth={1} strokeDasharray="4 2" />
                      <text x={lx + lw / 2} y={ly + lh / 2} fontSize={9} fill="#dc2626" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
                        q = {inp.q} kPa
                      </text>
                    </g>
                  )}

                  {/* Evaluation point */}
                  <circle cx={px} cy={py} r={5} fill="#2563eb" stroke="#fff" strokeWidth={1.5} />
                  <text x={px + 8} y={py - 6} fontSize={8} fill="#2563eb" fontWeight="600">
                    ({inp.x}, {inp.y})
                  </text>

                  {/* Axes */}
                  <AxisTicks
                    origin={[ox, oy + h + 18]}
                    end={[ox + w, oy + h + 18]}
                    values={xVals}
                    map={(v) => [ox + v * sc, oy + h + 18]}
                    unit="m"
                    side="below"
                    decimals={0}
                  />
                  <AxisTicks
                    origin={[ox - 18, oy]}
                    end={[ox - 18, oy + h]}
                    values={yVals}
                    map={(v) => [ox - 18, oy + v * sc]}
                    unit="m"
                    side="left"
                    decimals={0}
                  />

                  {/* Dimension labels */}
                  <text x={ox + w / 2} y={oy - 10} fontSize={9} fill="#64748b" textAnchor="middle">La = {inp.la} m</text>
                  <text x={ox - 30} y={oy + h / 2} fontSize={9} fill="#64748b" textAnchor="middle" transform={`rotate(-90 ${ox - 30} ${oy + h / 2})`}>Lb = {inp.lb} m</text>

                  <InlineLegend
                    items={[
                      { label: 'Charge q', color: '#dc2626' },
                      { label: 'Point (x,y)', color: '#2563eb' },
                    ]}
                    x={ox + w - 120}
                    y={oy + 8}
                  />
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Mx', `${res.mx.toFixed(2)} kN·m/m`],
                  ['My', `${res.my.toFixed(2)} kN·m/m`],
                  ['Mxy', `${res.mxy.toFixed(2)} kN·m/m`],
                  ['w', `${res.w.toFixed(2)} mm`],
                  ['D', `${res.d_rig.toFixed(1)} kN·m`],
                  ['M_max', `${res.m_max.toFixed(2)} kN·m/m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>

              <FormulaCard
                title="Navier — Double série sinus"
                latex={String.raw`w(x,y) = \sum_{m=1}^{\infty}\sum_{n=1}^{\infty} b_{mn} \sin\frac{m\pi x}{a}\sin\frac{n\pi y}{b}`}
                description="Dalle articulée sur 4 appuis, charge surfacique rectangulaire"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`D`, meaning: 'Rigidité de flexion', value: res.d_rig.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`M_x`, meaning: 'Moment flexion x', value: res.mx.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`M_y`, meaning: 'Moment flexion y', value: res.my.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`M_{xy}`, meaning: 'Moment de torsion', value: res.mxy.toFixed(2), unit: 'kN·m/m' },
                  { symbol: String.raw`w`, meaning: 'Flèche', value: res.w.toFixed(2), unit: 'mm' },
                ]}
              />

              <div className={`p-2 rounded text-xs font-semibold ${res.w < inp.h / 1000.0 * 500 ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {res.verdict}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 text-xs">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Paramètres de rigidité</div>
                <div className="font-mono space-y-0.5">
                  <div>D = Eh³ / 12(1−ν²) = {res.d_rig.toFixed(1)} kN·m</div>
                  <div>h = {inp.h} mm, E = {inp.e} MPa, ν = {inp.nu}</div>
                </div>
              </div>

              <ul className="text-xs space-y-1">
                <li className="font-mono text-slate-600 dark:text-slate-400">Flèche admissible : L/500 = {(inp.la * 1000 / 500).toFixed(1)} mm</li>
                <li className="font-mono text-slate-600 dark:text-slate-400">Flèche calculée : {res.w.toFixed(2)} mm</li>
                <li className={res.w < inp.h / 1000.0 * 500 ? 'text-green-600' : 'text-red-600'}>
                  {res.w < inp.h / 1000.0 * 500 ? '✓ Flèche acceptable (w < h/2)' : '✗ Flèche excessive (w ≥ h/2)'}
                </li>
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
