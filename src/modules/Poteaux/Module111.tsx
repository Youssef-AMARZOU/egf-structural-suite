import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { PoteauComparInputs, PoteauComparOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

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
  const [res, setRes] = useState<PoteauComparOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const S = (k: keyof PoteauComparInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<PoteauComparOutput>('calculate_poteau_compar_111', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const chartData = res
    ? res.n_values.map((n, i) => ({
        n,
        m: res.m_pos[i],
      }))
    : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Input Panel ─── */}
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">
            111 Poteau Compar <span className="font-mono text-[11px] text-emerald-500">RUST</span>
          </h2>
          <p className="text-[11px] text-slate-500">Interaction N-M — EC2 / BAEL</p>
        </div>

        {/* Geometry */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="bx" unit="mm" value={inp.bx} onChange={S('bx')} min={100} max={2000} step={50} />
          <NumField label="by" unit="mm" value={inp.by} onChange={S('by')} min={100} max={2000} step={50} />
        </div>

        {/* Reinforcement */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="Couches" unit="-" value={inp.n_layers} onChange={S('n_layers')} min={1} max={6} step={1} />
          <NumField label="Bar/couche" unit="-" value={inp.bars_per_layer} onChange={S('bars_per_layer')} min={1} max={12} step={1} />
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="d1" unit="mm" value={inp.d1} onChange={S('d1')} min={20} max={200} step={5} />
          <NumField label="d2" unit="mm" value={inp.d2} onChange={S('d2')} min={50} max={1500} step={10} />
        </div>

        {/* Materials */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1.0} max={2.0} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1.0} max={1.5} step={0.05} />
        </div>

        {/* Steel model */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modèle acier</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="k" unit="-" value={inp.k_steel} onChange={S('k_steel')} min={1.0} max={1.2} step={0.01} />
          <NumField label="εuk" unit="%" value={inp.euk} onChange={S('euk')} min={1.0} max={10.0} step={0.1} />
        </div>

        {/* Concrete model */}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modèle béton</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="εc2" unit="%" value={inp.ec2} onChange={S('ec2')} min={1.0} max={5.0} step={0.1} />
          <NumField label="n" unit="-" value={inp.n_parabola} onChange={S('n_parabola')} min={1.0} max={3.0} step={0.1} />
        </div>

        <NumField label="Points" unit="-" value={inp.n_points} onChange={S('n_points')} min={10} max={100} step={5} />

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
      </div>

      {/* ─── M-N Chart ─── */}
      <div className="col-span-5 space-y-4">
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

        {/* Results summary */}
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
      </div>

      {/* ─── AI Diagnostics ─── */}
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
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
      </div>
    </div>
  );
}
