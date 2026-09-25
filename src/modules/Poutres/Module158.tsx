import { useState, useMemo } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay, AxisTicks, InlineLegend } from '../../components/drafting';
import { FluageRetraitInputs, FluageRetraitOutput } from '../../types/engineering';

export default function Module158() {
  const [inp, setInp] = useState<FluageRetraitInputs>({
    b: 0.30, h: 0.60, fck: 30, t0: 28, t: 3650, rh: 50, classe_ciment: '32.5N',
  });
  const { data: res, error: err, live } = useModuleCalc<FluageRetraitInputs, FluageRetraitOutput>(
    'calculate_fluage_retrait_158', inp,
  );
  const S = (k: keyof FluageRetraitInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const creepPts: [number, number][] = useMemo(() => res ? (() => {
    const maxPhi = res.phi_0 * 1.2 || 1;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const frac = i / 40;
      const tLog = Math.pow(10, 1 + frac * 4);
      const betaCt = Math.pow((tLog - inp.t0) / (tLog - inp.t0 + res.bH), 0.3);
      pts.push([100 + frac * 400, 160 - ((res.phi_0 * betaCt) / maxPhi) * 150]);
    }
    return pts;
  })() : [], [res?.phi_0, res?.bH, inp.t0]);
  const maxPhi = res ? res.phi_0 * 1.2 || 1 : 1;
  const markerX = 100 + Math.max(0, Math.min(1, (Math.log10(inp.t) / Math.log10(100000) - 0.07) / 0.93)) * 400;

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FluageRetraitInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="158 Fluage et retrait"
      subtitle="EC2 §3.1.3 + Annex B — Coefficient de fluage φ(t,t0) et retrait εcs — RUST"
      eurocode="EC2 §3.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('b', 'Largeur b', 'm', 0.1, 1, 0.01)}
          {slider('h', 'Hauteur h', 'm', 0.1, 2, 0.01)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Classe ciment</label>
            <select value={inp.classe_ciment} onChange={e => setInp({ ...inp, classe_ciment: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15">
              <option value="32.5N">32.5N (S — lent)</option>
              <option value="32.5R">32.5R (N — normal)</option>
              <option value="42.5N">42.5N (N — normal)</option>
              <option value="42.5R">42.5R (R — rapide)</option>
              <option value="52.5N">52.5N (R — rapide)</option>
              <option value="52.5R">52.5R (R — rapide)</option>
            </select>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Environnement et âges</div>
          {slider('rh', 'RH', '%', 20, 100, 1)}
          {slider('t0', 't0 (début fluage)', 'j', 1, 365, 1)}
          {slider('t', 't (âge total)', 'j', 1, 10000, 10)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Évolution du fluage φ(t,t0)" vbW={600} vbH={200}>
            <text x={10} y={85} fontSize={11} fill="#374151" transform="rotate(-90,15,85)">φ(t,t0)</text>
            <text x={300} y={195} fontSize={11} fill="#374151" textAnchor="middle">Temps t (jours, échelle log)</text>
            <line x1={100} y1={10} x2={100} y2={160} stroke="#ccc" />
            <line x1={100} y1={160} x2={500} y2={160} stroke="#ccc" />
            {res && (
              <>
                <DiagramOverlay type="deflection" points={creepPts} color="#6366F1" />
                <AxisTicks
                  origin={[100, 160]} end={[500, 160]}
                  values={[10, 100, 1000, 10000, 100000]}
                  map={(v) => [100 + (Math.log10(v) - 1) / 4 * 400, 160]}
                  unit="j" side="below" decimals={0}
                />
                <AxisTicks
                  origin={[100, 10]} end={[100, 160]}
                  values={[0, 0.5, 1, 1.5]}
                  map={(v) => [100, 160 - (v / maxPhi) * 150]}
                  side="left" decimals={1}
                />
                <InlineLegend items={[{ label: 'φ(t,t₀)', color: '#6366F1' }]} x={110} y={15} />
                <line x1={100} y1={160 - (res.phi_0 / maxPhi) * 150} x2={500} y2={160 - (res.phi_0 / maxPhi) * 150} stroke="#EF4444" strokeDasharray="4,4" strokeWidth={1} />
                <text x={105} y={160 - (res.phi_0 / maxPhi) * 150 - 5} fontSize={10} fill="#EF4444">φ₀ = {res.phi_0.toFixed(2)}</text>
                <circle cx={markerX} cy={160 - (res.phi_t / maxPhi) * 150} r={5} fill="#10B981" />
                <text x={markerX + 8} y={160 - (res.phi_t / maxPhi) * 150 + 4} fontSize={10} fill="#10B981">
                  φ = {res.phi_t.toFixed(2)} @ t = {inp.t}j
                </text>
              </>
            )}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['φ₀', res.phi_0.toFixed(2)],
                  ['φ(t,t0)', res.phi_t.toFixed(2)],
                  ['h0', `${res.h0.toFixed(0)} mm`],
                  ['kh', res.kh.toFixed(2)],
                  ['Ecm', `${res.ecm.toFixed(1)} GPa`],
                  ['Ec', `${res.ec.toFixed(1)} GPa`],
                  ['εcd', `${(res.eps_cd * 1000).toFixed(4)} ‰`],
                  ['εca', `${(res.eps_ca * 1000).toFixed(4)} ‰`],
                  ['εcs', `${(res.eps_cs * 1000).toFixed(4)} ‰`],
                  ['β(t,t0)', res.bct_t0.toFixed(3)],
                  ['bH', `${res.bH.toFixed(0)} mm`],
                  ['β_fcm', res.bfcm.toFixed(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Fluage-retrait (EC2 §3.1)"
                latex={String.raw`\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0) \quad \varepsilon_{cs} = \varepsilon_{cd} + \varepsilon_{ca}`}
                description="Annexe B, classes de ciment"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varphi`, meaning: 'Fluage', value: res.phi_t.toFixed(2) },
                  { symbol: String.raw`\varepsilon_{cs}`, meaning: 'Retrait total', value: (res.eps_cs * 1000).toFixed(4), unit: '‰' },
                  { symbol: String.raw`h_0`, meaning: 'Rayon moyen', value: res.h0.toFixed(0), unit: 'mm' },
                ]}
              />
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {res.diag.map((d: string, i: number) => (
                  <li key={i} className="font-mono text-slate-600 dark:text-slate-400">{d}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
