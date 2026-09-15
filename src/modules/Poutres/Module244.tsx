import { useState } from 'react';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { FrameSolver, FrameMomentsTable, frameTextField, parseFramePayload, parsePairs } from './Module243';
import type { FrameText } from './Module243';
import { PortiqueCrossInputs, PortiqueCrossOutput } from '../../types/engineering';

const DEFAULT_TEXT: FrameText = {
  nodes: '0:0, 6:0, 0:3, 6:3',
  members: '1:3:30000:0, 2:4:30000:0, 3:4:25000:25',
  supports: '1, 2',
};

export default function Module244() {
  const [text, setText] = useState<FrameText>(DEFAULT_TEXT);
  const payload: PortiqueCrossInputs = parseFramePayload(text);
  const { data: res, error: err, live } = useModuleCalc<PortiqueCrossInputs, PortiqueCrossOutput>(
    'calculate_portique_cross_244', payload,
  );

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  const nNodes = parsePairs(text.nodes)[0].length;

  return (
    <Workstation
      title="244 Portique : méthode de Cross"
      subtitle="Distribution itérative (report 1/2) — nœuds déplaçables bloqués — RUST"
      eurocode="RDM · Cross"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
            Données (x:y / n1:n2:EI:w)
          </div>
          {frameTextField(text, setText, 'nodes', 'Nœuds x:y (m)', '0:0, 6:0, 0:3, 6:3')}
          {frameTextField(text, setText, 'members', 'Barres n1:n2:EI:w', '1:3:30000:0, ...')}
          {frameTextField(text, setText, 'supports', 'Appuis fixes', '1, 2')}
          <p className="text-[11px] text-slate-500 mt-1">{nNodes} nœuds lus — calcul live.</p>
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <FrameSolver text={text} result={res} />
        </div>
      }
      results={
        <>
          {res ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['M max', `${res.m_max.toFixed(1)} kN·m`],
                  ['Cycles', `${res.cycles}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-300 font-mono text-xs">
                Cross : {res.cycles} cycles — résidu {Number(res.residu).toExponential(1)}
              </div>
              <FrameMomentsTable result={res} />
              <FormulaCard
                title="Cross itératif"
                latex={String.raw`M_{dist} = DF \cdot \Delta M \quad M_{rep} = M/2`}
                description="Répartition + report moitié"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`DF`, meaning: 'Distribution', value: res.cycles, unit: 'cycles' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.m_max.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`r`, meaning: 'Résidu', value: Number(res.residu).toExponential(1) },
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
