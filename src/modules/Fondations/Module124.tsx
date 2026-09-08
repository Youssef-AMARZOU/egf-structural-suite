import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type {
  Settlement124Inputs,
  Settlement124Output,
} from '../../types/engineering';
import NumField from '../../components/NumField';

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
  const [res, setRes] = useState<Settlement124Output | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  useEffect(() => {
    let dead = false;
    invoke<Settlement124Output>('calculate_settlement_124', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const footingBars = res
    ? res.per_footing_mm.map((v, i) => ({ n: `S${i + 1}`, v }))
    : [];

  const layerBars = res
    ? res.per_layer_mm.map((v, i) => ({ n: `Couche ${i + 1}`, v }))
    : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            124 Tassements sous semelles{' '}
            <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'après EGF N°124 © Henry Thonier — Boussinesq
          </p>
        </div>

        {/* Evaluation point */}
        <div className="grid grid-cols-3 gap-2">
          <NumField label="x₀" unit="m" value={inp.x} onChange={S('x')} min={-50} max={50} step={0.5} />
          <NumField label="y₀" unit="m" value={inp.y} onChange={S('y')} min={-50} max={50} step={0.5} />
          <NumField label="ze" unit="m" value={inp.ze} onChange={S('ze')} min={0} max={50} step={0.5} />
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
                  <NumField label="B" unit="m" value={f.b} onChange={(v) => updateFooting(i, 'b', v)} min={0.3} max={10} step={0.1} />
                  <NumField label="L" unit="m" value={f.l} onChange={(v) => updateFooting(i, 'l', v)} min={0.3} max={10} step={0.1} />
                  <NumField label="q" unit="kPa" value={f.q} onChange={(v) => updateFooting(i, 'q', v)} min={10} max={500} step={10} />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <NumField label="cx" unit="m" value={f.cx} onChange={(v) => updateFooting(i, 'cx', v)} min={-50} max={50} step={0.5} />
                  <NumField label="cy" unit="m" value={f.cy} onChange={(v) => updateFooting(i, 'cy', v)} min={-50} max={50} step={0.5} />
                  <NumField label="zs" unit="m" value={f.zs} onChange={(v) => updateFooting(i, 'zs', v)} min={0} max={20} step={0.1} />
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
                  <NumField label="H" unit="m" value={layer.h} onChange={(v) => updateLayer(i, 'h', v)} min={0.1} max={30} step={0.5} />
                  <NumField label="Es" unit="MPa" value={layer.es} onChange={(v) => updateLayer(i, 'es', v)} min={5} max={500} step={5} />
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
      </div>

      {/* ─── Charts + Results ─── */}
      <div className="col-span-5 space-y-4">
        {/* Per-footing bar chart */}
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

        {/* Per-layer bar chart */}
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

        {/* Results summary */}
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

        {/* Plan SVG */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan (live SVG)</h2>
          <svg viewBox="0 0 400 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 30; // scale px/m
              const ox = 200, oy = 125;

              return (
                <g>
                  {/* Grid */}
                  <line x1={0} y1={oy} x2={400} y2={oy} stroke="#e2e8f0" strokeWidth={0.5} />
                  <line x1={ox} y1={0} x2={ox} y2={250} stroke="#e2e8f0" strokeWidth={0.5} />

                  {/* Footings */}
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

                  {/* Evaluation point */}
                  <circle cx={ox + inp.x * sc} cy={oy + inp.y * sc} r={4}
                    fill="#dc2626" stroke="#fff" strokeWidth={1.5} />
                  <text x={ox + inp.x * sc + 8} y={oy + inp.y * sc + 4}
                    fontSize={8} fill="#dc2626" fontWeight="bold">P₀</text>

                  {/* Legend */}
                  <text x={10} y={240} fontSize={8} fill="#64748b">
                    • = point d'évaluation | 🔴 = P₀
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* ─── AI Diagnostics ─── */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
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
      </div>
    </div>
  );
}
