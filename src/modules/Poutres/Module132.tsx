import { useState } from 'react';
import type { EffTrChargPresAppuiInputs, EffTrChargPresAppuiOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: EffTrChargPresAppuiInputs = {
  fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
  bw: 250, h: 500, d: 440, l: 6000,
  p: 15, m1: 50, m2: 30,
  n_charges: 2,
  tab_q: [200, 150],
  tab_a: [1500, 4500],
  tab_pad: [300, 300],
  theta: 1.0,
  alpha: 0.0,
};


export default function Module132() {
  const [inp, setInp] = useState<EffTrChargPresAppuiInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<EffTrChargPresAppuiInputs, EffTrChargPresAppuiOutput>(
    'calculate_eff_tr_charg_pres_appui_132', inp,
  );
  const S = (k: keyof EffTrChargPresAppuiInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio_v <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof EffTrChargPresAppuiInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="132 Eff. Tranch. Appuis"
      subtitle="Cisaillement EC2 — charges près des appuis, β, enveloppe"
      eurocode="EC2"
      status={status}
      live={live}
      params={
        <>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '-', 1, 2, 0.05)}
          {slider('gs', 'γs', '-', 1, 2, 0.05)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Poutre</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('bw', 'bw', 'mm', 100, 1000, 10)}
          {slider('h', 'h', 'mm', 100, 1500, 10)}
          {slider('d', 'd', 'mm', 50, 1400, 5)}
          {slider('l', 'L', 'mm', 1000, 20000, 100)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges réparties</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('p', 'p', 'kN/m', 0, 100, 1)}
          {slider('m1', 'M1', 'kN·m', -500, 500, 5)}
          {slider('m2', 'M2', 'kN·m', -500, 500, 5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Charges concentrées</div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <ParamSlider label="?" unit="kN" value={inp.tab_q[i] || 0} min={0} max={1000} step={10} onChange={(v) => { const q = [...inp.tab_q]; q[i] = v; setInp((p) => ({ ...p, tab_q: q })); }} />
              <ParamSlider label="?" unit="mm" value={inp.tab_a[i] || 0} min={0} max={20000} step={100} onChange={(v) => { const a = [...inp.tab_a]; a[i] = v; setInp((p) => ({ ...p, tab_a: a })); }} />
              <ParamSlider label="?" unit="mm" value={inp.tab_pad[i] || 0} min={0} max={1000} step={50} onChange={(v) => { const pad = [...inp.tab_pad]; pad[i] = v; setInp((p) => ({ ...p, tab_pad: pad })); }} />
            </div>
          ))}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 uppercase">Bielle</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('theta', 'cot θ', '-', 0.5, 2.5, 0.1)}
          {slider('alpha', 'cot α', '-', 0, 2.5, 0.1)}
        </div>

        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe — Enveloppe V(x)" vbW={400} vbH={160}>
            {res && (() => {
              const ox = 40, oy = 80, w = 340, h = 120;
              const env = res.shear_envelope;
              const maxV = Math.max(...env.map(Math.abs), 1);
              const sc = h / maxV / 2;

              const beamY = oy - 10;
              const beamH = 20;

              return (
                <g>
                  <rect x={ox} y={beamY} width={w} height={beamH} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.8} rx={2} />
                  <polygon points={`${ox},${oy} ${ox - 10},${oy + 15} ${ox + 10},${oy + 15}`} fill="#475569" />
                  <polygon points={`${ox + w},${oy} ${ox + w - 10},${oy + 15} ${ox + w + 10},${oy + 15}`} fill="#475569" />

                  {env.map((v, i) => {
                    const x = ox + (i / (env.length - 1)) * w;
                    const y = oy - v * sc;
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

                  <line x1={ox} y1={oy} x2={ox + w} y2={oy} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="2,2" />

                  {res.v_rdc > 0 && (
                    <line
                      x1={ox} y1={oy - res.v_rdc * sc}
                      x2={ox + w} y2={oy - res.v_rdc * sc}
                      stroke="#10b981" strokeWidth={0.8} strokeDasharray="4,2"
                    />
                  )}
                  {res.v_rdc_max > 0 && (
                    <line
                      x1={ox} y1={oy - res.v_rdc_max * sc}
                      x2={ox + w} y2={oy - res.v_rdc_max * sc}
                      stroke="#ef4444" strokeWidth={0.8} strokeDasharray="4,2"
                    />
                  )}

                  {inp.tab_a.slice(0, inp.n_charges).map((a, i) => {
                    const x = ox + (a / inp.l) * w;
                    return (
                      <g key={i}>
                        <line x1={x} y1={beamY - 20} x2={x} y2={beamY} stroke="#f59e0b" strokeWidth={1.5} />
                        <polygon points={`${x - 4},${beamY - 25} ${x + 4},${beamY - 25} ${x},${beamY - 18}`} fill="#f59e0b" />
                        <text x={x} y={beamY - 28} textAnchor="middle" fontSize={6} fill="#d97706">Q{i + 1}</text>
                      </g>
                    );
                  })}

                  <text x={ox} y={oy + h / 2 + 10} fontSize={6} fill="#64748b">0</text>
                  <text x={ox + w} y={oy + h / 2 + 10} fontSize={6} fill="#64748b" textAnchor="end">L</text>

                  <text x={ox + 5} y={oy - res.v_rdc * sc - 3} fontSize={5} fill="#10b981">VRd,c</text>
                  <text x={ox + 5} y={oy - res.v_rdc_max * sc - 3} fontSize={5} fill="#ef4444">VRd,max</text>
                </g>
              );
            })()}
          </SectionCanvas>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Coupe — Bielle inclinée" vbW={400} vbH={140}>
            {res && (() => {
              const ox = 100, oy = 20, bw = 60, h = 80;
              const thetaAngle = Math.atan(1 / res.cot_theta);
              const strutLen = inp.d / Math.sin(thetaAngle);

              return (
                <g>
                  <rect x={ox} y={oy} width={bw} height={h} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.8} rx={2} />
                  <rect x={ox} y={oy + h} width={bw} height={10} fill="#475569" rx={1} />

                  <line
                    x1={ox + bw / 2 - 15}
                    y1={oy + h}
                    x2={ox + bw / 2 + 15}
                    y2={oy}
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                  <text x={ox + bw / 2 + 20} y={oy + h / 2} fontSize={6} fill="#2563eb">
                    θ = {(thetaAngle * 180 / Math.PI).toFixed(1)}°
                  </text>

                  <line x1={ox + bw / 2 - 25} y1={oy + h * 0.9} x2={ox + bw / 2 + 25} y2={oy + h * 0.9} stroke="#10b981" strokeWidth={1} strokeDasharray="3,2" />
                  <text x={ox + bw / 2 + 30} y={oy + h * 0.9 + 3} fontSize={5} fill="#10b981">d = {inp.d}</text>

                  <line x1={ox - 10} y1={oy} x2={ox + bw + 10} y2={oy} stroke="#ef4444" strokeWidth={0.5} />
                  <text x={ox + bw + 15} y={oy + 3} fontSize={5} fill="#ef4444">b.w = {inp.bw}</text>

                  <text x={ox + bw / 2} y={oy + h + 22} textAnchor="middle" fontSize={6} fill="#64748b">z = {res.z.toFixed(0)} mm</text>
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
              <div>V.gauche = <b>{res.v_left.toFixed(1)}</b> kN | V.droit = <b>{res.v_right.toFixed(1)}</b> kN</div>
              <div>V,max = <b>{res.v_max.toFixed(1)}</b> kN</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>VRd,c = <b>{res.v_rdc.toFixed(1)}</b> kN</div>
              <div>VRd,max = <b>{res.v_rdc_max.toFixed(1)}</b> kN</div>
              <div>VRd,s = <b>{res.v_rds.toFixed(1)}</b> kN</div>
              <div>Asw/s = <b>{(res.asw_s * 10000).toFixed(2)}</b> cm²/m</div>
              <div>Asw/s,g = <b>{(res.asw_s_left * 10000).toFixed(2)}</b> | Asw/s,d = <b>{(res.asw_s_right * 10000).toFixed(2)}</b></div>
              <div>z = <b>{res.z.toFixed(1)}</b> mm | cot θ = <b>{res.cot_theta.toFixed(2)}</b></div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>


              <FormulaCard
                title="Cisaillement près appuis"
                latex={String.raw`V_{Rd,s} = \frac{A_{sw}}{s} z f_{ywd} \cot\theta`}
                description="Avec réduction β des charges proches"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`\beta`, meaning: 'Facteur de proximité', value: res.v_left.toFixed(1) },
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort réduit', value: res.v_right.toFixed(1) },
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
              <li className={res.ratio_v <= 1.0 ? 'text-green-600' : 'text-red-600'}>
                {res.ratio_v <= 1.0 ? '✓' : '✗'} VEd/VRd,c = {(res.ratio_v * 100).toFixed(0)}%
              </li>
              <li className="text-slate-500">• V.gauche = {res.v_left.toFixed(1)}kN</li>
              <li className="text-slate-500">• V.droit = {res.v_right.toFixed(1)}kN</li>
              <li className="text-slate-500">• V,max = {res.v_max.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,c = {res.v_rdc.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,max = {res.v_rdc_max.toFixed(1)}kN</li>
              <li className="text-slate-500">• VRd,s = {res.v_rds.toFixed(1)}kN</li>
              <li className="text-slate-500">• Asw/s = {(res.asw_s * 10000).toFixed(2)}cm²/m</li>
              <li className="text-slate-500">• z = {res.z.toFixed(0)}mm</li>
              <li className="text-slate-500">• cot θ = {res.cot_theta.toFixed(2)}</li>
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
