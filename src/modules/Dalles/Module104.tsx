import { useState } from 'react';
import type { Punching104Inputs, Punching104Output } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { StatTile } from '../../components/common/StatTile';
import { DiagList, type DiagItem } from '../../components/common/DiagList';
import { RatioBar } from '../../components/common/RatioBar';
import {
  SectionCanvas, DimensionLine,
} from '../../components/drafting';

const DEF: Punching104Inputs = {
  fck: 25, fyk: 500, gc: 1.5,
  c1: 0.8, c2: 0.4, h: 0.2, d: 0.17,
  asx: 7, asy: 7, ved: 0.9641, beta: 1.15, sigcp: 0,
};


export default function Module104() {
  const [inp, setInp] = useState<Punching104Inputs>(DEF);
  const { data: res, error: err, live } = useModuleCalc<Punching104Inputs, Punching104Output>(
    'calculate_punching_104', inp,
  );

  const S = (k: keyof Punching104Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));


  const status = !res ? 'computing' : res.ratio0 <= 1 && res.ratio1 <= 1 ? 'pass' : 'fail';

  const slider = (
    key: keyof Punching104Inputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const diags: DiagItem[] = res ? [
    {
      severity: res.ratio0 <= 1 ? 'ok' : 'fail',
      message: res.ratio0 <= 1
        ? "Pas d'écrasement au nu du poteau (vEd,0 ≤ vRd,max)."
        : 'Écrasement au nu : chapiteau obligatoire, les armatures seules ne suffisent pas.',
    },
    {
      severity: res.ratio1 <= 1 ? 'ok' : res.ratio1 <= 1.5 ? 'warn' : 'fail',
      message: res.ratio1 <= 1
        ? `Vérifié sans armatures de poinçonnement (ρl = ${(res.rhol * 100).toFixed(3)} %).`
        : res.ratio1 <= 1.5
          ? `Armer : épingles, 1er cours à 0,5d, espacement ≤ 0,6d, Asw = ${res.asw_req.toFixed(1)} cm²/m.`
          : 'Ratio très élevé : préférer un chapiteau ou augmenter h.',
    },
    ...(res.chap_c1 ? [{
      severity: 'warn' as const,
      message: `Chapiteau estimé : ${res.chap_c1.toFixed(2)} × ${res.chap_c2?.toFixed(2)} m.`,
    }] : []),
    {
      severity: 'info',
      message: `Arrêter les armatures au-delà de uout = ${res.uout.toFixed(2)} m.`,
    },
    {
      severity: 'info',
      message: `k = ${res.k.toFixed(3)} · ρl = ${(res.rhol * 100).toFixed(3)} % · vmin = ${res.vmin.toFixed(4)} MPa.`,
    },
  ] : [];

  return (
    <Workstation
      title="104 Poinçonnement"
      subtitle="D'après EGF N°104 © Henry Thonier"
      eurocode="EC2 §6.4"
      category="Dalles"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Poteau et dalle</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('c1', 'c1 (≥ c2)', 'm', 0.1, 3, 0.05)}
          {slider('c2', 'c2', 'm', 0.1, 3, 0.05)}
          {slider('h', 'h', 'm', 0.1, 1, 0.01)}
          {slider('d', 'd', 'm', 0.05, 1, 0.01)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Matériaux</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('asx', 'Asx total', 'cm²', 0, 200, 0.5)}
          {slider('asy', 'Asy total', 'cm²', 0, 200, 0.5)}
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-1">Chargement</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {slider('ved', 'VEd', 'MN', 0, 10, 0.01)}
          {slider('beta', 'β', '–', 1, 1.6, 0.01)}
        </div>

        {slider('sigcp', 'σcp', 'MPa', 0, 5, 0.1)}

        {err && (
          <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
            {err}
          </p>
        )}
        </>
      }
      sketch={
        <>
        <div className="glass rounded-2xl p-5">
          <div className="text-[15px] font-semibold mb-2">Ratios de vérification</div>
          {res ? (
            <RatioBar
              items={[
                { name: 'vEd,0 / vRd,max', value: res.ratio0, formula: 'écrasement au nu' },
                { name: 'vEd / vRd,c', value: res.ratio1, formula: 'périmètre u1' },
              ]}
            />
          ) : (
            <div className="skel rounded-lg" style={{ height: 220 }} />
          )}
          {res && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatTile label="vEd,0" value={res.ved0.toFixed(3)} unit="MPa" tone={res.ratio0 <= 1 ? 'pass' : 'fail'} />
              <StatTile label="vRd,max" value={res.vrdmax.toFixed(3)} unit="MPa" />
              <StatTile label="vEd" value={res.ved.toFixed(3)} unit="MPa" tone={res.ratio1 <= 1 ? 'pass' : 'fail'} />
              <StatTile label="vRd,c" value={res.vrdc.toFixed(3)} unit="MPa" />
              <StatTile label="Asw req" value={res.asw_req.toFixed(1)} unit="cm²/m" />
              <StatTile label="Épingles" value={`${res.nr}×${res.nt}=${res.total_pins}`} />
              <StatTile label="u0" value={res.u0.toFixed(2)} unit="m" />
              <StatTile label="u1" value={res.u1.toFixed(2)} unit="m" />
              <StatTile label="uout" value={res.uout.toFixed(2)} unit="m" />
            </div>
          )}
        </div>
        <div className="glass rounded-2xl p-5">
          <SectionCanvas title="Plan — périmètres de contrôle" vbW={340} vbH={260} scaleLabel="u0 au nu · u1 à 2d · uout">
            {(() => {
              const cx = 165;
              const cy = 112;
              const eo0 = res?.rout ?? 1;
              // fit column + 2d ring with margins; uout arc may clip (value in stats)
              const s = Math.max(
                14,
                Math.min(
                  90,
                  200 / Math.max(0.25, inp.c1 + 4 * inp.d),
                  120 / Math.max(0.25, inp.c2 + 4 * inp.d),
                ),
              );
              const w = inp.c1 * s;
              const hh = inp.c2 * s;
              const e1 = 2 * inp.d * s;
              const eo = eo0 * s;
              const ux1 = cx + w / 2 + e1;
              const uy1 = cy - hh / 2 - e1;
              const u1tx = Math.min(ux1 + 6, 294);
              // uout callout clamped inside the frame along the 45° ray
              const ex = Math.min(cx + eo * 0.7071, 312);
              const ey = Math.min(cy + eo * 0.7071, 228);
              const outx = Math.min(ex + 6, 292);
              const dimY = cy + hh / 2 + e1 + 18;
              const dimX = cx - w / 2 - e1 - 18;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={eo} fill="none" stroke="#34D399" strokeDasharray="4 3" strokeWidth={1.4} />
                  <rect
                    x={cx - w / 2 - e1} y={cy - hh / 2 - e1}
                    width={w + 2 * e1} height={hh + 2 * e1}
                    fill="none" stroke="#F5A524" strokeDasharray="6 3" strokeWidth={1.6}
                  />
                  <rect
                    x={cx - w / 2} y={cy - hh / 2}
                    width={w} height={hh}
                    fill="#4C8DFF" opacity={0.85}
                  />
                  {w > 70 && hh > 26 && (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="bold">
                      {inp.c1.toFixed(2)}×{inp.c2.toFixed(2)}
                    </text>
                  )}
                  <DimensionLine x1={cx - w / 2} y1={dimY - e1 - 18} x2={cx + w / 2} y2={dimY - e1 - 18} offset={e1 + 18} text={`c1 = ${inp.c1.toFixed(2)} m`} />
                  <DimensionLine x1={dimX + e1 + 18} y1={cy - hh / 2} x2={dimX + e1 + 18} y2={cy + hh / 2} offset={e1 + 18} vertical text={`c2 = ${inp.c2.toFixed(2)} m`} />
                  <line x1={ux1} y1={uy1} x2={u1tx} y2={uy1 - 12} stroke="#F5A524" strokeWidth={1} />
                  <text x={u1tx + 3} y={uy1 - 10} fontSize={9} fill="#F5A524">u1</text>
                  <line x1={ex} y1={ey} x2={outx} y2={Math.min(ey + 14, 240)} stroke="#34D399" strokeWidth={1} />
                  <text x={outx + 3} y={Math.min(ey + 18, 244)} fontSize={9} fill="#34D399">uout</text>
                  <text x={cx + w / 2 + 5} y={cy - hh / 2 - 4} fontSize={9} fill="#4C8DFF" fontWeight="bold">u0</text>
                  <g>
                    <rect x={8} y={8} width={126} height={54} rx={6} fill="rgba(10,14,26,0.66)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
                    <g fontSize={8} fill="#93A0B8">
                      <rect x={16} y={19} width={10} height={3} fill="#4C8DFF" />
                      <text x={30} y={23}>u0 nu poteau</text>
                      <rect x={16} y={33} width={10} height={3} fill="#F5A524" />
                      <text x={30} y={37}>u1 à 2d</text>
                      <rect x={16} y={47} width={10} height={3} fill="#34D399" />
                      <text x={30} y={51}>uout</text>
                    </g>
                  </g>
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
              <StatTile label="Verdict global" value={res.verdict0 === 'OK' && res.verdict1 === 'OK' ? 'CONFORME' : 'NON CONFORME'} tone={status === 'pass' ? 'pass' : 'fail'} />
              <FormulaCard
                title="Poinçonnement rectangulaire (EC2 §6.4)"
                latex={String.raw`v_{Ed} = \frac{\beta V_{Ed}}{u_1 d} \le v_{Rd,c}`}
                description="Vérification au périmètre u1"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`V_{Ed}`, meaning: 'Effort de poinçonnement', value: inp.ved.toFixed(3), unit: 'MN' },
                    { symbol: String.raw`u_1`, meaning: 'Périmètre à 2d', value: res.u1.toFixed(2), unit: 'm' },
                    { symbol: String.raw`v_{Ed}`, meaning: 'Contrainte appliquée', value: res.ved.toFixed(3), unit: 'MPa' },
                    { symbol: String.raw`v_{Rd,c}`, meaning: 'Résistance béton', value: res.vrdc.toFixed(3), unit: 'MPa' },
                ]}
              />
              <DiagList items={diags} />
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
