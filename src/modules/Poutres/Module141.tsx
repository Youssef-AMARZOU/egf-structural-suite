import { useState } from 'react';
import type { Ec1VentInputs, Ec1VentOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: Ec1VentInputs = {
  vb0: 27, rho: 1.25, z0: 1.0, zt: 200, lt: 300,
  cdir: 1.0, cseason: 1.0, c0z: 1.0,
  z: 10, ze: 10, zs: 6,
  b: 15, d: 10, h: 30,
  n1: 1.0, masseq: 100, phi: 0.5,
  terrain_cat: 3,
};


export default function Module141() {
  const [inp, setInp] = useState<Ec1VentInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<Ec1VentInputs, Ec1VentOutput>(
    'calculate_ec1_vent_141', inp,
  );
  const S = (k: keyof Ec1VentInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof Ec1VentInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="141 EC1 Vent"
      subtitle="Eurocode 1 — Actions vent — EN 1991-1-4"
      eurocode="EN 1991-1-4"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Vent de base</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('vb0', 'vb,0', 'm/s', 10, 50, 1)}
          {slider('rho', 'ρ', 'kg/m³', 1, 1.5, 0.01)}
          {slider('z0', 'z0', 'm', 0.001, 5, 0.01)}
          {slider('zt', 'zt', 'm', 1, 500, 10)}
          {slider('lt', 'Lt', 'm', 10, 1000, 10)}
          {slider('cdir', 'cdir', '-', 0.5, 2, 0.01)}
          {slider('cseason', 'cseason', '-', 0.5, 2, 0.01)}
          {slider('c0z', 'c0,z', '-', 0.5, 2, 0.01)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Géométrie</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('b', 'b', 'm', 1, 100, 0.5)}
          {slider('d', 'd', 'm', 1, 100, 0.5)}
          {slider('h', 'h', 'm', 1, 200, 0.5)}
          {slider('z', 'z', 'm', 0.1, 200, 0.5)}
          {slider('ze', 'ze', 'm', 0.1, 200, 0.5)}
          {slider('zs', 'zs', 'm', 0.1, 200, 0.5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Dynamique</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n1', 'n1', 'Hz', 0.1, 10, 0.1)}
          {slider('masseq', 'masse', 't/m', 10, 1000, 10)}
          {slider('phi', 'φ', '-', 0.01, 1, 0.01)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Profil de vitesse du vent" vbW={400} vbH={200}>
            {res && (() => {
              const ox = 40, oy = 20, w = 320, h = 160;
              const maxV = Math.max(res.vmz, res.vmze, res.vmzs, 1);
              const sc = w / maxV;
              const maxZ = inp.h;

              return (
                <g>
                  <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />
                  <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#94a3b8" strokeWidth={0.5} />

                  {[0, 0.25, 0.5, 0.75, 1.0].map((t) => (
                    <g key={t}>
                      <line x1={ox} y1={oy + h - t * h} x2={ox + w} y2={oy + h - t * h} stroke="#94a3b8" strokeWidth={0.3} />
                      <text x={ox - 5} y={oy + h - t * h + 3} textAnchor="end" fontSize={5} fill="#64748b">
                        {(t * maxZ).toFixed(0)}m
                      </text>
                    </g>
                  ))}

                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => {
                      const z = (i / 19) * maxZ;
                      const v = res.vmz * Math.pow(z / inp.z, 0.14);
                      return `${ox + v * sc},${oy + h - (z / maxZ) * h}`;
                    }).join(' ')}
                    fill="none" stroke="#2563eb" strokeWidth={1.5}
                  />

                  <circle cx={ox + res.vmzs * sc} cy={oy + h - (inp.zs / maxZ) * h} r={3} fill="#ef4444" />
                  <circle cx={ox + res.vmze * sc} cy={oy + h - (inp.ze / maxZ) * h} r={3} fill="#22c55e" />
                  <circle cx={ox + res.vmz * sc} cy={oy + h - (inp.z / maxZ) * h} r={3} fill="#2563eb" />

                  <text x={ox + res.vmz * sc + 5} y={oy + h - (inp.z / maxZ) * h - 3} fontSize={5} fill="#2563eb">vm,z={res.vmz.toFixed(1)}</text>
                  <text x={ox + res.vmze * sc + 5} y={oy + h - (inp.ze / maxZ) * h - 3} fontSize={5} fill="#22c55e">vm,ze={res.vmze.toFixed(1)}</text>
                  <text x={ox + res.vmzs * sc + 5} y={oy + h - (inp.zs / maxZ) * h - 3} fontSize={5} fill="#ef4444">vm,zs={res.vmzs.toFixed(1)}</text>

                  <text x={ox + w / 2} y={oy + h + 14} textAnchor="middle" fontSize={5} fill="#64748b">
                    fw={res.fw.toFixed(2)}kN/m² | Cf={res.cf.toFixed(2)} | Cscd={res.cscd.toFixed(2)}
                  </text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        </>
      }
      results={
        <>
          {res ? (
            <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>vm,z = <b>{res.vmz.toFixed(1)}</b> m/s | vm,ze = <b>{res.vmze.toFixed(1)}</b> m/s</div>
              <div>cr,z = <b>{res.crz.toFixed(2)}</b> | cr,ze = <b>{res.crze.toFixed(2)}</b></div>
              <div>Iv,z = <b>{res.ivz.toFixed(3)}</b> | Iv,ze = <b>{res.ivze.toFixed(3)}</b></div>
              <div>q0,z = <b>{res.q0z.toFixed(1)}</b> N/m² | q0,ze = <b>{res.q0ze.toFixed(1)}</b> N/m²</div>
              <div>Cf = <b>{res.cf.toFixed(2)}</b> | Cscd = <b>{res.cscd.toFixed(2)}</b></div>
              <div>fw = <b>{res.fw.toFixed(2)}</b> kN/m²</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>

              <FormulaCard
                title="Vent (EN 1991-1-4)"
                latex={String.raw`F_w = c_s c_d \sum q_p(z_e) A_{ref}`}
                description="Pression de pointe par zones"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`q_p`, meaning: 'Pression de pointe', value: res.vmz.toFixed(1) },
                    { symbol: String.raw`c_s c_d`, meaning: 'Facteur structural', value: res.cscd.toFixed(2) },
                ]}
              />
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
              <li className={res.fw <= 1.0 ? 'text-green-600' : 'text-yellow-600'}>
                {res.fw <= 1.0 ? '✓' : '!'} fw = {res.fw.toFixed(2)} kN/m²
              </li>
              <li className="text-slate-500">• vm,z = {res.vmz.toFixed(1)} m/s</li>
              <li className="text-slate-500">• cr,z = {res.crz.toFixed(2)}</li>
              <li className="text-slate-500">• Iv,z = {res.ivz.toFixed(3)}</li>
              <li className="text-slate-500">• q0,z = {res.q0z.toFixed(1)} N/m²</li>
              <li className="text-slate-500">• Cf = {res.cf.toFixed(2)}</li>
              <li className="text-slate-500">• Cscd = {res.cscd.toFixed(2)}</li>
              <li className="text-slate-500">• kn = {res.kn.toFixed(2)}</li>
              <li className="text-slate-500">• R² = {res.r2.toFixed(2)}</li>
              <li className="text-slate-500">• ν = {res.nu.toFixed(2)} Hz</li>
            </ul>
          </div>
        ) : <p className="text-xs text-slate-500">computing…</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
