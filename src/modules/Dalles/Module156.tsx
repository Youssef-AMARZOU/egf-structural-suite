import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { DalleRetraitFerraillageInputs, DalleRetraitFerraillageOutput } from '../../types/engineering';

export default function Module156() {
  const [inp, setInp] = useState<DalleRetraitFerraillageInputs>({
    b: 1.0, h: 0.20, d: 0.17, dp: 0.03, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    classe_ciment: '32.5N', rh: 50, t: 365, ts: 7, t0: 28, ec2_modulus: 33, m: 10, aci: 5.0, acs: 3.0,
  });
  const { data: res, error: err, live } = useModuleCalc<DalleRetraitFerraillageInputs, DalleRetraitFerraillageOutput>(
    'calculate_dalle_retrait_ferraillage_156', inp,
  );
  const S = (k: keyof DalleRetraitFerraillageInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof DalleRetraitFerraillageInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="156 Dalle avec retrait et ferraillage quantitatif"
      subtitle="EC2 §3.1.3–3.1.4 — Retrait, fluage, effort de constrainte, ferraillage ELS — RUST"
      eurocode="EC2 §3.1.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie dalle (pour 1 m de largeur)</div>
          {slider('b', 'Largeur b', 'm', 0.2, 3, 0.05)}
          {slider('h', 'Épaisseur h', 'm', 0.05, 1, 0.01)}
          {slider('d', 'Profondeur utile d', 'm', 0.05, 1, 0.01)}
          {slider('dp', 'Enrobage inférieur dp', 'm', 0.01, 0.2, 0.005)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Classe ciment</label>
            <select value={inp.classe_ciment} onChange={e => setInp({ ...inp, classe_ciment: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15">
              <option value="32.5N">32.5N (S)</option>
              <option value="32.5R">32.5R (N)</option>
              <option value="42.5N">42.5N (N)</option>
              <option value="42.5R">42.5R (R)</option>
              <option value="52.5N">52.5N (R)</option>
              <option value="52.5R">52.5R (R)</option>
            </select>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Environnement et âges</div>
          {slider('rh', 'RH', '%', 20, 100, 1)}
          {slider('t', 'Âge total t', 'j', 1, 1000, 5)}
          {slider('ts', 'Âge au démoulage ts', 'j', 1, 100, 1)}
          {slider('t0', 'Âge début fluage t0', 'j', 1, 365, 1)}
          {slider('ec2_modulus', 'Module Ec2', 'GPa', 10, 50, 0.5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitations et ferraillage</div>
          {slider('m', 'Moment M', 'MN·m/m', 0, 30, 0.5)}
          {slider('aci', 'Acier inf. Ai', 'cm²/m', 0, 50, 0.1)}
          {slider('acs', 'Acier sup. As', 'cm²/m', 0, 50, 0.1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Décomposition retrait + fluage" vbW={600} vbH={200}>
            {res && (() => {
              const maxEps = res.eps_cs * 1000 || 1;
              const barH = 30;
              const cdW = Math.max(0, (res.eps_cd * 1000) / maxEps * 400);
              const caW = Math.max(0, (res.eps_ca * 1000) / maxEps * 400);
              const defW = Math.max(0, (res.ec_def * 1000) / maxEps * 400);
              return (
                <>
                  <text x={10} y={30} fontSize={12} fill="#374151">εcd (séchage)</text>
                  <rect x={130} y={15} width={cdW} height={barH} fill="#3B82F6" rx={3} />
                  <text x={135 + cdW} y={35} fontSize={11}>{(res.eps_cd * 1000).toFixed(3)}‰</text>
                  <text x={10} y={80} fontSize={12} fill="#374151">εca (autogène)</text>
                  <rect x={130} y={65} width={caW} height={barH} fill="#10B981" rx={3} />
                  <text x={135 + caW} y={85} fontSize={11}>{(res.eps_ca * 1000).toFixed(3)}‰</text>
                  <text x={10} y={130} fontSize={12} fill="#374151">εcs (total)</text>
                  <rect x={130} y={115} width={cdW + caW} height={barH} fill="#6366F1" rx={3} />
                  <text x={135 + cdW + caW} y={135} fontSize={11}>{(res.eps_cs * 1000).toFixed(3)}‰</text>
                  <text x={10} y={180} fontSize={12} fill="#374151">ε_def (avec fluage)</text>
                  <rect x={130} y={165} width={defW} height={barH} fill="#F59E0B" rx={3} />
                  <text x={135 + defW} y={185} fontSize={11}>{(res.ec_def * 1000).toFixed(3)}‰</text>
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
                  ['h0', `${(res.h0 * 1000).toFixed(0)} mm`],
                  ['kh', res.kh.toFixed(2)],
                  ['εcd', `${(res.eps_cd * 1000).toFixed(4)} ‰`],
                  ['εca', `${(res.eps_ca * 1000).toFixed(4)} ‰`],
                  ['εcs', `${(res.eps_cs * 1000).toFixed(4)} ‰`],
                  ['φ(t,t0)', res.phi.toFixed(2)],
                  ['N_restraint', `${res.n_restraint.toFixed(3)} MN`],
                  ['x', `${(res.x * 1000).toFixed(1)} mm`],
                  ['σc', `${res.sc.toFixed(2)} MPa`],
                  ['σs', `${res.ss.toFixed(2)} MPa`],
                  ['Ai nec', `${res.aci_nec.toFixed(2)} cm²/m`],
                  ['ε_def', `${(res.ec_def * 1000).toFixed(4)} ‰`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Retrait gêné (EC2 §7.3.2)"
                latex={String.raw`A_{s,min} = k_c k f_{ct,eff} \frac{A_{ct}}{\sigma_s}`}
                description="Maîtrise de la fissuration"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\varepsilon_{cs}`, meaning: 'Retrait total', value: (res.eps_cs * 1000).toFixed(4), unit: '‰' },
                  { symbol: String.raw`\varphi`, meaning: 'Fluage', value: res.phi.toFixed(2) },
                  { symbol: String.raw`A_{i,nec}`, meaning: 'Acier requis', value: res.aci_nec.toFixed(2), unit: 'cm²/m' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.verdict.startsWith('OK') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
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
