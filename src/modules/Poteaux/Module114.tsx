import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ContraintesCircInputs, ContraintesCircOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: ContraintesCircInputs = {
  gd: 0.8, na: 12, phi: 20, enr: 40, deca: 0,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15, euk: 0.02, k: 1.08,
  typ: 1, ecu1: 3.5, ec1: 1.75, ec2: 2.0, ecu2: 3.5, nx: 2.0,
  ned: 3.0, med: 1.5, itour: 30,
};

export default function Module114() {
  const [inp, setInp] = useState<ContraintesCircInputs>(DEFAULT);
  const [res, setRes] = useState<ContraintesCircOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof ContraintesCircInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<ContraintesCircOutput>('calculate_contraintes_circ_114', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">114 Contraintes Circ <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="GD" unit="m" value={inp.gd} onChange={S('gd')} min={0.2} max={3} step={0.05} />
          <NumField label="na" unit="-" value={inp.na} onChange={S('na')} min={4} max={60} step={2} />
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="enr" unit="mm" value={inp.enr} onChange={S('enr')} min={10} max={100} step={5} />
          <NumField label="Deca" unit="-" value={inp.deca} onChange={S('deca')} min={0} max={1} step={1} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="k" unit="-" value={inp.k} onChange={S('k')} min={1.0} max={1.15} step={0.01} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={1.5} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Efforts</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="MN" value={inp.ned} onChange={S('ned')} min={0} max={100} step={0.5} />
          <NumField label="MEd" unit="MNm" value={inp.med} onChange={S('med')} min={0} max={50} step={0.25} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>NRd = <b>{res.nrd.toFixed(2)}</b> MN</div>
              <div>MRd = <b>{res.mrd.toFixed(2)}</b> MNm</div>
              <div>e₁ = <b>{res.e1.toFixed(3)}</b> ‰ | e₂ = <b>{res.e2.toFixed(3)}</b> ‰</div>
              <div>Kd = <b>{res.kd.toFixed(3)}</b> m | As = <b>{(res.a_steel * 10000).toFixed(1)}</b> cm²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.nrd >= inp.ned && res.mrd >= inp.med ? 'text-green-600' : 'text-red-600'}>
              {res.nrd >= inp.ned && res.mrd >= inp.med ? '✓ Section suffisante' : '✗ Section insuffisante'}
            </li>
            <li className="text-slate-500">• ρ = {(res.a_steel / (Math.PI * inp.gd * inp.gd / 4) * 100).toFixed(2)}%</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
