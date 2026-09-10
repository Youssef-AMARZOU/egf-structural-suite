import { useState } from 'react';
import type { MandrinRenardInputs, MandrinRenardOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';

const DEFAULT_SERIES = [64, 80, 96, 112, 128, 160, 192, 224, 288, 352, 480, 560];

export default function Module106() {
  const [phi, setPhi] = useState(140);
  const [seriesText, setSeriesText] = useState(DEFAULT_SERIES.join(', '));

  const parseList = (s: string) =>
    s.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
  const series = parseList(seriesText);
  const inp: MandrinRenardInputs = { phi, series };

  const { data: res, error: err, live } = useModuleCalc<MandrinRenardInputs, MandrinRenardOutput>(
    'calculate_mandrin_renard_106', inp,
  );

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  return (
    <Workstation
      title="Module 106 — Mandrin Renard"
      subtitle="Arrondi au mandrin normalisé supérieur (série Renard)"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Demande</div>
          <ParamSlider label="φ requis" unit="mm" value={phi} min={10} max={1000} step={5} onChange={setPhi} />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Série normalisée</div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Valeurs (mm, virgule)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-white/5 border-slate-300 dark:border-white/15 font-mono"
            value={seriesText}
            onChange={(e) => setSeriesText(e.target.value)}
          />
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Série</h2>
          <div className="flex flex-wrap gap-2">
            {series.map((v, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-sm font-mono border ${res && Math.abs(v - res.mandrel) < 1e-9 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-slate-300'}`}
              >
                {v.toFixed(0)}
              </span>
            ))}
          </div>
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['φ requis', `${phi.toFixed(0)} mm`],
                  ['Mandrin', `${res.mandrel.toFixed(0)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Mandrin normalisé (Renard)"
                latex={String.raw`\phi_m = \min \{ d \in S \;|\; d > \phi \}`}
                description="Arrondi au diamètre normalisé supérieur"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\phi`, meaning: 'Diamètre requis’, value: phi.toFixed(0), unit: ’mm' },
                  { symbol: String.raw`\phi_m`, meaning: 'Mandrin retenu’, value: res.mandrel.toFixed(0), unit: ’mm' },
                ]}
              />
              <div className="p-2 rounded bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300 text-xs font-semibold">
                {res.verdict}
              </div>
              {res.diag.length > 0 && (
                <ul className="text-xs space-y-1">
                  {res.diag.map((line, i) => (
                    <li key={i} className="font-mono text-slate-600 dark:text-slate-400">{line}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
