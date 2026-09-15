import { useState } from 'react';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import {
  PortiqueNoeudsFixesInputs, PortiqueNoeudsFixesOutput, PortiqueCrossOutput,
} from '../../types/engineering';

export interface FrameText {
  nodes: string;
  members: string;
  supports: string;
}

const DEFAULT_TEXT: FrameText = {
  nodes: '0:0, 6:0, 0:3, 6:3',
  members: '1:3:30000:0, 2:4:30000:0, 3:4:25000:25',
  supports: '1, 2',
};

export function parsePairs(s: string): [number[], number[]] {
  const a: number[] = [], b: number[] = [];
  s.split(',').map((t) => t.trim()).filter((t) => t.length > 0).forEach((t) => {
    const [x, y] = t.split(':').map((v) => parseFloat(v));
    if (!isNaN(x) && !isNaN(y)) { a.push(x); b.push(y); }
  });
  return [a, b];
}

/** Text lists → exact backend payload (shape NEVER changes). Shared by 243 & 244. */
export function parseFramePayload(text: FrameText): PortiqueNoeudsFixesInputs {
  const [nodes_x, nodes_y] = parsePairs(text.nodes);
  const mem_n1: number[] = [], mem_n2: number[] = [], mem_ei: number[] = [], mem_w: number[] = [];
  text.members.split(',').map((t) => t.trim()).filter((t) => t.length > 0).forEach((t) => {
    const q = t.split(':').map((v) => parseFloat(v));
    if (q.length >= 4 && q.every((v) => !isNaN(v))) {
      mem_n1.push(Math.round(q[0])); mem_n2.push(Math.round(q[1])); mem_ei.push(q[2]); mem_w.push(q[3]);
    }
  });
  const supports = text.supports.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
  return { nodes_x, nodes_y, mem_n1, mem_n2, mem_ei, mem_w, supports };
}

export function parseFrameMembers(text: FrameText): [number, number][] {
  const mems: [number, number][] = [];
  text.members.split(',').map((t) => t.trim()).filter((t) => t.length > 0).forEach((t) => {
    const q = t.split(':').map((v) => parseInt(v, 10));
    if (q.length >= 2 && !isNaN(q[0]) && !isNaN(q[1])) mems.push([q[0] - 1, q[1] - 1]);
  });
  return mems;
}

export const frameTextField = (
  text: FrameText,
  setText: (t: FrameText) => void,
  key: keyof FrameText,
  label: string,
  placeholder: string,
) => (
  <div className="mb-1">
    <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
    <input
      className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
      value={text[key]} onChange={(e) => setText({ ...text, [key]: e.target.value })}
      placeholder={placeholder}
    />
  </div>
);

type FrameResult = PortiqueNoeudsFixesOutput | PortiqueCrossOutput;

/** Shared epure: frame members + node ids + end-moment labels. Kept intact for Module244. */
export function FrameSolver({ text, result }: {
  text: FrameText;
  result: FrameResult | null;
}) {
  const [nx, ny] = parsePairs(text.nodes);
  if (nx.length === 0) {
    return <p className="text-xs text-slate-500">Saisissez au moins un nœud (format x:y).</p>;
  }
  const x0 = Math.min(...nx), x1 = Math.max(...nx, x0 + 1e-9);
  const y0 = Math.min(...ny), y1 = Math.max(...ny, y0 + 1e-9);
  const X = (x: number) => 40 + ((x - x0) / (x1 - x0)) * 320;
  const Y = (y: number) => 30 + (1 - (y - y0) / (y1 - y0)) * 190;
  const mems = parseFrameMembers(text);
  return (
    <SectionCanvas title="Épure du portique" vbW={400} vbH={260}>
      {mems.map(([a, b], i) => (
        nx[a] !== undefined && ny[a] !== undefined && nx[b] !== undefined && ny[b] !== undefined ? (
          <g key={i}>
            <line x1={X(nx[a])} y1={Y(ny[a])} x2={X(nx[b])} y2={Y(ny[b])} stroke="#1D4ED8" strokeWidth={4} />
            {result && result.mem_m1[i] !== undefined && (
              <text
                x={(X(nx[a]) + X(nx[b])) / 2} y={(Y(ny[a]) + Y(ny[b])) / 2 - 6}
                fontSize={9} fill="#B91C1C" textAnchor="middle"
              >
                {result.mem_m1[i].toFixed(0)}|{result.mem_m2[i].toFixed(0)}
              </text>
            )}
          </g>
        ) : null
      ))}
      {nx.map((x, i) => (
        <g key={i}>
          <circle cx={X(x)} cy={Y(ny[i])} r={5} fill="#CBD5E1" />
          <text x={X(x) + 7} y={Y(ny[i])} fontSize={9} fill="#94a3b8">{i + 1}</text>
        </g>
      ))}
    </SectionCanvas>
  );
}

export function FrameMomentsTable({ result }: { result: FrameResult }) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded p-3 overflow-x-auto">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        Moments d'extrémité (kN·m)
      </div>
      <table className="text-xs font-mono w-full">
        <thead><tr className="text-slate-500"><th className="text-left">Barre</th><th>M1</th><th>M2</th></tr></thead>
        <tbody>
          {result.mem_m1.map((m, i) => (
            <tr key={i} className="border-t border-slate-200 dark:border-white/10">
              <td>{i + 1}</td><td>{m.toFixed(1)}</td><td>{result.mem_m2[i].toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Module243() {
  const [text, setText] = useState<FrameText>(DEFAULT_TEXT);
  const payload = parseFramePayload(text);
  const { data: res, error: err, live } = useModuleCalc<PortiqueNoeudsFixesInputs, PortiqueNoeudsFixesOutput>(
    'calculate_portique_noeuds_fixes_243', payload,
  );

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);
  const nNodes = parsePairs(text.nodes)[0].length;

  return (
    <Workstation
      title="243 Portique nœuds fixes (rotations)"
      subtitle="Slope-deflection sans déplacement — résolution directe K·θ=−FEM — RUST"
      eurocode="RDM · slope-deflection"
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
                  ['Barres', `${res.mem_m1.length}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FrameMomentsTable result={res} />
              <FormulaCard
                title="Rotations (nœuds fixes)"
                latex={String.raw`M_n = \frac{2EI}{L}(2\theta_n + \theta_f) + M_{FEM}`}
                description="Slope-deflection, Gauss"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`\theta`, meaning: 'Rotations', value: res.thetas.length, unit: 'ddl' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.m_max.toFixed(1), unit: 'kN·m' },
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
