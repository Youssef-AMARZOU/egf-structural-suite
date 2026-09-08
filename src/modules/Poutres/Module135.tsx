import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { EcretementInputs, EcretementOutput } from '../../types/engineering';
import NumField from '../../components/NumField';

const DEFAULT: EcretementInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bw: 250, h: 500, d: 440,
  l_noeud: 12000, t_appui: 250,
  m_ed_sup: -200, v_ed_sup: 300,
  m_ed_pos_max: 150, m_span_design: 120,
  n_spans: 3, span_lengths: [4000, 4000, 4000],
  support_widths: [250, 250, 250, 250],
};

export default function Module135() {
  const [inp, setInp] = useState<EcretementInputs>(DEFAULT);
  const [res, setRes] = useState<EcretementOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const S = (k: keyof EcretementInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let dead = false;
    invoke<EcretementOutput>('calculate_ecretement_135', { p: inp })
      .then((r) => { if (!dead) { setRes(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [inp]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <h2 className="text-sm font-bold">135 Écrêtement <span className="font-mono text-[11px] text-emerald-500">RUST</span></h2>
        <p className="text-[11px] text-slate-500">Écrêtement M/V appuis — EC2 §5.3.2.2, §6.2.1(8)</p>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="fck" unit="MPa" value={inp.fck} onChange={S('fck')} min={12} max={90} step={1} />
          <NumField label="fyk" unit="MPa" value={inp.fyk} onChange={S('fyk')} min={400} max={600} step={10} />
          <NumField label="γc" unit="-" value={inp.gc} onChange={S('gc')} min={1} max={2} step={0.05} />
          <NumField label="γs" unit="-" value={inp.gs} onChange={S('gs')} min={1} max={2} step={0.05} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutre</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="bw" unit="mm" value={inp.bw} onChange={S('bw')} min={100} max={1000} step={10} />
          <NumField label="h" unit="mm" value={inp.h} onChange={S('h')} min={100} max={1500} step={10} />
          <NumField label="d" unit="mm" value={inp.d} onChange={S('d')} min={50} max={1400} step={5} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="L_nœud" unit="mm" value={inp.l_noeud} onChange={S('l_noeud')} min={2000} max={30000} step={500} />
          <NumField label="t appui" unit="mm" value={inp.t_appui} onChange={S('t_appui')} min={100} max={1000} step={10} />
          <NumField label="Nb travées" unit="-" value={inp.n_spans} onChange={S('n_spans')} min={1} max={10} step={1} />
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="MEd,sup" unit="kN·m" value={inp.m_ed_sup} onChange={S('m_ed_sup')} min={-1000} max={0} step={5} />
          <NumField label="VEd,sup" unit="kN" value={inp.v_ed_sup} onChange={S('v_ed_sup')} min={0} max={1000} step={5} />
          <NumField label="MEd,pos" unit="kN·m" value={inp.m_ed_pos_max} onChange={S('m_ed_pos_max')} min={0} max={500} step={5} />
          <NumField label="M_span,des" unit="kN·m" value={inp.m_span_design} onChange={S('m_span_design')} min={0} max={500} step={5} />
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>M,sup,orig = <b>{res.m_sup_original.toFixed(1)}</b> kN·m</div>
              <div>M,sup,red = <b>{res.m_sup_red.toFixed(1)}</b> kN·m | Réduction = <b>{res.reduction_pct.toFixed(0)}%</b></div>
              <div>ΔM = <b>{res.delta_m.toFixed(1)}</b> kN·m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>M,span,orig = <b>{res.m_span_original.toFixed(1)}</b> kN·m</div>
              <div>M,span,red = <b>{res.m_span_red.toFixed(1)}</b> kN·m</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>VEd(d) = <b>{res.v_ed_at_d.toFixed(1)}</b> kN</div>
              <div>VRd,c = <b>{res.v_rdc.toFixed(1)}</b> kN | VRd,max = <b>{res.v_rdc_max.toFixed(1)}</b> kN</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Diagramme de moments</h2>
          <svg viewBox="0 0 400 180" className="w-full rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            {res && (() => {
              const ox = 40, oy = 90, w = 340, h = 140;
              const env = res.moment_envelope;
              const maxM = Math.max(...env.map(Math.abs), 1);
              const sc = h / maxM / 2;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={0.5} />

                  {env.map((m, i) => {
                    const x = ox + (i / (env.length - 1)) * w;
                    const y = oy - m * sc;
                    return (
                      <g key={i}>
                        {i > 0 && (
                          <line
                            x1={ox + ((i - 1) / (env.length - 1)) * w}
                            y1={oy - env[i - 1] * sc}
                            x2={x}
                            y2={y}
                            stroke="#2563eb"
                            strokeWidth={1.5}
                          />
                        )}
                      </g>
                    );
                  })}

                  {res.moment_envelope.length > 0 && (
                    <>
                      <line
                        x1={ox} y1={oy - res.m_sup_red * sc}
                        x2={ox + w} y2={oy - res.m_sup_red * sc}
                        stroke="#ef4444" strokeWidth={0.8} strokeDasharray="4,2"
                      />
                      <text x={ox + w + 4} y={oy - res.m_sup_red * sc + 3} fontSize={5} fill="#ef4444">M_red</text>
                    </>
                  )}

                  <text x={ox} y={oy + 16} fontSize={5} fill="#64748b">0</text>
                  <text x={ox + w} y={oy + 16} fontSize={5} fill="#64748b" textAnchor="end">L</text>
                  <text x={ox + w / 2} y={oy + 16} textAnchor="middle" fontSize={5} fill="#64748b">
                    Écrêtement {res.reduction_pct.toFixed(0)}%
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Coupes d'appui</h2>
          {res && res.support_caps.length > 0 && (
            <div className="h-28">
              <svg viewBox="0 0 350 80" className="w-full">
                {(() => {
                  const maxM = Math.max(...res.support_caps.map((c) => c.m_original), 1);
                  const barH = 50;
                  const w = 350 / res.support_caps.length - 4;
                  return res.support_caps.map((cap, i) => {
                    const hOrig = (cap.m_original / maxM) * barH;
                    const hCap = (cap.m_capped / maxM) * barH;
                    const x = (i / res.support_caps.length) * 350 + 2;
                    return (
                      <g key={i}>
                        <rect x={x} y={70 - hOrig} width={w / 2 - 1} height={hOrig} fill="#94a3b8" rx={1} opacity={0.5} />
                        <rect x={x + w / 2} y={70 - hCap} width={w / 2 - 1} height={hCap} fill="#2563eb" rx={1} opacity={0.8} />
                        <text x={x + w / 2} y={75} textAnchor="middle" fontSize={5} fill="#64748b">A{i + 1}</text>
                      </g>
                    );
                  });
                })()}
              </svg>
            </div>
          )}
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
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} VEd(d)/VRd,c = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• M,sup,orig = {res.m_sup_original.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• M,sup,red = {res.m_sup_red.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• Réduction = {res.reduction_pct.toFixed(0)}%</li>
              <li className="text-slate-500">• ΔM = {res.delta_m.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• M,span,red = {res.m_span_red.toFixed(1)}kN·m</li>
              <li className="text-slate-500">• VEd(d) = {res.v_ed_at_d.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,c = {res.v_rdc.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,max = {res.v_rdc_max.toFixed(1)}kN</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
      </div>
    </div>
  );
}
