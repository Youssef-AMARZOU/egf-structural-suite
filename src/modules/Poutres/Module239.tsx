import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { TreillisVerifInputs, TreillisVerifOutput } from '../../types/engineering';

export default function Module239() {
  const [inp, setInp] = useState<TreillisVerifInputs>({
    l: 18, z: 1.8, n_pan: 9, w: 15, fy: 275,
    chord_a: 3000, chord_i: 60, diag_a: 1200, diag_i: 40, vert_a: 1000, vert_i: 35,
  });
  const { data: res, error: err, live } = useModuleCalc<TreillisVerifInputs, TreillisVerifOutput>(
    'calculate_treillis_verif_239',
    { ...inp, n_pan: Math.round(inp.n_pan) },
  );
  const S = (k: keyof TreillisVerifInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const worst = res ? Math.max(res.ratio_chord, res.ratio_diag, res.ratio_vert) : 0;
  const status = err ? 'fail' : !res ? 'computing' : worst > 1 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof TreillisVerifInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  // ---- Pratt epure (400x160 canvas) ----
  const n = Math.max(Math.round(inp.n_pan), 2);
  const x0 = 30, W = 340, yT = 30, yB = 120;
  const X = (i: number) => x0 + (W * i) / n;

  return (
    <Workstation
      title="239 Treillis : vérification EC3"
      subtitle="Membrures (M/z), diagonales (V/sinθ), montants — traction + flambement χ — RUST"
      eurocode="EC3 §6.3"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Treillis & charge</div>
          {slider('l', 'Portée', 'm', 4, 60, 1)}
          {slider('z', 'Hauteur', 'm', 0.5, 6, 0.1)}
          {slider('n_pan', 'nb panneaux', '-', 2, 20, 1)}
          {slider('w', 'w', 'kN/m', 0, 100, 1)}
          {slider('fy', 'fy', 'MPa', 235, 460, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Barres (A en mm², i en mm)</div>
          {slider('chord_a', 'A membrure', 'mm²', 200, 20000, 100)}
          {slider('chord_i', 'i membrure', 'mm', 10, 200, 1)}
          {slider('diag_a', 'A diagonale', 'mm²', 100, 10000, 100)}
          {slider('diag_i', 'i diagonale', 'mm', 10, 200, 1)}
          {slider('vert_a', 'A montant', 'mm²', 100, 10000, 100)}
          {slider('vert_i', 'i montant', 'mm', 10, 200, 1)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title={`Épure Pratt (${Math.round(inp.n_pan)} panneaux)`} vbW={400} vbH={160}>
            <line
              x1={x0} y1={yT} x2={x0 + W} y2={yT}
              stroke={res && res.ratio_chord > 1 ? '#EF4444' : '#1D4ED8'} strokeWidth={5}
            />
            <line
              x1={x0} y1={yB} x2={x0 + W} y2={yB}
              stroke={res && res.ratio_chord > 1 ? '#EF4444' : '#22C55E'} strokeWidth={5}
            />
            {Array.from({ length: n + 1 }, (_, i) => (
              <line
                key={i} x1={X(i)} y1={yT} x2={X(i)} y2={yB}
                stroke={res && res.ratio_vert > 1 ? '#EF4444' : '#94A3B8'} strokeWidth={2}
              />
            ))}
            {Array.from({ length: n }, (_, i) => (
              <line
                key={`d${i}`} x1={X(i)} y1={yB} x2={X(i + 1)} y2={yT}
                stroke={res && res.ratio_diag > 1 ? '#EF4444' : '#F59E0B'} strokeWidth={2.5}
              />
            ))}
            {res && (
              <text x={200} y={150} fontSize={10} fill="#94a3b8" textAnchor="middle">
                N={res.n_chord.toFixed(0)} / D={res.n_diag.toFixed(0)} / V={res.n_vert.toFixed(0)} kN
              </text>
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
                  ['Membrure', `${(res.ratio_chord * 100).toFixed(0)} %`],
                  ['Diagonale', `${(res.ratio_diag * 100).toFixed(0)} %`],
                  ['Montant', `${(res.ratio_vert * 100).toFixed(0)} %`],
                  ['N membr.', `${res.n_chord.toFixed(0)} kN`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Treillis Pratt (EC3)"
                latex={String.raw`N_{b,Rd} = \chi A f_y/\gamma_{M1}`}
                description="Membrures + diagonales, courbe b"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\eta_{ch}`, meaning: 'Taux membrure', value: (res.ratio_chord * 100).toFixed(0), unit: '%' },
                  { symbol: String.raw`\eta_{dg}`, meaning: 'Taux diagonale', value: (res.ratio_diag * 100).toFixed(0), unit: '%' },
                  { symbol: String.raw`\chi`, meaning: 'Réduction flambement', value: res.chi_diag.toFixed(2) },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${status === 'fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'}`}>
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
