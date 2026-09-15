import { useState } from 'react';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';
import { CaracGeoInputs, CaracGeoOutput } from '../../types/engineering';

export default function Module232() {
  const [text, setText] = useState({
    rects: '0, 0, 300, 500', holes: '', circs: '', choles: '',
  });

  const parseList = (s: string) =>
    s.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
  const payload: CaracGeoInputs = {
    rects: parseList(text.rects),
    rects_hole: parseList(text.holes),
    circs: parseList(text.circs),
    circs_hole: parseList(text.choles),
  };

  const { data: res, error: err, live } = useModuleCalc<CaracGeoInputs, CaracGeoOutput>(
    'calculate_carac_geo_232', payload,
  );

  const status = err ? 'fail' : !res ? 'computing' : verdictStatus(res.verdict);

  const field = (key: keyof typeof text, label: string, placeholder: string) => (
    <div className="mb-1">
      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input
        className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
        value={text[key]} onChange={(e) => setText({ ...text, [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

  // ---- section sketch (400x240 canvas): rectangles as x,y,b,h quads ----
  const sketch = (() => {
    const rects = payload.rects;
    const all: [number, number, number, number][] = [];
    for (let i = 0; i + 3 < rects.length + 1; i += 4) {
      all.push([rects[i], rects[i + 1], rects[i + 2], rects[i + 3]]);
    }
    const gx = res ? res.xg : 0, gy = res ? res.yg : 0;
    const xs = all.flatMap((r) => [r[0] - r[2] / 2, r[0] + r[2] / 2]);
    const ys = all.flatMap((r) => [r[1] - r[3] / 2, r[1] + r[3] / 2]);
    const x0 = Math.min(...xs, gx - 100), x1 = Math.max(...xs, gx + 100);
    const y0 = Math.min(...ys, gy - 100), y1 = Math.max(...ys, gy + 100);
    const X = (x: number) => 30 + ((x - x0) / (x1 - x0 || 1)) * 340;
    const Y = (y: number) => 20 + (1 - (y - y0) / (y1 - y0 || 1)) * 190;
    return { all, X, Y };
  })();

  return (
    <Workstation
      title="232 Caractéristiques géométriques"
      subtitle="Section composée (rectangles + disques, pleins / évidés) — A, G, Ix, Iy — RUST"
      eurocode="RDM · Huygens"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">
            Parties (unités cohérentes)
          </div>
          {field('rects', 'Rectangles x, y, b, h (×4)', '0, 0, 300, 500')}
          {field('holes', 'Évidements rect. (×4)', '')}
          {field('circs', 'Disques x, y, d (×3)', '')}
          {field('choles', 'Évidements circ. (×3)', '')}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Section + centroïde" vbW={400} vbH={240}>
            {sketch.all.map((r, i) => (
              <rect
                key={i}
                x={sketch.X(r[0] - r[2] / 2)} y={sketch.Y(r[1] + r[3] / 2)}
                width={Math.abs(sketch.X(r[0] + r[2] / 2) - sketch.X(r[0] - r[2] / 2))}
                height={Math.abs(sketch.Y(r[1] - r[3] / 2) - sketch.Y(r[1] + r[3] / 2))}
                fill="#BFDBFE" opacity={0.6} stroke="#1D4ED8" strokeWidth={2}
              />
            ))}
            {res && (
              <>
                <line x1={20} y1={sketch.Y(res.yg)} x2={380} y2={sketch.Y(res.yg)} stroke="#EF4444" strokeDasharray="5,3" />
                <line x1={sketch.X(res.xg)} y1={10} x2={sketch.X(res.xg)} y2={220} stroke="#EF4444" strokeDasharray="5,3" />
                <circle cx={sketch.X(res.xg)} cy={sketch.Y(res.yg)} r={5} fill="#EF4444" />
                <text x={sketch.X(res.xg) + 8} y={sketch.Y(res.yg) - 6} fontSize={10} fill="#EF4444">G</text>
              </>
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
                  ['A', res.aire.toFixed(1)],
                  ['G', `(${res.xg.toFixed(2)}, ${res.yg.toFixed(2)})`],
                  ['Ix', res.ix.toExponential(3)],
                  ['Iy', res.iy.toExponential(3)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-white/5 rounded p-2">
                    <div className="text-slate-500">{l}</div>
                    <div className="font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <FormulaCard
                title="Sections composées"
                latex={String.raw`I = I_G + A d^2`}
                description="Huygens, rectangles + disques"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`A`, meaning: 'Aire', value: res.aire.toFixed(1) },
                  { symbol: String.raw`G`, meaning: 'Centroïde', value: `(${res.xg.toFixed(1)}, ${res.yg.toFixed(1)})` },
                  { symbol: String.raw`I_x`, meaning: 'Inertie x', value: res.ix.toExponential(2) },
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
