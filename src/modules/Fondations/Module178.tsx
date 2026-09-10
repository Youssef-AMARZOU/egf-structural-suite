import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DiagramOverlay } from '../../components/drafting';
import { PoteauPieuV3Inputs, PoteauPieuV3Output } from '../../types/engineering';

export default function Module178() {
  const [inp, setInp] = useState<PoteauPieuV3Inputs>({
    diam: 600, fck: 30, t0a: 7, T: 20, RH: 60, classe: '32.5R', code: 2,
  });
  const { data: res, error: err, live } = useModuleCalc<PoteauPieuV3Inputs, PoteauPieuV3Output>(
    'calculate_poteau_pieu_v3_178', inp,
  );
  const S = (k: keyof PoteauPieuV3Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof PoteauPieuV3Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 60, oy = 10, w = 400, h = 80;
  const creepPts: [number, number][] = res ? (() => {
    const phiMax = Math.max(res.phi_inf, res.phi_t_t0, 1);
    const sc = h / phiMax;
    return [
      [ox, oy + h],
      [ox + w * 0.2, oy + h - res.phi_t_t0 * sc * 0.7],
      [ox + w * 0.5, oy + h - res.phi_t_t0 * sc * 0.9],
      [ox + w, oy + h - res.phi_t_t0 * sc],
    ] as [number, number][];
  })() : [];

  return (
    <Workstation
      title="178 Poteau Pieu V3"
      subtitle="Fluage EC2 pour pieux — coefficient φ(t,t0) — RUST"
      eurocode="EC2 §3.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie & Matériaux</div>
          {slider('diam', 'Diamètre pieu', 'mm', 200, 1500, 50)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Classe ciment</label>
            <select className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15"
              value={inp.classe} onChange={e => setInp({ ...inp, classe: e.target.value })}>
              <option value="32.5N">32.5N</option>
              <option value="32.5R">32.5R</option>
              <option value="42.5N">42.5N</option>
              <option value="42.5R">42.5R</option>
            </select>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Conditions</div>
          {slider('t0a', 't0 (âge au chargement)', 'j', 1, 365, 1)}
          {slider('T', 'T (température)', '°C', -10, 40, 1)}
          {slider('RH', 'RH (humidité)', '%', 20, 100, 5)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Sortie</label>
            <select className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15"
              value={inp.code} onChange={e => setInp({ ...inp, code: parseInt(e.target.value) })}>
              <option value={1}>φ∞ (fluage final)</option>
              <option value={2}>φ(t,t0)</option>
              <option value={3}>t0 ajusté</option>
            </select>
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Évolution φ(t,t0)" vbW={500} vbH={120}>
            <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#333" strokeWidth={1} />
            <line x1={ox} y1={oy + h} x2={ox + w} y2={oy + h} stroke="#333" strokeWidth={1} />
            <text x={ox - 5} y={oy + 5} fontSize={8} fill="#666" textAnchor="end">φ</text>
            <text x={ox + w / 2} y={oy + h + 15} fontSize={8} fill="#666" textAnchor="middle">t (jours)</text>
            {res && (() => {
              const phiMax = Math.max(res.phi_inf, res.phi_t_t0, 1);
              const sc = h / phiMax;
              return (
                <>
                  <line x1={ox} y1={oy + h - res.phi_inf * sc} x2={ox + w} y2={oy + h - res.phi_inf * sc}
                    stroke="#22C55E" strokeWidth={1} strokeDasharray="4,3" />
                  <text x={ox + w + 5} y={oy + h - res.phi_inf * sc + 3} fontSize={7} fill="#22C55E">φ∞</text>
                  <DiagramOverlay type="deflection" points={creepPts} color="#6366F1" />
                  <circle cx={ox + w * 0.1} cy={oy + h} r={3} fill="#EF4444" />
                  <text x={ox + w * 0.1} y={oy + h + 12} fontSize={7} fill="#EF4444" textAnchor="middle">t0={inp.t0a}j</text>
                </>
              );
            })()}
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['φ∞', res.phi_inf.toFixed(3)],
                  ['φ(t,t0)', res.phi_t_t0.toFixed(3)],
                  ['t0 ajusté', `${res.t0_adj.toFixed(2)} j`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Fluage pieu-poteau"
                latex={String.raw`\varphi(t,t_0) = \varphi_0 \beta_c(t,t_0)`}
                description="4 classes de ciment"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varphi`, meaning: 'Fluage', value: res.phi_t_t0.toFixed(3) },
                  { symbol: String.raw`t_0`, meaning: 'Âge de chargement', value: res.t0_adj.toFixed(2), unit: 'j' },
                  { symbol: String.raw`\varphi_\infty`, meaning: 'Fluage final', value: res.phi_inf.toFixed(3) },
                ]}
              />
              <div className="p-2 rounded bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300 text-xs font-semibold">
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
