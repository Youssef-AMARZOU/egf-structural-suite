import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type {
  Settlement124Inputs,
  Settlement124Output,
} from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

interface Footing {
  b: number;
  l: number;
  q: number;
  cx: number;
  cy: number;
  zs: number;
}

interface Layer {
  h: number;
  es: number;
}

const DEF_FOOTINGS: Footing[] = [
  { b: 2.0, l: 3.0, q: 150, cx: 0, cy: 0, zs: 1.0 },
  { b: 1.5, l: 2.0, q: 120, cx: 4, cy: 0, zs: 1.0 },
];

const DEF_LAYERS: Layer[] = [
  { h: 2.0, es: 15 },
  { h: 3.0, es: 30 },
  { h: 5.0, es: 60 },
];

const DEF: Settlement124Inputs = {
  footings: DEF_FOOTINGS,
  layers: DEF_LAYERS,
  x: 0,
  y: 0,
  ze: 5.0,
};


export default function Module124() {
  const [inp, setInp] = useState<Settlement124Inputs>(DEF);
  const { data: res, error: err, live } = useModuleCalc<Settlement124Inputs, Settlement124Output>(
    'calculate_settlement_124', inp,
  );

  const S = (k: keyof Settlement124Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const updateFooting = (i: number, field: keyof Footing, val: number) => {
    setInp((p) => {
      const footings = [...p.footings];
      footings[i] = { ...footings[i], [field]: val };
      return { ...p, footings };
    });
  };

  const addFooting = () => {
    setInp((p) => ({
      ...p,
      footings: [...p.footings, { b: 2.0, l: 2.0, q: 100, cx: 0, cy: 0, zs: 1.0 }],
    }));
  };

  const removeFooting = (i: number) => {
    setInp((p) => ({
      ...p,
      footings: p.footings.filter((_, idx) => idx !== i),
    }));
  };

  const updateLayer = (i: number, field: keyof Layer, val: number) => {
    setInp((p) => {
      const layers = [...p.layers];
      layers[i] = { ...layers[i], [field]: val };
      return { ...p, layers };
    });
  };

  const addLayer = () => {
    setInp((p) => ({
      ...p,
      layers: [...p.layers, { h: 2.0, es: 25 }],
    }));
  };

  const removeLayer = (i: number) => {
    setInp((p) => ({
      ...p,
      layers: p.layers.filter((_, idx) => idx !== i),
    }));
  };


  const footingBars = res
    ? res.per_footing_mm.map((v, i) => ({ n: `S${i + 1}`, v }))
    : [];

  const layerBars = res
    ? res.per_layer_mm.map((v, i) => ({ n: `Couche ${i + 1}`, v }))
    : [];

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Settlement124Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="124 Tassements sous semelles"
      subtitle="D'après EGF N°124 © Henry Thonier — Boussinesq"
      status={status}
      live={live}
      params={
        <>

        {/* Evaluation point */}
        <div className="grid grid-cols-3 gap-2">
          {slider('x', 'x₀', 'm', -50, 50, 0.5)}
          {slider('y', 'y₀', 'm', -50, 50, 0.5)}
          {slider('ze', 'ze', 'm', 0, 50, 0.5)}
        </div>

        {/* Footings */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Semelles</span>
            <button onClick={addFooting} className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700">+ Semelle</button>
          </div>
          <div className="space-y-2">
            {inp.footings.map((f, i) => (
              <div key={i} className="relative rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-1">
                <button onClick={() => removeFooting(i)}
                  className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600">✕</button>
                <div className="text-[10px] text-slate-400 font-mono">Semelle {i + 1}</div>
                <div className="grid grid-cols-3 gap-1">
                  <ParamSlider label="B" unit="m" value={f.b} min={0.3} max={10} step={0.1} onChange={(v) => updateFooting(i, 'b', v)} />
                  <ParamSlider label="L" unit="m" value={f.l} min={0.3} max={10} step={0.1} onChange={(v) => updateFooting(i, 'l', v)} />
                  <ParamSlider label="q" unit="kPa" value={f.q} min={10} max={500} step={10} onChange={(v) => updateFooting(i, 'q', v)} />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <ParamSlider label="cx" unit="m" value={f.cx} min={-50} max={50} step={0.5} onChange={(v) => updateFooting(i, 'cx', v)} />
                  <ParamSlider label="cy" unit="m" value={f.cy} min={-50} max={50} step={0.5} onChange={(v) => updateFooting(i, 'cy', v)} />
                  <ParamSlider label="zs" unit="m" value={f.zs} min={0} max={20} step={0.1} onChange={(v) => updateFooting(i, 'zs', v)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soil layers */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Couches de sol</span>
            <button onClick={addLayer} className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700">+ Couche</button>
          </div>
          <div className="space-y-2">
            {inp.layers.map((layer, i) => (
              <div key={i} className="relative rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-1">
                <button onClick={() => removeLayer(i)}
                  className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600">✕</button>
                <div className="text-[10px] text-slate-400 font-mono">Couche {i + 1}</div>
                <div className="grid grid-cols-2 gap-1">
                  <ParamSlider label="H" unit="m" value={layer.h} min={0.1} max={30} step={0.5} onChange={(v) => updateLayer(i, 'h', v)} />
                  <ParamSlider label="Es" unit="MPa" value={layer.es} min={5} max={500} step={5} onChange={(v) => updateLayer(i, 'es', v)} />
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <h2 className="text-sm font-bold mb-2">Tassement par semelle (mm)</h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={footingBars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="n" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="v" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Contribution par couche (mm)</h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={layerBars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="n" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="v">
                  {layerBars.map((b, i) => (
                    <Cell key={i} fill={b.v >= 0 ? '#f59e0b' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Plan (live SVG)" vbW={400} vbH={250}>
            {(() => {
              const sc = 30; // scale px/m
              const ox = 200, oy = 125;

              return (
                <g>
                  <line x1={0} y1={oy} x2={400} y2={oy} stroke="#e2e8f0" strokeWidth={0.5} />
                  <line x1={ox} y1={0} x2={ox} y2={250} stroke="#e2e8f0" strokeWidth={0.5} />

                  {inp.footings.map((f, i) => {
                    const fx = ox + f.cx * sc - (f.b * sc) / 2;
                    const fy = oy + f.cy * sc - (f.l * sc) / 2;
                    const fw = f.b * sc;
                    const fh = f.l * sc;
                    const settlement = res?.per_footing_mm[i] ?? 0;
                    const opacity = Math.min(0.9, 0.2 + settlement / 10);

                    return (
                      <g key={i}>
                        <rect x={fx} y={fy} width={fw} height={fh}
                          fill="#2563eb" opacity={opacity}
                          stroke="#1e40af" strokeWidth={1.5} rx={2} />
                        <text x={fx + fw / 2} y={fy + fh / 2 - 4}
                          textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                          {f.b.toFixed(1)}×{f.l.toFixed(1)}
                        </text>
                        <text x={fx + fw / 2} y={fy + fh / 2 + 8}
                          textAnchor="middle" fontSize={7} fill="#fff">
                          {f.q}kPa
                        </text>
                        <text x={fx + fw / 2} y={fy - 4}
                          textAnchor="middle" fontSize={7} fill="#2563eb">
                          {settlement.toFixed(1)}mm
                        </text>
                      </g>
                    );
                  })}

                  <circle cx={ox + inp.x * sc} cy={oy + inp.y * sc} r={4}
                    fill="#dc2626" stroke="#fff" strokeWidth={1.5} />
                  <text x={ox + inp.x * sc + 8} y={oy + inp.y * sc + 4}
                    fontSize={8} fill="#dc2626" fontWeight="bold">P₀</text>

                  <text x={10} y={240} fontSize={8} fill="#64748b">
                    • = point d'évaluation | 🔴 = P₀
                  </text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>


        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <h2 className="text-sm font-bold mb-2">Synthèse</h2>
            <div className="font-mono text-xs space-y-1">
              <div>
                Tassement total: <b>{res.settlement_mm.toFixed(2)} mm</b>
              </div>
              <div>
                Tassement différentiel: <b>{res.differential_mm.toFixed(2)} mm</b>
              </div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          </div>
        )}

              <FormulaCard
                title="Tassement oedométrique"
                latex={String.raw`s = \sum_i \frac{\Delta\sigma_{zi} \, h_i}{E_{oed,i}}`}
                description="Sous semelles superficielles"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`\Delta\sigma_z`, meaning: 'Surcontrainte', value: res.settlement_mm.toFixed(2) },
                    { symbol: String.raw`E_{oed}`, meaning: 'Module oedométrique', value: res.differential_mm.toFixed(2) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {!res ? (
          <p className="text-xs text-slate-500">computing…</p>
        ) : (
          <ul className="text-xs space-y-2">
            <li className={res.settlement_mm <= 30 ? 'text-green-600' : 'text-red-600'}>
              {res.settlement_mm <= 30
                ? `✓ Tassement acceptable: ${res.settlement_mm.toFixed(2)}mm ≤ 30mm.`
                : `✗ Tassement excessif: ${res.settlement_mm.toFixed(2)}mm > 30mm.`}
            </li>
            <li className={res.differential_mm <= 10 ? 'text-green-600' : 'text-amber-500'}>
              {res.differential_mm <= 10
                ? `✓ Tassement différentiel: ${res.differential_mm.toFixed(2)}mm ≤ 10mm.`
                : `• Tassement différentiel important: ${res.differential_mm.toFixed(2)}mm > 10mm.`}
            </li>
            {res.per_footing_mm.map((v, i) => (
              <li key={i} className="text-slate-500">
                • Semelle {i + 1}: {v.toFixed(2)}mm ({inp.footings[i].b}×{inp.footings[i].l}m, {inp.footings[i].q}kPa)
              </li>
            ))}
            {res.per_layer_mm.map((v, i) => (
              <li key={i} className="text-slate-500">
                • Couche {i + 1}: {v.toFixed(2)}mm (H={inp.layers[i].h}m, Es={inp.layers[i].es}MPa)
              </li>
            ))}
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
