import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, RebarGroup, DiagramOverlay } from '../../components/drafting';
import { FlexdevV3Inputs, FlexdevV3Output } from '../../types/engineering';

export default function Module162() {
  const [sectionStr, setSectionStr] = useState('-150,-250 150,-250 150,250 -150,250');
  const [steelStr, setSteelStr] = useState('-120,220,471 120,220,471 -120,-220,471 120,-220,471');
  const [inp, setInp] = useState<FlexdevV3Inputs>({
    section_points: [[-150, -250], [150, -250], [150, 250], [-150, 250]],
    steel_points: [[-120, 220, 471], [120, 220, 471], [-120, -220, 471], [120, -220, 471]],
    fck: 30, fyk: 500, gc: 1.5, gs: 1.15, concrete_model: 1,
    n_angle_steps: 12, n_strain_pts: 20,
  });

  const parsePoints = (str: string): [number, number][] => {
    return str.split(/\s+/).map(p => {
      const [x, y] = p.split(',').map(Number);
      return [x, y] as [number, number];
    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
  };
  const parseSteel = (str: string): [number, number, number][] => {
    return str.split(/\s+/).map(p => {
      const [x, y, a] = p.split(',').map(Number);
      return [x, y, a] as [number, number, number];
    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]) && !isNaN(p[2]));
  };

  const secParsed = parsePoints(sectionStr);
  const steelParsed = parseSteel(steelStr);
  const payload: FlexdevV3Inputs = {
    ...inp,
    section_points: secParsed.length > 0 ? secParsed : inp.section_points,
    steel_points: steelParsed.length > 0 ? steelParsed : inp.steel_points,
  };
  const { data: res, error: err, live } = useModuleCalc<FlexdevV3Inputs, FlexdevV3Output>(
    'calculate_flexdev_v3_162', payload,
  );
  const S = (k: keyof FlexdevV3Inputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof FlexdevV3Inputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  const svgScale = 0.25;
  const svgCx = 100;
  const svgCy = 100;
  const sectionPath = secParsed.map((p) => `${svgCx + p[0] * svgScale},${svgCy + p[1] * svgScale}`).join(' ');
  const steelBars = steelParsed.map((p) => ({
    x: svgCx + p[0] * svgScale,
    y: svgCy + p[1] * svgScale,
    phi: 2 * Math.sqrt(p[2] / Math.PI),
  }));
  const colors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'];

  return (
    <Workstation
      title="162 Flexdev v3"
      subtitle="Interaction N-M 2D — section polygonale libre (EC2/BAEL) — RUST"
      eurocode="EC2 §6.1"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie section (x,y séparés par espaces)</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Points du contour (x1,y1 x2,y2 ...)</label>
            <textarea value={sectionStr} onChange={e => setSectionStr(e.target.value)} rows={2}
              className="w-full border rounded px-2 py-1 text-sm font-mono dark:bg-white/5 dark:border-white/15" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Aciers (x,y,A en mm²)</div>
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Points aciers (x1,y1,A1 x2,y2,A2 ...)</label>
            <textarea value={steelStr} onChange={e => setSteelStr(e.target.value)} rows={2}
              className="w-full border rounded px-2 py-1 text-sm font-mono dark:bg-white/5 dark:border-white/15" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Matériaux</div>
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('gs', 'γs', '', 1, 2, 0.05)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Modèle béton</label>
            <select value={inp.concrete_model} onChange={e => setInp({ ...inp, concrete_model: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5 text-sm dark:bg-white/5 dark:border-white/15">
              <option value={1}>Parabole-Rectangle</option>
              <option value={2}>Sargin</option>
            </select>
          </div>
          {slider('n_angle_steps', 'Pas angles', '', 4, 36, 1)}
          {slider('n_strain_pts', 'Pas déform.', '', 5, 60, 1)}
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Section polygonale + lits" vbW={200} vbH={200}>
              <polygon points={sectionPath} fill="#e0e7ff" stroke="#6366F1" strokeWidth={2} />
              <RebarGroup bars={steelBars} pxPerMm={svgScale} />
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title={res ? `Diagrammes N-M (${res.angles.length} angles)` : 'Diagrammes N-M'} vbW={500} vbH={300}>
              {res && (() => {
                const w = 400, h = 250, ox = 250, oy = 20;
                const scaleN = h / Math.max(Math.abs(res.n_max_global), 1);
                const scaleM = w / 2 / Math.max(res.m_max_global, 1);
                return (
                  <>
                    <line x1={ox} y1={oy} x2={ox} y2={oy + h} stroke="#ddd" />
                    <line x1={ox - w / 2} y1={oy + h} x2={ox + w / 2} y2={oy + h} stroke="#ddd" />
                    {res.interaction_curves.map((curve, ci) => {
                      const pts: [number, number][] = curve.map(([n, m]) => (
                        [ox + m * scaleM, oy + (res.n_max_global - n) * scaleN] as [number, number]
                      ));
                      return <DiagramOverlay key={ci} type="moment" points={pts} color={colors[ci % colors.length]} strokeWidth={1.5} />;
                    })}
                    <text x={ox + 5} y={oy + 10} fontSize={9} fill="#999">{res.n_max_global.toFixed(0)} kN</text>
                    <text x={ox + 5} y={oy + h - 5} fontSize={9} fill="#999">{(res.interaction_curves[0]?.[0]?.[0] ?? 0).toFixed(0)} kN</text>
                    <text x={ox + w / 2 - 10} y={oy + h + 15} fontSize={9} fill="#999">M (kN·m)</text>
                  </>
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
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  ['Ac', `${res.area.toFixed(0)} mm²`],
                  ['y̅', `(${res.centroid[0].toFixed(1)}, ${res.centroid[1].toFixed(1)}) mm`],
                  ['N_max', `${res.n_max_global.toFixed(0)} kN`],
                  ['M_max', `${res.m_max_global.toFixed(1)} kN·m`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Polygone 2D (Sutherland)"
                latex={String.raw`N = \sum \sigma_i A_i \quad M = \sum \sigma_i A_i y_i`}
                description="Écrêtage polygonal multi-angles"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`N_{max}`, meaning: 'Effort normal max', value: res.n_max_global.toFixed(0), unit: 'kN' },
                  { symbol: String.raw`M_{max}`, meaning: 'Moment max', value: res.m_max_global.toFixed(1), unit: 'kN·m' },
                  { symbol: String.raw`A_c`, meaning: 'Section béton', value: res.area.toFixed(0), unit: 'mm²' },
                ]}
              />
              <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-semibold">
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
