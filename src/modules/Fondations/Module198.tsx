import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas, DimensionLine } from '../../components/drafting';
import { AncrageCrochetMandrinInputs, AncrageCrochetMandrinOutput } from '../../types/engineering';

export default function Module198() {
  const [inp, setInp] = useState<AncrageCrochetMandrinInputs>({
    phi: 20, FEd: 120, fck: 30, gc: 1.5, eta1: 1.0, a: 150, t: 300, c: 30, c1: 30, sc: 0,
    mandrels: [64, 80, 96, 112, 128, 160, 192, 224, 288, 352, 480],
  });
  const [txt, setTxt] = useState({ mandrels: '64, 80, 96, 112, 128, 160, 192, 224, 288, 352, 480' });

  const parseList = (s: string) => s.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const parsed = parseList(txt.mandrels);
  const payload: AncrageCrochetMandrinInputs = {
    ...inp, mandrels: parsed.length > 0 ? parsed : inp.mandrels,
  };
  const { data: res, error: err, live } = useModuleCalc<AncrageCrochetMandrinInputs, AncrageCrochetMandrinOutput>(
    'calculate_ancrage_crochet_mandrin_198', payload,
  );
  const S = (k: keyof AncrageCrochetMandrinInputs) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const status = !res ? 'computing' : res.needs_hook ? 'warn' : verdictStatus(res.verdict);

  const slider = (
    key: keyof AncrageCrochetMandrinInputs, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key] as number} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="198 Ancrage Crochet Mandrin"
      subtitle="Ancrage EC2 §8.4 — crochet + diamètre mandrin (portance dans la courbure) — RUST"
      eurocode="EC2 §8.4"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Barre & effort</div>
          {slider('phi', 'φ (barre)', 'mm', 6, 40, 1)}
          {slider('FEd', 'FEd', 'kN', 0, 500, 5)}
          {slider('fck', 'fck', 'MPa', 12, 90, 1)}
          {slider('gc', 'γc', '', 1, 2, 0.05)}
          {slider('eta1', 'η1 (adhérence)', '', 0.5, 1.0, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Géométrie appui</div>
          {slider('a', 'a (espacement)', 'mm', 20, 500, 5)}
          {slider('t', 't (largeur appui)', 'mm', 100, 1000, 10)}
          {slider('c', 'c (enrobage)', 'mm', 10, 100, 5)}
          {slider('c1', 'c1', 'mm', 10, 100, 5)}
          {slider('sc', 'σc (pression transv.)', 'MPa', 0, 10, 0.5)}
          <div className="mb-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Mandrins normalisés (mm)</label>
            <input className="w-full border rounded px-3 py-2 text-sm dark:bg-white/5 dark:border-white/15 font-mono"
              value={txt.mandrels} onChange={e => setTxt({ ...txt, mandrels: e.target.value })} />
          </div>
          {err && <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>}
        </>
      }
      sketch={
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
          <SectionCanvas title="Schéma d'ancrage" vbW={600} vbH={180}>
            {res && (() => {
              const sc = 400 / Math.max(inp.t, res.Lbd, 1);
              const tW = inp.t * sc;
              const lbdW = Math.min(res.Lbd * sc, 560);
              return (
                <>
                  <rect x={20} y={20} width={tW} height={120} fill="#E2E8F0" stroke="#333" strokeWidth={1} />
                  <text x={20 + tW / 2} y={155} fontSize={9} fill="#333" textAnchor="middle">appui t={inp.t}</text>
                  <line x1={20 + tW} y1={60} x2={20 + tW + lbdW} y2={60} stroke="#6366F1" strokeWidth={4} />
                  <DimensionLine x1={20 + tW} y1={60} x2={20 + tW + lbdW} y2={60} offset={-20} text={`Lbd = ${res.Lbd.toFixed(0)}`} />
                  {res.needs_hook && (
                    <>
                      <circle cx={20 + tW - res.phim * sc / 2} cy={60 + res.phim * sc / 2} r={res.phim * sc / 2}
                        fill="none" stroke="#F59E0B" strokeWidth={3} />
                      <text x={20 + tW - res.phim * sc / 2} y={60 + res.phim * sc + 16} fontSize={9} fill="#F59E0B" textAnchor="middle">
                        φm={res.phim.toFixed(0)}
                      </text>
                    </>
                  )}
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
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">Lbd</div>
                  <div className="font-bold">{res.Lbd.toFixed(0)} mm</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">Lav</div>
                  <div className="font-bold">{res.Lav.toFixed(0)} mm</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">φ mandrin</div>
                  <div className="font-bold">{res.needs_hook ? `${res.phim.toFixed(0)} mm` : '—'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">μ / λ</div>
                  <div className="font-bold">{res.needs_hook ? `${res.mu.toFixed(0)} / ${res.Lam.toFixed(0)} mm` : '—'}</div>
                </div>
              </div>
              <FormulaCard
                title="Mandrin de cintrage (EC2 §8.3)"
                latex={String.raw`\phi_{m,min} = F_{bt}\left(\frac{1}{a_b} + \frac{1}{2\phi}\right)\frac{1}{f_{cd}}`}
                description="Portance dans la courbure + crochet"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`F_{bt}`, meaning: 'Effort ancré', value: inp.FEd, unit: 'kN' },
                  { symbol: String.raw`l_{bd}`, meaning: 'Longueur ancrage', value: res.Lbd.toFixed(0), unit: 'mm' },
                  { symbol: String.raw`\phi_m`, meaning: 'Diamètre mandrin', value: res.needs_hook ? res.phim.toFixed(0) : '—', unit: res.needs_hook ? 'mm' : '' },
                ]}
              />
              <div className={`p-2 rounded text-xs font-semibold ${res.needs_hook ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' : 'bg-green-50 dark:bg-emerald-900/20 text-green-800 dark:text-emerald-300'}`}>
                {res.verdict}
              </div>
              <ul className="text-xs space-y-1">
                {res.needs_hook && <li className="font-mono text-orange-600">ATTENTION : crochet requis — mandrin φ{res.phim.toFixed(0)}</li>}
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
