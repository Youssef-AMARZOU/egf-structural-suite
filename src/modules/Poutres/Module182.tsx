import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine, RebarGroup } from '../../components/drafting';
import { EviterRotuleEnTraveeXInputs, EviterRotuleEnTraveeXOutput } from '../../types/engineering';

export default function Module182() {
  const [inp, setInp] = useState<EviterRotuleEnTraveeXInputs>({
    es: 0.002, Ac: 400, fyd: 434.8, ks: 1.0, euk: 0.025,
    b: 200, d: 450, fcd: 17.0, ecu2: 0.0035, ec2: 0.002,
  });
  const { data: res, error: err, live } = useModuleCalc<EviterRotuleEnTraveeXInputs, EviterRotuleEnTraveeXOutput>(
    'calculate_eviter_rotule_en_travee_x_182', inp,
  );
  const S = (k: keyof EviterRotuleEnTraveeXInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof EviterRotuleEnTraveeXInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const ox = 50, oy = 10, sw = 80, sh = 140;
  const ySc = sh / inp.d;
  const phiBar = 2 * Math.sqrt(Math.max(0, inp.Ac) / Math.PI);

  return (
    <Workstation
      title="182 Éviter Rotule en Travée X"
      subtitle="Recherche MRd par itération diagramme P-R — RUST"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation</div>
          {slider('es', 'εs (déformation acier)', '', 0, 0.01, 0.0001)}
          {slider('Ac', 'Ac (section acier)', 'mm²', 0, 2000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('b', 'b (largeur)', 'mm', 100, 1000, 10)}
          {slider('d', 'd (hauteur utile)', 'mm', 100, 1000, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Acier</div>
          {slider('fyd', 'fyd', 'MPa', 300, 600, 5)}
          {slider('ks', 'ks', '', 0.5, 1.5, 0.05)}
          {slider('euk', 'εuk', '', 0.005, 0.05, 0.001)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Béton</div>
          {slider('fcd', 'fcd', 'MPa', 5, 40, 0.5)}
          {slider('ec2', 'εc2', '', 0.001, 0.003, 0.0001)}
          {slider('ecu2', 'εcu2', '', 0.002, 0.005, 0.0001)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section & diagramme contraintes" vbW={500} vbH={180}>
            <rect x={ox + 100} y={oy} width={sw} height={sh} fill="none" stroke="#64748B" strokeWidth={1} />
            {res && (() => {
              const neutralY = oy + res.y * ySc;
              return (
                <>
                  <line x1={ox + 100} y1={neutralY} x2={ox + 100 + sw} y2={neutralY}
                    stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,2" />
                  <text x={ox + 100 + sw + 5} y={neutralY + 3} fontSize={8} fill="#EF4444">NA</text>
                  <RebarGroup bars={[{ x: ox + 100 + sw / 2, y: oy + sh - 5, phi: phiBar }]} pxPerMm={ySc} />
                  <text x={ox + 100 + sw / 2} y={oy + sh + 12} fontSize={7} fill="#6366F1" textAnchor="middle">Ac={inp.Ac}</text>
                  <rect x={ox} y={oy} width={50} height={res.y * ySc} fill="#6366F1" opacity={0.3} />
                  <text x={ox + 25} y={oy + res.y * ySc / 2} fontSize={7} fill="#CBD5E1" textAnchor="middle">
                    Fc={res.Fc.toFixed(0)} kN
                  </text>
                  <text x={ox + 140 + sw / 2} y={oy + sh + 25} fontSize={8} fill="#6366F1" textAnchor="middle">
                    Fs={res.Fs.toFixed(0)} kN
                  </text>
                </>
              );
            })()}
            <DimensionLine x1={ox + 100 + sw + 15} y1={oy} x2={ox + 100 + sw + 15} y2={oy + sh} offset={10} text={`d = ${inp.d} mm`} />
          </SectionCanvas>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['MRd', `${res.MRd.toFixed(1)} kN·m`],
                  ['y', `${res.y.toFixed(1)} mm`],
                  ['z', `${res.z.toFixed(1)} mm`],
                  ['εc', res.ec.toFixed(5)],
                  ['Fc', `${res.Fc.toFixed(0)} kN`],
                  ['Fs', `${res.Fs.toFixed(0)} kN`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="MRd par itération P-R"
                latex={String.raw`N_c = F_s \;\Rightarrow\; M_{Rd} = F_c z`}
                description="Recherche de l'axe neutre"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`F_c`, meaning: 'Compression béton', value: res.Fc.toFixed(0), unit: 'kN' },
                  { symbol: String.raw`z`, meaning: 'Bras de levier', value: res.z.toFixed(1), unit: 'mm' },
                  { symbol: String.raw`M_{Rd}`, meaning: 'Moment résistant', value: res.MRd.toFixed(1), unit: 'kN·m' },
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
