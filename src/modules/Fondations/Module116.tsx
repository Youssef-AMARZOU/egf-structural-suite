import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { InteracPieuInputs, InteracPieuOutput } from '../../types/engineering';
import NumField from '../../components/NumField';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DEFAULT: InteracPieuInputs = {
  gb: 0.8, nac: 8, phi: 20, enr: 50,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, euk: 0.02, k_steel: 1.08,
  ec1: 1.75, ec2: 2.0, ecu2: 3.5, nx: 2.0,
  rho_min: 0.002, rho_max: 0.02, n_rho: 5, n_pts: 30,
};

export default function Module116() {
  const [inp, setInp] = useState<InteracPieuInputs>(DEFAULT);
  const [res, setRes] = useState<InteracPieuOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof InteracPieuInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<InteracPieuOutput>('calculate_interac_pieu_116', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const chartData = res ? res.n_values.map((n, i) => ({
    N: n,
    M: res.m_pos[i] ?? 0,
  })) : [];

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">116 Interac. Pieu <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="GD" unit="m" value={inp.gb} onChange={S('gb')} min={0.2} max={3} step={0.05} />
          <NumField label="nac" unit="-" value={inp.nac} onChange={S('nac')} min={4} max={60} step={2} />
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="enr" unit="mm" value={inp.enr} onChange={S('enr')} min={10} max={100} step={5} />
          <NumField label="k" unit="-" value={inp.k_steel} onChange={S('k_steel')} min={1.0} max={1.15} step={0.01} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme N-M</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="M" label={{ value: 'M (MNm)', position: 'bottom', fontSize: 10 }} />
              <YAxis dataKey="N" label={{ value: 'N (MN)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="N" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {res && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <div className="font-mono text-xs space-y-1">
              <div>N_max = <b>{res.n_max.toFixed(2)}</b> MN</div>
              <div>As_min = <b>{(res.a_min * 10000).toFixed(1)}</b> cm²</div>
              <div>As_max = <b>{(res.a_max * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          </div>
        )}
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className="text-green-600">✓ Diagramme N-M calculé</li>
            <li className="text-slate-500">• {res.n_values.length} points sur la courbe</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
