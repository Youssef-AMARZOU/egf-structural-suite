import { useState } from 'react';
import type { ContraintesSectionQqInputs, ContraintesSectionQqOutput } from '../../types/engineering';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import {
  SectionCanvas,
} from '../../components/drafting';

const DEFAULT: ContraintesSectionQqInputs = {
  fck: 30, fyk: 500, gs: 1.15, ec1: 2.0, ecu1: 3.5,
  ey: 200000, k: 1.15, euk: 10.0,
  n_layers: 2,
  widths_top: [300, 300],
  widths_bot: [300, 300],
  heights: [200, 400],
  n_steel: 2,
  steel_depths: [40, 560],
  steel_areas: [6.28, 6.28],
  n_ed: 500, m_ed: 80,
  itour: 15,
};


export default function Module126() {
  const [inp, setInp] = useState<ContraintesSectionQqInputs>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<ContraintesSectionQqInputs, ContraintesSectionQqOutput>(
    'calculate_contraintes_section_qq_126', inp,
  );
  const S = (k: keyof ContraintesSectionQqInputs) => (v: number) => setInp((p) => ({ ...p, [k]: v }));


  const totalH = inp.heights.reduce((a, b) => a + b, 0);
  const maxW = Math.max(...inp.widths_top, ...inp.widths_bot);

  const status = !res ? 'computing' : verdictStatus(res.verdict);

  const slider = (
    key: keyof ContraintesSectionQqInputs, label: string, unit: string,
    min: number, max: number, step = 1,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="126 Contraintes Section QQ"
      subtitle="M-N — section quelconque, Simpson"
      status={status}
      live={live}
      params={
        <>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Matériaux</div>
        <div className="grid grid-cols-3 gap-2">
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gs', 'γs', '-', 1, 1.5, 0.05)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slider('ec1', 'εc1', '‰', 1, 4, 0.1)}
          {slider('ecu1', 'εcu1', '‰', 2, 5, 0.1)}
          {slider('euk', 'euk', '‰', 5, 20, 0.5)}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Section (couches)</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n_layers', 'n couches', '-', 1, 6, 1)}
          <ParamSlider label="h total" unit="mm" value={totalH} min={0} max={0} step={0} onChange={() => {}} />
        </div>
        {Array.from({ length: inp.n_layers }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-x-3 gap-y-1">
            <ParamSlider label={`b sup ${i + 1}`} unit="mm" value={inp.widths_top[i] || 0} min={50} max={2000} step={10} onChange={(v) => {
              const w = [...inp.widths_top]; w[i] = v; setInp((p) => ({ ...p, widths_top: w }));
            }} />
            <ParamSlider label={`b inf ${i + 1}`} unit="mm" value={inp.widths_bot[i] || 0} min={50} max={2000} step={10} onChange={(v) => {
              const w = [...inp.widths_bot]; w[i] = v; setInp((p) => ({ ...p, widths_bot: w }));
            }} />
            <ParamSlider label={`h ${i + 1}`} unit="mm" value={inp.heights[i] || 0} min={50} max={2000} step={10} onChange={(v) => {
              const h = [...inp.heights]; h[i] = v; setInp((p) => ({ ...p, heights: h }));
            }} />
          </div>
        ))}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Aciers</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n_steel', 'n aciers', '-', 1, 10, 1)}
        </div>
        {Array.from({ length: inp.n_steel }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-x-3 gap-y-1">
            <ParamSlider label={`prof ${i + 1}`} unit="mm" value={inp.steel_depths[i] || 0} min={0} max={3000} step={10} onChange={(v) => {
              const d = [...inp.steel_depths]; d[i] = v; setInp((p) => ({ ...p, steel_depths: d }));
            }} />
            <ParamSlider label={`A ${i + 1}`} unit="cm²" value={inp.steel_areas[i] || 0} min={0} max={100} step={0.5} onChange={(v) => {
              const a = [...inp.steel_areas]; a[i] = v; setInp((p) => ({ ...p, steel_areas: a }));
            }} />
          </div>
        ))}
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sollicitations</div>
        <div className="grid grid-cols-2 gap-2">
          {slider('n_ed', 'NEd', 'kN', -5000, 5000, 10)}
          {slider('m_ed', 'MEd', 'kN·m', 0, 2000, 5)}
        </div>
        {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
<SectionCanvas title="Section (SVG)" vbW={300} vbH={200}>
            {(() => {
              const ox = 150, oy = 20;
              const sc = Math.min(120 / totalH, 250 / maxW);
              let y = oy;
              return (
                <g>
                  {inp.heights.map((h, i) => {
                    const wTop = inp.widths_top[i] * sc;
                    const wBot = inp.widths_bot[i] * sc;
                    const hh = h * sc;
                    const yStart = y;
                    y += hh;
                    const pts = `${ox - wTop / 2},${yStart} ${ox + wTop / 2},${yStart} ${ox + wBot / 2},${y} ${ox - wBot / 2},${y}`;
                    return <polygon key={i} points={pts} fill={i % 2 === 0 ? '#e2e8f0' : '#cbd5e1'} stroke="#64748b" strokeWidth={0.5} />;
                  })}
                  {inp.steel_depths.slice(0, inp.n_steel).map((d, i) => {
                    const yS = oy + d * sc;
                    return <circle key={i} cx={ox} cy={yS} r={3} fill="#2563eb" />;
                  })}
                  {res && (
                    <>
                      <line x1={ox - maxW * sc / 2 - 10} y1={oy + res.x_neutral * sc} x2={ox + maxW * sc / 2 + 10} y2={oy + res.x_neutral * sc} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,2" />
                      <text x={ox + maxW * sc / 2 + 15} y={oy + res.x_neutral * sc + 3} fontSize={7} fill="#ef4444">x₀={res.x_neutral.toFixed(0)}</text>
                    </>
                  )}
                  <text x={ox} y={y + 15} textAnchor="middle" fontSize={7} fill="#64748b">H={totalH}mm</text>
                  {res && <text x={ox} y={y + 25} textAnchor="middle" fontSize={8} fill="#2563eb" fontWeight="bold">NRd={res.n_rd.toFixed(0)}kN MRd={res.m_rd.toFixed(0)}kN·m</text>}
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
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <h2 className="text-sm font-bold mb-2">Résultats</h2>
          {res && (
            <div className="font-mono text-xs space-y-1">
              <div>NRd = <b>{res.n_rd.toFixed(1)}</b> kN | MRd = <b>{res.m_rd.toFixed(1)}</b> kN·m</div>
              <div>ε1 = <b>{res.e1.toFixed(2)}</b> ‰ | ε2 = <b>{res.e2.toFixed(2)}</b> ‰</div>
              <div>x₀ = <b>{res.x_neutral.toFixed(1)}</b> mm</div>
              <div>σs₁ = <b>{res.sigma_s1.toFixed(0)}</b> MPa | σs₂ = <b>{res.sigma_s2.toFixed(0)}</b> MPa</div>
              <div>σc sup = <b>{res.sigma_c_top.toFixed(1)}</b> MPa | σc inf = <b>{res.sigma_c_bot.toFixed(1)}</b> MPa</div>
              <hr className="border-slate-200 dark:border-white/10 my-2" />
              <div>ΔN = <b>{res.dn.toFixed(1)}</b> kN | ΔM = <b>{res.dm.toFixed(1)}</b> kN·m</div>
              <div>A = <b>{res.area.toFixed(0)}</b> mm² | y̅ = <b>{res.centroid.toFixed(1)}</b> mm</div>
              <div className="font-bold">{res.verdict}</div>
            </div>
          )}
        </div>
              <FormulaCard
                title="Section quelconque N-M"
                latex={String.raw`N = \int_A \sigma \, dA \quad M = \int_A \sigma y \, dA`}
                description="Intégration de Simpson, 3 lois béton"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                    { symbol: String.raw`N`, meaning: 'Effort normal', value: res.n_rd.toFixed(1) },
                    { symbol: String.raw`M`, meaning: 'Moment résultant', value: res.m_rd.toFixed(1) },
                ]}
              />
        <h2 className="text-sm font-bold mb-2">IA — Diagnostics</h2>
        {res ? (
          <ul className="text-xs space-y-2">
            <li className={res.dm >= 0 ? 'text-green-600' : 'text-red-600'}>
              {res.dm >= 0 ? `✓ ΔM = +${res.dm.toFixed(1)} kN·m` : `✗ ΔM = ${res.dm.toFixed(1)} kN·m — ne résiste pas`}
            </li>
            <li className={res.dn >= 0 ? 'text-green-600' : 'text-red-600'}>
              {res.dn >= 0 ? `✓ ΔN = +${res.dn.toFixed(1)} kN` : `✗ ΔN = ${res.dn.toFixed(1)} kN — ne résiste pas`}
            </li>
            <li className="text-slate-500">• ε1 = {res.e1.toFixed(2)}‰ | ε2 = {res.e2.toFixed(2)}‰</li>
            <li className="text-slate-500">• σs₁ = {res.sigma_s1.toFixed(0)} MPa | σs₂ = {res.sigma_s2.toFixed(0)} MPa</li>
            <li className="text-slate-500">• σc = {res.sigma_c_top.toFixed(1)} MPa</li>
          </ul>
        ) : <p className="text-xs text-slate-500">computing…</p>}
            </>
          ) : (
            <p className="text-xs text-slate-500">{err ?? 'computing…'}</p>
          )}
        </>
      }
    />
  );
}
