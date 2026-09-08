import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ContraintesSectionQqInputs, ContraintesSectionQqOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: ContraintesSectionQqInputs = {
  fck: 30, fyk: 500, gs: 1.15, ec1: 2.0, ecu1: 3.5,
  ey: 200000, k: 1.15, euk: 10.0,
  n_layers: 2,
  widths_top: [300, 300],
  widths_bot: [300, 300],
  heights: [200, 400],
  n_steel: 2,
  steel_depths: [40, 560],
  steel_areas: [6.28, 6.28],
  n_ed: 500, m_ed: 80,
  itour: 15,
};

export default function Module126() {
  const [inp, setInp] = useState<ContraintesSectionQqInputs>(DEFAULT);
  const [res, setRes] = useState<ContraintesSectionQqOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof ContraintesSectionQqInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<ContraintesSectionQqOutput>('calculate_contraintes_section_qq_126', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  const totalH = inp.heights.reduce((a, b) => a + b, 0);
  const maxW = Math.max(...inp.widths_top, ...inp.widths_bot);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">126 Contraintes Section QQ <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">M-N — section quelconque, Simpson</p>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={1.5} step={0.05} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="εc1" unit="‰" value={inp.ec1} onChange={S('ec1')} min={1} max={4} step={0.1} />
          <NumField label="εcu1" unit="‰" value={inp.ecu1} onChange={S('ecu1')} min={2} max={5} step={0.1} />
          <NumField label="euk" unit="‰" value={inp.euk} onChange={S('euk')} min={5} max={20} step={0.5} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section (couches)</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="n couches" unit="-" value={inp.n_layers} onChange={S('n_layers')} min={1} max={6} step={1} />
          <NumField label="h total" unit="mm" value={totalH} onChange={() => {}} min={0} max={0} step={0} />
        </div>
        {Array.from({ length: inp.n_layers }).map((_, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <NumField label={`b_sup${i + 1}`} unit="mm" value={inp.widths_top[i] || 0} onChange={(v) => {
              const w = [...inp.widths_top]; w[i] = v; setInp((p) => ({ ...p, widths_top: w }));
            }} min={50} max={2000} step={10} />
            <NumField label={`b_inf${i + 1}`} unit="mm" value={inp.widths_bot[i] || 0} onChange={(v) => {
              const w = [...inp.widths_bot]; w[i] = v; setInp((p) => ({ ...p, widths_bot: w }));
            }} min={50} max={2000} step={10} />
            <NumField label={`h${i + 1}`} unit="mm" value={inp.heights[i] || 0} onChange={(v) => {
              const h = [...inp.heights]; h[i] = v; setInp((p) => ({ ...p, heights: h }));
            }} min={50} max={2000} step={10} />
          </div>
        ))}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Aciers</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="n aciers" unit="-" value={inp.n_steel} onChange={S('n_steel')} min={1} max={10} step={1} />
        </div>
        {Array.from({ length: inp.n_steel }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <NumField label={`d${i + 1}`} unit="mm" value={inp.steel_depths[i] || 0} onChange={(v) => {
              const d = [...inp.steel_depths]; d[i] = v; setInp((p) => ({ ...p, steel_depths: d }));
            }} min={0} max={3000} step={10} />
            <NumField label={`As${i + 1}`} unit="cm²" value={inp.steel_areas[i] || 0} onChange={(v) => {
              const a = [...inp.steel_areas]; a[i] = v; setInp((p) => ({ ...p, steel_areas: a }));
            }} min={0} max={100} step={0.5} />
          </div>
        ))}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="NEd" unit="kN" value={inp.n_ed} onChange={S('n_ed')} min={-5000} max={5000} step={10} />
          <NumField label="MEd" unit="kN·m" value={inp.m_ed} onChange={S('m_ed')} min={0} max={2000} step={5} />
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>NRd = <b>{res.n_rd.toFixed(1)}</b> kN | MRd = <b>{res.m_rd.toFixed(1)}</b> kN·m</div>
              <div>ε1 = <b>{res.e1.toFixed(2)}</b> ‰ | ε2 = <b>{res.e2.toFixed(2)}</b> ‰</div>
              <div>x₀ = <b>{res.x_neutral.toFixed(1)}</b> mm</div>
              <div>σs₁ = <b>{res.sigma_s1.toFixed(0)}</b> MPa | σs₂ = <b>{res.sigma_s2.toFixed(0)}</b> MPa</div>
              <div>σc sup = <b>{res.sigma_c_top.toFixed(1)}</b> MPa | σc inf = <b>{res.sigma_c_bot.toFixed(1)}</b> MPa</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>ΔN = <b>{res.dn.toFixed(1)}</b> kN | ΔM = <b>{res.dm.toFixed(1)}</b> kN·m</div>
              <div>A = <b>{res.area.toFixed(0)}</b> mm² | y̅ = <b>{res.centroid.toFixed(1)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Section (SVG)</h2>
          <svg viewBox="0 0 300 200" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {(() => {
              const ox = 150, oy = 20;
              const sc = Math.min(120 / totalH, 250 / maxW);
              let y = oy;
              return (
                <g>
                  {inp.heights.map((h, i) => {
                    const wTop = inp.widths_top[i] * sc;
                    const wBot = inp.widths_bot[i] * sc;
                    const hh = h * sc;
                    const yStart = y;
                    y += hh;
                    const pts = `${ox - wTop / 2},${yStart} ${ox + wTop / 2},${yStart} ${ox + wBot / 2},${y} ${ox - wBot / 2},${y}`;
                    return <polygon key={i} points={pts} fill={i % 2 === 0 ? '#e2e8f0' : '#cbd5e1'} stroke="#64748b" strokeWidth={0.5} />;
                  })}
                  {inp.steel_depths.slice(0, inp.n_steel).map((d, i) => {
                    const yS = oy + d * sc;
                    return <circle key={i} cx={ox} cy={yS} r={3} fill="#2563eb" />;
                  })}
                  {res && (
                    <>
                      <line x1={ox - maxW * sc / 2 - 10} y1={oy + res.x_neutral * sc} x2={ox + maxW * sc / 2 + 10} y2={oy + res.x_neutral * sc} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,2" />
                      <text x={ox + maxW * sc / 2 + 15} y={oy + res.x_neutral * sc + 3} fontSize={7} fill="#ef4444">x₀={res.x_neutral.toFixed(0)}</text>
                    </>
                  )}
                  <text x={ox} y={y + 15} textAnchor="middle" fontSize={7} fill="#64748b">H={totalH}mm</text>
                  {res && <text x={ox} y={y + 25} textAnchor="middle" fontSize={8} fill="#2563eb" fontWeight="bold">NRd={res.n_rd.toFixed(0)}kN MRd={res.m_rd.toFixed(0)}kN·m</text>}
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
            <li className={res.dm >= 0 ? 'text-green-600' : 'text-red-600'}>
              {res.dm >= 0 ? `✓ ΔM = +${res.dm.toFixed(1)} kN·m` : `✗ ΔM = ${res.dm.toFixed(1)} kN·m — ne résiste pas`}
            </li>
            <li className={res.dn >= 0 ? 'text-green-600' : 'text-red-600'}>
              {res.dn >= 0 ? `✓ ΔN = +${res.dn.toFixed(1)} kN` : `✗ ΔN = ${res.dn.toFixed(1)} kN — ne résiste pas`}
            </li>
            <li className="text-slate-500">• ε1 = {res.e1.toFixed(2)}‰ | ε2 = {res.e2.toFixed(2)}‰</li>
            <li className="text-slate-500">• σs₁ = {res.sigma_s1.toFixed(0)} MPa | σs₂ = {res.sigma_s2.toFixed(0)} MPa</li>
            <li className="text-slate-500">• σc = {res.sigma_c_top.toFixed(1)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
