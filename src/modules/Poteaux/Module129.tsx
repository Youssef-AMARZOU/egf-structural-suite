import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { NMVTInputs, NMVTOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: NMVTInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15, b: 300, h: 500,
  d: 450, dp: 50, aci: 5.0, acs: 15.0,
  n_ed: 500, m_ed: 200, v_ed: 100, t_ed: 30,
  ec1: 0.00175, ecu1: 0.0035, ey: 320000, euk: 0.01,
  kacier: 1.0, typ: 1, itour: 16,
};

export default function Module129() {
  const [inp, setInp] = useState<NMVTInputs>(DEFAULT);
  const [res, setRes] = useState<NMVTOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof NMVTInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<NMVTOutput>('calculate_n_m_v_t_129', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">129 N-M-V-T <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Forces combinées N+M+V+T — bisection + Simpson</p>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="b" unit="mm" value={inp.b} onChange={S('b')} min={100} max={2000} step={10} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={2000} step={10} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={2000} step={5} />
          <NumField label="dp" unit="mm" value={inp.dp} onChange={S('dp')} min={20} max={200} step={5} />
          <NumField label="Ac,i" unit="cm²" value={inp.aci} onChange={S('aci')} min={0} max={100} step={0.5} />
          <NumField label="Ac,s" unit="cm²" value={inp.acs} onChange={S('acs')} min={0} max={100} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={-2000} max={5000} step={10} />
          <NumField label="MEd" unit="kN·m" value={inp.m_ed} onChange={S('m_ed')} min={0} max={1000} step={5} />
          <NumField label="VEd" unit="kN" value={inp.v_ed} onChange={S('v_ed')} min={0} max={500} step={5} />
          <NumField label="TEd" unit="kN·m" value={inp.t_ed} onChange={S('t_ed')} min={0} max={200} step={5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modèle</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Ec1" unit="‰" value={inp.ec1 * 1000} onChange={(v) => S('ec1')(v / 1000)} min={0.5} max={4} step={0.05} />
          <NumField label="Ecu1" unit="‰" value={inp.ecu1 * 1000} onChange={(v) => S('ecu1')(v / 1000)} min={2} max={5} step={0.05} />
          <NumField label="Ek" unit="MPa" value={inp.ey} onChange={S('ey')} min={200000} max={220000} step={1000} />
          <NumField label="Euk" unit="‰" value={inp.euk * 1000} onChange={(v) => S('euk')(v / 1000)} min={5} max={20} step={0.5} />
          <NumField label="Typ" unit="1-3" value={inp.typ} onChange={S('typ')} min={1} max={3} step={1} />
          <NumField label="Itérations" unit="-" value={inp.itour} onChange={S('itour')} min={4} max={20} step={1} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>NRd = <b>{res.n_rd.toFixed(1)}</b> kN | MRd = <b>{res.m_rd.toFixed(1)}</b> kN·m</div>
              <div>VRd = <b>{res.v_rd.toFixed(1)}</b> kN | TRd = <b>{res.t_rd.toFixed(1)}</b> kN·m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>e1 = <b>{res.e1.toFixed(5)}</b> | e2 = <b>{res.e2.toFixed(5)}</b></div>
              <div>x = <b>{res.x_neutral.toFixed(1)}</b> mm</div>
              <div>σc = <b>{res.sigma_c.toFixed(1)}</b> MPa</div>
              <div>σs1 = <b>{res.sigma_s1.toFixed(1)}</b> MPa | σs2 = <b>{res.sigma_s2.toFixed(1)}</b> MPa</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Barres ratios</h2>
          {res && (
            <div className="space-y-2">
              {[
                { label: 'N', ratio: res.ratio_n, color: '#2563eb' },
                { label: 'M', ratio: res.ratio_m, color: '#10b981' },
                { label: 'V', ratio: res.ratio_v, color: '#f59e0b' },
                { label: 'T', ratio: res.ratio_t, color: '#ef4444' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-4 text-center font-bold" style={{ color: item.color }}>{item.label}</span>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${Math.min(item.ratio * 100, 100)}%`,
                        backgroundColor: item.color,
                        opacity: item.ratio > 1.0 ? 1 : 0.7,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-12 text-right font-bold" style={{ color: item.ratio > 1.0 ? '#ef4444' : item.color }}>
                    {(item.ratio * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono w-4 text-center font-bold text-slate-600">Σ</span>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-white/5 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${Math.min(res.ratio_combined * 100, 100)}%`,
                      backgroundColor: res.ratio_combined > 1.0 ? '#ef4444' : '#2563eb',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono w-12 text-right font-bold" style={{ color: res.ratio_combined > 1.0 ? '#ef4444' : '#2563eb' }}>
                  {(res.ratio_combined * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
        <h2 className="text-sm font-bold mb-2">Coupe — Diagramme</h2>
        <svg viewBox="0 0 300 250" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          {res && (() => {
            const ox = 150, oy = 30;
            const sc = 0.4;
            const w = inp.b * sc;
            const hh = inp.h * sc;
            const hlf = w / 2;
            const nStr = 8;
            return (
              <g>
                <rect x={ox - hlf} y={oy} width={w} height={hh} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.8} rx={2} />
                {Array.from({ length: nStr }, (_, i) => {
                  const y = oy + hh * (i + 0.5) / nStr;
                  return <circle key={`as${i}`} cx={ox - hlf + 6} cy={y} r={2} fill="#2563eb" />;
                })}
                {Array.from({ length: nStr }, (_, i) => {
                  const y = oy + hh * (i + 0.5) / nStr;
                  return <circle key={`asb${i}`} cx={ox + hlf - 6} cy={y} r={2} fill="#ef4444" />;
                })}
                <circle cx={ox} cy={oy + 4} r={3} fill="#2563eb" />
                <text x={ox + 8} y={oy + 7} fontSize={6} fill="#2563eb">e1={res.e1.toFixed(5)}</text>
                <circle cx={ox} cy={oy + hh - 4} r={3} fill="#ef4444" />
                <text x={ox + 8} y={oy + hh - 1} fontSize={6} fill="#ef4444">e2={res.e2.toFixed(5)}</text>
                {res.x_neutral > 0 && res.x_neutral < inp.h && (
                  <g>
                    <line x1={ox - hlf + 4} y1={oy + res.x_neutral * sc} x2={ox + hlf - 4} y2={oy + res.x_neutral * sc} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3,2" />
                    <text x={ox - hlf - 4} y={oy + res.x_neutral * sc + 3} textAnchor="end" fontSize={6} fill="#ef4444">x={res.x_neutral.toFixed(0)}</text>
                  </g>
                )}
                <text x={ox} y={oy + hh + 16} textAnchor="middle" fontSize={7} fill="#64748b">N={inp.n_ed.toFixed(0)}kN M={inp.m_ed.toFixed(0)}kNm</text>
                <text x={ox} y={oy + hh + 26} textAnchor="middle" fontSize={7} fill="#64748b">V={inp.v_ed.toFixed(0)}kN T={inp.t_ed.toFixed(0)}kNm</text>
                <text x={ox} y={oy + hh + 40} textAnchor="middle" fontSize={7} fontWeight="bold" fill={res.ratio_combined > 1.0 ? '#ef4444' : '#10b981'}>ratio = {(res.ratio_combined * 100).toFixed(0)}%</text>
              </g>
            );
          })()}
        </svg>
        <div className="mt-3">
          <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
          {res ? (
            <ul className="text-xs space-y-2">
              <li className={res.ratio_combined <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_combined <= 1.0 ? '✓' : '✗'} ratio combiné = {(res.ratio_combined * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_n <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_n <= 1.0 ? '✓' : '✗'} N = {(res.ratio_n * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_m <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_m <= 1.0 ? '✓' : '✗'} M = {(res.ratio_m * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} V = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className={res.ratio_t <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_t <= 1.0 ? '✓' : '✗'} T = {(res.ratio_t * 100).toFixed(0)}%
              </li>
            </ul>
          ) : <p className="text-xs text-slate-500">computing…</p>}
        </div>
      </div>
    </div>
  );
}
