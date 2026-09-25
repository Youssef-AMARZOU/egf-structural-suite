import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { RatioGauge } from '../../components/common/RatioGauge';
import { PoteauLambdaminInputs, PoteauLambdaminOutput } from '../../types/engineering';

export default function Module169() {
  const [inp, setInp] = useState<PoteauLambdaminInputs>({
    h: 300, L0: 3.0, N_ed: 500, fck: 30, d_mod: 300,
  });
  const { data: res, error: err, live } = useModuleCalc<PoteauLambdaminInputs, PoteauLambdaminOutput>(
    'calculate_poteau_lambdamin_169', inp,
  );
  const S = (k: keyof PoteauLambdaminInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = err ? 'fail' : !res ? 'computing' : res.is_second_order_x || res.is_second_order_y ? 'warn' : 'pass';

  const slider = (
    key: keyof PoteauLambdaminInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="169 Poteau lambdamin"
      subtitle="Vérification slenderness minimale (EC2 §5.8.3.1) — RUST"
      eurocode="EC2 §5.8.3.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie</div>
          {slider('h', 'Hauteur h', 'mm', 100, 800, 10)}
          {slider('L0', 'Longueur libre L0', 'm', 0.5, 12, 0.1)}
          {slider('d_mod', 'Hauteur modifiée d_mod', 'mm', 100, 800, 10)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux & Charges</div>
          {slider('N_ed', 'N_ed', 'kN', 0, 5000, 50)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="glass rounded-2xl p-5">
          <div className="text-[15px] font-semibold mb-4">Élancement contre limite</div>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1 text-center">Axe X</div>
                  <RatioGauge eta={res.lambda_min_x > 0 ? res.lambda_x / res.lambda_min_x : 0} size={140} />
                  <div className="text-center mt-1">
                    <span className="font-mono text-[13px]">{res.lambda_x.toFixed(1)}</span>
                    <span className="text-slate-500 text-[11px]"> / {res.lambda_min_x.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1 text-center">Axe Y</div>
                  <RatioGauge eta={res.lambda_min_y > 0 ? res.lambda_y / res.lambda_min_y : 0} size={140} />
                  <div className="text-center mt-1">
                    <span className="font-mono text-[13px]">{res.lambda_y.toFixed(1)}</span>
                    <span className="text-slate-500 text-[11px]"> / {res.lambda_min_y.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-center text-slate-400 mt-2">
                λ / λ<sub>min</sub> — seuil second ordre = 1.0
              </div>
            </>
          ) : (
            <div className="skel rounded-lg" style={{ height: 200 }} />
          )}
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['λ', res.lambda_x.toFixed(1)],
                  ['λ_min', res.lambda_min_x.toFixed(1)],
                  ['2e ordre X', res.is_second_order_x ? 'Oui' : 'Non'],
                  ['2e ordre Y', res.is_second_order_y ? 'Oui' : 'Non'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Élancement mini poteau"
                latex={String.raw`\lambda_{lim} = \frac{20ABC}{\sqrt{n}}`}
                description="EC2 §5.8.3.1"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\lambda`, meaning: 'Élancement', value: res.lambda_x.toFixed(1) },
                  { symbol: String.raw`\lambda_{lim}`, meaning: 'Élancement limite', value: res.lambda_min_x.toFixed(1) },
                  { symbol: String.raw`n`, meaning: 'Effort réduit', value: inp.N_ed, unit: 'kN' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${!res.is_second_order_x ? 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {(res.is_second_order_x || res.is_second_order_y) && (
                  <li className="font-mono text-amber-600">ATTENTION : effets du second ordre à prendre en compte</li>
                )}
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
