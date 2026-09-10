import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { RetraitGeneV2Ph2Inputs, RetraitGeneV2Ph2Output } from '../../types/engineering';

export default function Module172() {
  const [inp, setInp] = useState<RetraitGeneV2Ph2Inputs>({
    n_sections: 3, lengths: [2, 2, 2], heights: [300, 300, 300], widths: [200, 200, 200],
    E: 30000, er: 0.0003, tete: 0.5,
  });
  const { data: res, error: err, live } = useModuleCalc<RetraitGeneV2Ph2Inputs, RetraitGeneV2Ph2Output>(
    'calculate_retrait_gene_v2_ph_2_172', inp,
  );
  const S = (k: keyof RetraitGeneV2Ph2Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const updateArr = (field: 'lengths' | 'heights' | 'widths', i: number, v: number) => {
    const arr = [...inp[field]];
    arr[i] = v;
    setInp({ ...inp, [field]: arr });
  };

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof RetraitGeneV2Ph2Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="172 Retrait gene v2 ph 2"
      subtitle="Forces de retenue du retrait — solveur Gauss — RUST"
      eurocode="EC2 §3.1.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Paramètres</div>
          {slider('E', 'E', 'MPa', 10000, 60000, 1000)}
          {slider('er', 'er (retrait)', '', 0, 0.001, 0.00005)}
          {slider('tete', 'tête (0=art, 1=enc)', '', 0, 1, 0.1)}
          <ParamSlider label="n_sections" unit="" value={inp.n_sections} min={1} max={10} step={1} onChange={v => {
            const n = Math.max(1, Math.min(10, Math.round(v)));
            const l = Array(n).fill(inp.lengths[0] || 2);
            const h = Array(n).fill(inp.heights[0] || 300);
            const w = Array(n).fill(inp.widths[0] || 200);
            setInp({ ...inp, n_sections: n, lengths: l, heights: h, widths: w });
          }} />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sections</div>
          {Array.from({ length: inp.n_sections }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-500">Section {i + 1}</span>
              <ParamSlider label="L" unit="m" value={inp.lengths[i]} min={0.5} max={10} step={0.5} onChange={v => updateArr('lengths', i, v)} />
              <ParamSlider label="h" unit="mm" value={inp.heights[i]} min={100} max={1000} step={10} onChange={v => updateArr('heights', i, v)} />
              <ParamSlider label="b" unit="mm" value={inp.widths[i]} min={100} max={1000} step={10} onChange={v => updateArr('widths', i, v)} />
            </div>
          ))}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Forces de retenue" vbW={500} vbH={120}>
            {res && (() => {
              const ox = 50, oy = 30, w = 400, h = 60;
              const maxF = res.max_force || 1;
              const sc = h / maxF;
              const n = res.forces.length;
              const barW = w / n - 4;
              return (
                <>
                  {res.forces.map((f, i) => {
                    const x = ox + i * (barW + 4) + 2;
                    const bh = Math.abs(f) * sc;
                    const y = f >= 0 ? oy + h - bh : oy + h;
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={barW} height={bh} fill="#6366F1" rx={2} />
                        <text x={x + barW / 2} y={oy + h + 12} fontSize={8} fill="#666" textAnchor="middle">S{i + 1}</text>
                        <text x={x + barW / 2} y={f >= 0 ? y - 3 : y + bh + 10} fontSize={8} fill="#333" textAnchor="middle">
                          {f.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
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
                  ['F_max', `${res.max_force.toFixed(2)} kN`],
                  ['M_max', `${res.max_moment.toFixed(2)} kN·m`],
                  ['δ_max', `${res.max_deflection.toFixed(2)} mm`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Retrait gêné (forces)"
                latex={String.raw`\sigma = R \, E_{c,eff} \, \varepsilon_{cs}`}
                description="Matrice de raideur, Gauss + Simpson"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`F_{max}`, meaning: 'Force de retenue max', value: res.max_force.toFixed(2), unit: 'kN' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.max_moment.toFixed(2), unit: 'kN·m' },
                  { symbol: String.raw`\varepsilon_{cs}`, meaning: 'Retrait', value: inp.er },
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
