import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { FileOuverturesInputs, FileOuverturesOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: FileOuverturesInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  gh: 3000, h: 200, bl: 200, hl: 300,
  l: 1000, ab1: 50, h1: 300, s1: 0.1,
  i1: 0.001, ab2: 50, h2: 300, s2: 0.1,
  i2: 0.001, e: 200, ep: 200,
  p1: 100, e1: 50, p2: 100, e2: 50,
  ome: 0.5,
};

export default function Module148() {
  const [inp, setInp] = useState<FileOuverturesInputs>(DEFAULT);
  const [res, setRes] = useState<FileOuverturesOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof FileOuverturesInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<FileOuverturesOutput>('calculate_file_ouvertures_148', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">148 File Ouvertures <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Voile 2 refends — Henry Thonier 1994</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="GH" unit="mm" value={inp.gh} onChange={S('gh')} min={500} max={20000} step={100} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={50} max={500} step={10} />
          <NumField label="L" unit="mm" value={inp.l} onChange={S('l')} min={100} max={5000} step={50} />
          <NumField label="H1" unit="mm" value={inp.h1} onChange={S('h1')} min={50} max={500} step={10} />
          <NumField label="H2" unit="mm" value={inp.h2} onChange={S('h2')} min={50} max={500} step={10} />
          <NumField label="e" unit="mm" value={inp.e} onChange={S('e')} min={50} max={500} step={10} />
          <NumField label="ω" unit="-" value={inp.ome} onChange={S('ome')} min={0.01} max={2} step={0.01} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="P1" unit="kN" value={inp.p1} onChange={S('p1')} min={0} max={1000} step={10} />
          <NumField label="P2" unit="kN" value={inp.p2} onChange={S('p2')} min={0} max={1000} step={10} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>α = <b>{res.alpha.toFixed(3)}</b> | ω = {res.omega.toFixed(3)}</div>
              <div>GM_max = <b>{res.gm_max.toFixed(2)}</b> kN·m</div>
              <div>GV_max = <b>{res.gv_max.toFixed(2)}</b> kN</div>
              <div>GN_max = <b>{res.gn_max.toFixed(2)}</b> kN</div>
              <div>f_max = <b>{res.f_max.toFixed(3)}</b> mm</div>
              <div>I12 = {res.i12.toFixed(3)}</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme M-V</h2>
          <svg viewBox="0 0 500 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 20, w = 420, h = 160;
              const gmMax = Math.max(...res.gm.map(Math.abs), 0.001);

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={ox} y1={oy + h / 2} x2={ox + w} y2={oy + h / 2} stroke="#94a3b8" strokeWidth={0.5} />

                  <text x={ox - 5} y={oy + 5} textAnchor="end" fontSize={6} fill="#94a3b8">GM</text>
                  <text x={ox + w / 2} y={oy + h + 12} textAnchor="middle" fontSize={6} fill="#94a3b8">x/GH</text>

                  <polyline
                    points={res.x_ks.map((x, i) => `${ox + x * w},${oy + h / 2 - (res.gm[i] / gmMax) * (h / 2)}`).join(' ')}
                    fill="none" stroke="#2563eb" strokeWidth={1.5}
                  />
                  <polyline
                    points={res.x_ks.map((x, i) => `${ox + x * w},${oy + h / 2 - (res.gv[i] / gmMax) * (h / 2)}`).join(' ')}
                    fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,4"
                  />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <div className="space-y-2">
            {res.diag.map((d, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded ${d.startsWith('KO') ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : d.startsWith('ATTENTION') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                {d}
              </div>
            ))}
            <hr className="border-slate-200 dark:border-white/10 my-2" />
            <ul className="text-xs space-y-2">
              <li className="text-slate-500">• α = {res.alpha.toFixed(3)}</li>
              <li className="text-slate-500">• ω = {res.omega.toFixed(3)}</li>
              <li className="text-slate-500">• GM_max = {res.gm_max.toFixed(2)} kN·m</li>
              <li className="text-slate-500">• GV_max = {res.gv_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• GN_max = {res.gn_max.toFixed(2)} kN</li>
              <li className="text-slate-500">• f_max = {res.f_max.toFixed(3)} mm</li>
              <li className="text-slate-500">• I12 = {res.i12.toFixed(3)}</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
