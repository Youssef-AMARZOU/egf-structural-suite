import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { Slab107Inputs, Slab107Output } from '../../types/engineering';
import NumField from '../../components/NumField';

interface Load {
  q: number;
  x: number;
  y: number;
}

interface Layer {
  h_s: number;
  nu: number;
  es: number;
}

const DEF: Slab107Inputs = {
  h: 0.25,
  fc28: 30,
  nub: 0.2,
  phi: 2.0,
  layers: [
    { h_s: 1.0, nu: 0.3, es: 20 },
    { h_s: 2.0, nu: 0.35, es: 40 },
    { h_s: 3.0, nu: 0.4, es: 80 },
  ],
  loads: [
    { q: 100, x: 0, y: 0 },
    { q: 50, x: 2, y: 0 },
  ],
  x0: 0,
  y0: 0,
};

export default function Module107() {
  const [inp, setInp] = useState<Slab107Inputs>(DEF);
  const [res, setRes] = useState<Slab107Output | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof Slab107Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

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
      layers: [...p.layers, { h_s: 1.0, nu: 0.3, es: 30 }],
    }));
  };

  const removeLayer = (i: number) => {
    setInp((p) => ({
      ...p,
      layers: p.layers.filter((_, idx) => idx !== i),
    }));
  };

  const updateLoad = (i: number, field: keyof Load, val: number) => {
    setInp((p) => {
      const loads = [...p.loads];
      loads[i] = { ...loads[i], [field]: val };
      return { ...p, loads };
    });
  };

  const addLoad = () => {
    setInp((p) => ({
      ...p,
      loads: [...p.loads, { q: 50, x: 1, y: 1 }],
    }));
  };

  const removeLoad = (i: number) => {
    setInp((p) => ({
      ...p,
      loads: p.loads.filter((_, idx) => idx !== i),
    }));
  };

  useEffect(() => {
    let dead = false;
    invoke<Slab107Output>('calculate_slab_107', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const bars = res
    ? [
        { n: 'Settlement (mm)', v: res.settlement * 1000 },
        { n: 'σ_max (MPa)', v: Math.abs(res.sig_max) },
        { n: 'σ_min (MPa)', v: Math.abs(res.sig_min) },
      ]
    : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            107 Dalle DTU 13.3{' '}
            <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            D'après EGF N°107 © Henry Thonier — DTU 13.3
          </p>
        </div>

        {/* Slab geometry */}
        <div className="grid grid-cols-2 gap-2">
          <NumField label="H dalle" unit="m" value={inp.h} onChange={S('h')} min={0.1} max={1} step={0.01} />
          <NumField label="fc28" unit="MPa" value={inp.fc28} onChange={S('fc28')} min={20} max={60} step={1} />
          <NumField label="ν béton" unit="–" value={inp.nub} onChange={S('nub')} min={0.1} max={0.3} step={0.01} />
          <NumField label="φ fluage" unit="–" value={inp.phi} onChange={S('phi')} min={0} max={4} step={0.5} />
        </div>

        {/* Target point */}
        <div className="grid grid-cols-2 gap-2">
          <NumField label="x₀" unit="m" value={inp.x0} onChange={S('x0')} min={-50} max={50} step={0.5} />
          <NumField label="y₀" unit="m" value={inp.y0} onChange={S('y0')} min={-50} max={50} step={0.5} />
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
                <div className="grid grid-cols-3 gap-1">
                  <NumField label="H" unit="m" value={layer.h_s} onChange={(v) => updateLayer(i, 'h_s', v)} min={0.1} max={20} step={0.5} />
                  <NumField label="ν" unit="–" value={layer.nu} onChange={(v) => updateLayer(i, 'nu', v)} min={0.1} max={0.5} step={0.05} />
                  <NumField label="Es" unit="MPa" value={layer.es} onChange={(v) => updateLayer(i, 'es', v)} min={5} max={500} step={5} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loads */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Charges</span>
            <button onClick={addLoad} className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700">+ Charge</button>
          </div>
          <div className="space-y-2">
            {inp.loads.map((load, i) => (
              <div key={i} className="relative rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-1">
                <button onClick={() => removeLoad(i)}
                  className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600">✕</button>
                <div className="text-[10px] text-slate-400 font-mono">Q{i + 1}</div>
                <div className="grid grid-cols-3 gap-1">
                  <NumField label="Q" unit="kN" value={load.q} onChange={(v) => updateLoad(i, 'q', v)} min={0} max={1000} step={10} />
                  <NumField label="x" unit="m" value={load.x} onChange={(v) => updateLoad(i, 'x', v)} min={-50} max={50} step={0.5} />
                  <NumField label="y" unit="m" value={load.y} onChange={(v) => updateLoad(i, 'y', v)} min={-50} max={50} step={0.5} />
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
        {/* Bar chart */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="n" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="v">
                  {bars.map((b, i) => (
                    <Cell key={i} fill={i === 0 ? '#2563eb' : i === 1 ? '#16a34a' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {res && (
            <div className="mt-3 font-mono text-xs space-y-1">
              <div>
                Deq={res.deq.toFixed(3)}m · k={res.kdeq.toFixed(1)} kN/m³
              </div>
              <div>
                w={res.settlement.toFixed(4)}m ({(res.settlement * 1000).toFixed(2)}mm)
              </div>
              <div>
                M_ELS={res.m_els.toFixed(2)} kNm/m · As={res.as_req.toFixed(1)} cm²/m
              </div>
              <div>
                σ_max={res.sig_max.toFixed(4)} MPa · σ_min={res.sig_min.toFixed(4)} MPa
              </div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        {/* Settlement profile SVG */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Profil de tassement (live SVG)</h2>
          <svg viewBox="0 0 400 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const ox = 40, oy = 30, w = 340, h = 140;
              const sc = 5000; // mm scale

              // Generate settlement profile across slab
              const profile: { x: number; y: number }[] = [];
              const nPts = 40;
              for (let i = 0; i <= nPts; i++) {
                const frac = i / nPts;
                const x = ox + frac * w;
                // Approximate settlement shape (peaked at center, decreasing outward)
                const center_dist = Math.abs(frac - 0.5) * 2;
                const shape = Math.exp(-center_dist * 3);
                const settlement_mm = res ? res.settlement * 1000 * shape : 0;
                const y = oy + settlement_mm * sc;
                profile.push({ x, y });
              }

              const pathD = profile.map((p, i) =>
                i === 0 ? `M ${p.x} ${oy}` : `L ${p.x} ${p.y}`
              ).join(' ') + ` L ${ox + w} ${oy} Z`;

              return (
                <g>
                  {/* Original ground line */}
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
                  <text x={ox - 5} y={oy + 4} textAnchor="end" fontSize={8} fill="#94a3b8">0</text>

                  {/* Settlement area */}
                  <path d={pathD} fill="#2563eb" opacity={0.15} />

                  {/* Settlement curve */}
                  <polyline
                    points={profile.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#2563eb" strokeWidth={2}
                  />

                  {/* Load positions */}
                  {inp.loads.map((load, i) => {
                    const frac = (load.x - inp.x0 + 5) / 10; // normalize to [0,1]
                    const px = ox + Math.max(0, Math.min(1, frac)) * w;
                    return (
                      <g key={i}>
                        <line x1={px} y1={oy - 15} x2={px} y2={oy} stroke="#dc2626" strokeWidth={2} />
                        <text x={px} y={oy - 18} textAnchor="middle" fontSize={7} fill="#dc2626">
                          {load.q}kN
                        </text>
                      </g>
                    );
                  })}

                  {/* Scale label */}
                  <text x={ox - 5} y={oy + (res ? res.settlement * 1000 * sc : 50) + 4}
                    textAnchor="end" fontSize={7} fill="#2563eb">
                    {res ? `${(res.settlement * 1000).toFixed(1)}mm` : ''}
                  </text>

                  {/* Labels */}
                  <text x={ox + w / 2} y={oy + h + 15} textAnchor="middle" fontSize={8} fill="#64748b">
                    Distance (m)
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
            <li className={res.settlement <= 0.02 ? 'text-green-600' : 'text-red-600'}>
              {res.settlement <= 0.02
                ? `✓ Tassement acceptable: ${(res.settlement * 1000).toFixed(2)}mm ≤ 20mm.`
                : `✗ Tassement excessif: ${(res.settlement * 1000).toFixed(2)}mm > 20mm.`}
            </li>
            <li className={res.m_els > 0 && res.as_req > 0 ? 'text-amber-500' : 'text-green-600'}>
              {res.m_els > 0 && res.as_req > 0
                ? `• Armature nécessaire: As=${res.as_req.toFixed(1)} cm²/m (M_ELS=${res.m_els.toFixed(2)} kNm/m).`
                : '✓ Pas d\'armature requise pour ce chargement.'}
            </li>
            <li className="text-slate-500">
              • Diamètre d'impact: Deq={res.deq.toFixed(3)}m
            </li>
            <li className="text-slate-500">
              • Module de réaction: k={res.kdeq.toFixed(1)} kN/m³
            </li>
            <li className="text-slate-500">
              • Profondeur utile: d={res.d_eff.toFixed(3)}m
            </li>
            <li className="text-slate-500">
              • σ_max={res.sig_max.toFixed(4)} MPa · σ_min={res.sig_min.toFixed(4)} MPa
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
