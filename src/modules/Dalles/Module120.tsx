import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { EscalierInputs, EscalierOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: EscalierInputs = {
  l: 4.0, h_dalle: 200, g_vo: 5.0, g_si: 1.0, g_db: 0.5, q_db: 3.0,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, b1: 0.5, b2: 2.5, b3: 1.2,
  p1: 5.0, p2: 8.0, p3: 0, e_qd: 0, mg: 10, md: 15, cnom: 25,
};

export default function Module120() {
  const [inp, setInp] = useState<EscalierInputs>(DEFAULT);
  const [res, setRes] = useState<EscalierOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof EscalierInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<EscalierOutput>('calculate_escalier_120', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">120 Escalier <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="L" unit="m" value={inp.l} onChange={S('l')} min={1} max={15} step={0.5} />
          <NumField label="h" unit="mm" value={inp.h_dalle} onChange={S('h_dalle')} min={80} max={400} step={10} />
          <NumField label="b3" unit="m" value={inp.b3} onChange={S('b3')} min={0.5} max={5} step={0.1} />
          <NumField label="cnom" unit="mm" value={inp.cnom} onChange={S('cnom')} min={10} max={100} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="g_vo" unit="kPa" value={inp.g_vo} onChange={S('g_vo')} min={0} max={20} step={0.5} />
          <NumField label="g_si" unit="kPa" value={inp.g_si} onChange={S('g_si')} min={0} max={10} step={0.1} />
          <NumField label="g_db" unit="kPa" value={inp.g_db} onChange={S('g_db')} min={0} max={10} step={0.1} />
          <NumField label="q_db" unit="kPa" value={inp.q_db} onChange={S('q_db')} min={0} max={10} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charge trapèze</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="p1" unit="kN/m" value={inp.p1} onChange={S('p1')} min={0} max={50} step={0.5} />
          <NumField label="p2" unit="kN/m" value={inp.p2} onChange={S('p2')} min={0} max={50} step={0.5} />
          <NumField label="b1" unit="m" value={inp.b1} onChange={S('b1')} min={0} max={5} step={0.1} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>M_max = <b>{(res.m_max * 1000).toFixed(1)}</b> kNm</div>
              <div>μ = <b>{res.mu.toFixed(3)}</b></div>
              <div>z = <b>{res.z.toFixed(0)}</b> mm</div>
              <div>As = <b>{(res.as_req * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.mu < 0.5 ? 'text-green-600' : 'text-red-600'}>
              {res.mu < 0.5 ? '✓ Section sous-armée' : '✗ Section sur-armée'}
            </li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
