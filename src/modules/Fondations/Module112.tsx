import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { SemelAncrageInputs, SemelAncrageOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: SemelAncrageInputs = {
  a: 400, b: 400, d: 350,
  fck: 30, gc: 1.5, fyk: 500, gs: 1.15,
  c_nom: 30, phi: 16, phi_t: 8,
  exposure: 1, welded: 0, hook_angle: 0,
};

export default function Module112() {
  const [inp, setInp] = useState<SemelAncrageInputs>(DEFAULT);
  const [res, setRes] = useState<SemelAncrageOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof SemelAncrageInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<SemelAncrageOutput>('calculate_semel_ancrage_112', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold">112 Semelle Ancrage <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
          <p className="text-[11px] text-slate-500">Longueur d'ancrage — EC2</p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="a" unit="mm" value={inp.a} onChange={S('a')} min={100} max={2000} step={50} />
          <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={50} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={100} max={2000} step={10} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1.0} max={2.0} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1.0} max={1.5} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Armatures</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="φ" unit="mm" value={inp.phi} onChange={S('phi')} min={6} max={40} step={2} />
          <NumField label="φt" unit="mm" value={inp.phi_t} onChange={S('phi_t')} min={4} max={16} step={1} />
          <NumField label="cnom" unit="mm" value={inp.c_nom} onChange={S('c_nom')} min={10} max={100} step={5} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Soudé</label>
            <select value={inp.welded} onChange={(e) => setInp((p) => ({ ...p, welded: Number(e.target.value) }))}
              className="w-full text-xs rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5">
              <option value={0}>Non</option><option value={1}>Oui</option>
            </select>
          </div>
          <NumField label="θ" unit="°" value={inp.hook_angle} onChange={S('hook_angle')} min={0} max={180} step={15} />
          <NumField label="Expo" unit="-" value={inp.exposure} onChange={S('exposure')} min={0} max={6} step={1} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats ancrage</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>fbd = <b>{res.fbd.toFixed(2)}</b> MPa</div>
              <div>Lb,d0 = <b>{res.lb_d0.toFixed(0)}</b> mm</div>
              <div>α₁={res.alpha1} α₂={res.alpha2.toFixed(2)} α₃={res.alpha3} α₄={res.alpha4}</div>
              <div>α comb = <b>{res.alpha_comb.toFixed(3)}</b></div>
              <div>Lb,d = <b>{res.lb_d.toFixed(0)}</b> mm</div>
              <div>Lbar = <b>{res.bar_length.toFixed(0)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Plan ancrage (live SVG)</h2>
          <svg viewBox="0 0 300 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const sc = 0.3; const ox = 150, oy = 125;
              const a = inp.a * sc, b = inp.b * sc;
              return (
                <g>
                  <rect x={ox - a / 2 - 20} y={oy - b / 2 - 20} width={a + 40} height={b + 40}
                    fill="#e2e8f0" opacity={0.3} rx={4} />
                  <rect x={ox - a / 2} y={oy - b / 2} width={a} height={b}
                    fill="#1e40af" rx={2} />
                  <text x={ox} y={oy + 3} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                    {inp.a}×{inp.b}
                  </text>
                  {res && (
                    <>
                      <text x={ox} y={oy - b / 2 - 8} textAnchor="middle" fontSize={7} fill="#2563eb">
                        Lb,d={res.lb_d.toFixed(0)}mm
                      </text>
                      <line x1={ox - a / 2} y1={oy - b / 2 - 25} x2={ox + a / 2} y2={oy - b / 2 - 25}
                        stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#arrow)" />
                    </>
                  )}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.lb_d <= res.bar_length ? 'text-green-600' : 'text-red-600'}>
              {res.lb_d <= res.bar_length
                ? `✓ Ancrage: Lb,d=${res.lb_d.toFixed(0)}mm ≤ Lbar=${res.bar_length.toFixed(0)}mm`
                : `✗ Ancrage: Lb,d=${res.lb_d.toFixed(0)}mm > Lbar=${res.bar_length.toFixed(0)}mm`}
            </li>
            <li className="text-slate-500">• fbd = {res.fbd.toFixed(2)} MPa</li>
            <li className="text-slate-500">• fyd = {res.fyd.toFixed(0)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
