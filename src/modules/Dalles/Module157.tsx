import React, { useState } from 'react';
import NumField from '../../components/NumField';
import { DalleContinueFeuInputs, DalleContinueFeuOutput } from '../../types/engineering';

const Module157: React.FC = () => {
  const [inputs, setInputs] = useState<DalleContinueFeuInputs>({
    h: 0.20, d: 0.17, dp: 0.03, l: 5.0, n_spans: 3, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    q_g: 5.0, q_q: 3.0, gg: 1.35, gq: 1.5, psi: 0.6, r: 120, as_inf: 5.0, as_sup: 4.0,
  });
  const [result, setResult] = useState<DalleContinueFeuOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const r = await (window as any).__TAURI__.invoke('calculate_dalle_continue_feu_157', { p: inputs });
      setResult(r);
    } catch (e: any) {
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Module 157 — Dalle continue au feu</h1>
      <p className="text-sm text-gray-500 mb-6">EC2 §5.5 — Vérification au feu des dalles continues, ISO 834</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Géométrie</legend>
          <NumField label="Épaisseur h" unit="m" value={inputs.h} onChange={v => setInputs({ ...inputs, h: v })} />
          <NumField label="Profondeur utile d" unit="m" value={inputs.d} onChange={v => setInputs({ ...inputs, d: v })} />
          <NumField label="Enrobage sup. dp" unit="m" value={inputs.dp} onChange={v => setInputs({ ...inputs, dp: v })} />
          <NumField label="Portée L" unit="m" value={inputs.l} onChange={v => setInputs({ ...inputs, l: v })} />
          <NumField label="Nombre travées" unit="" value={inputs.n_spans} onChange={v => setInputs({ ...inputs, n_spans: Math.round(v) })} step={1} />
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Matériaux</legend>
          <NumField label="fck" unit="MPa" value={inputs.fck} onChange={v => setInputs({ ...inputs, fck: v })} />
          <NumField label="fyk" unit="MPa" value={inputs.fyk} onChange={v => setInputs({ ...inputs, fyk: v })} />
          <NumField label="γc" unit="" value={inputs.gc} onChange={v => setInputs({ ...inputs, gc: v })} />
          <NumField label="γs" unit="" value={inputs.gs} onChange={v => setInputs({ ...inputs, gs: v })} />
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Charges</legend>
          <NumField label="q_g" unit="kN/m²" value={inputs.q_g} onChange={v => setInputs({ ...inputs, q_g: v })} />
          <NumField label="q_q" unit="kN/m²" value={inputs.q_q} onChange={v => setInputs({ ...inputs, q_q: v })} />
          <NumField label="γG" unit="" value={inputs.gg} onChange={v => setInputs({ ...inputs, gg: v })} />
          <NumField label="γQ" unit="" value={inputs.gq} onChange={v => setInputs({ ...inputs, gq: v })} />
          <NumField label="ψ₂" unit="" value={inputs.psi} onChange={v => setInputs({ ...inputs, psi: v })} />
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Feu et ferraillage</legend>
          <NumField label="Résistance feu R" unit="min" value={inputs.r} onChange={v => setInputs({ ...inputs, r: v })} />
          <NumField label="As inf. fourni" unit="cm²/m" value={inputs.as_inf} onChange={v => setInputs({ ...inputs, as_inf: v })} />
          <NumField label="As sup. fourni" unit="cm²/m" value={inputs.as_sup} onChange={v => setInputs({ ...inputs, as_sup: v })} />
        </fieldset>
      </div>

      <button onClick={calculate} disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Calcul...' : 'Calculer'}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className={`p-3 rounded font-semibold ${result.verdict.startsWith('OK') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.verdict}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'θ_feu', value: result.theta_fire.toFixed(0), unit: '°C' },
              { label: 'θ_d', value: result.theta_d.toFixed(0), unit: '°C' },
              { label: 'θ_s', value: result.theta_s.toFixed(0), unit: '°C' },
              { label: 'k_c', value: result.k_concrete.toFixed(2), unit: '' },
              { label: 'k_s', value: result.ks_steel.toFixed(2), unit: '' },
              { label: 'k_t', value: result.k_tension.toFixed(2), unit: '' },
              { label: 'M_sup', value: result.m_support.toFixed(2), unit: 'kN·m/m' },
              { label: 'M_mid', value: result.m_midspan.toFixed(2), unit: 'kN·m/m' },
              { label: 'As_inf,fi', value: result.as_inf_fi.toFixed(2), unit: 'cm²/m' },
              { label: 'As_sup,fi', value: result.as_sup_fi.toFixed(2), unit: 'cm²/m' },
              { label: 'Ratio inf', value: (result.ratio_inf * 100).toFixed(0), unit: '%' },
              { label: 'Ratio sup', value: (result.ratio_sup * 100).toFixed(0), unit: '%' },
              { label: 'L_fi', value: result.l_fi.toFixed(2), unit: 'm' },
              { label: 'Es_r', value: result.es_reduction.toFixed(2), unit: '' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 border rounded p-2 text-center">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          {/* SVG: Temperature profile + reduction factors */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Profil de température ISO 834</h3>
            <svg viewBox="0 0 600 220" className="w-full">
              {(() => {
                const maxT = 1200;
                const maxD = inputs.h * 1000;
                const w = 400;
                const h = 180;
                // temperature profile
                const pts: string[] = [];
                for (let x = 0; x <= maxD; x += 2) {
                  const theta = 20 + (result.theta_fire - 20) * Math.exp(-0.005 * x);
                  const px = 100 + (x / maxD) * w;
                  const py = 10 + h - (theta / maxT) * h;
                  pts.push(`${px},${py}`);
                }
                const tempLine = pts.join(' ');
                // steel level line
                const steelX = 100 + (inputs.d * 1000 / maxD) * w;
                return (
                  <>
                    <text x={10} y={105} fontSize={11} fill="#374151" transform="rotate(-90,15,105)">θ (°C)</text>
                    <text x={300} y={215} fontSize={11} fill="#374151" textAnchor="middle">Profondeur x (mm)</text>
                    {/* axes */}
                    <line x1={100} y1={10} x2={100} y2={10 + h} stroke="#ccc" strokeWidth={1} />
                    <line x1={100} y1={10 + h} x2={100 + w} y2={10 + h} stroke="#ccc" strokeWidth={1} />
                    {/* temp curve */}
                    <polyline points={tempLine} fill="none" stroke="#EF4444" strokeWidth={2} />
                    {/* steel level */}
                    <line x1={steelX} y1={10} x2={steelX} y2={10 + h} stroke="#3B82F6" strokeWidth={1} strokeDasharray="4,4" />
                    <text x={steelX + 5} y={25} fontSize={10} fill="#3B82F6">d = {(inputs.d * 1000).toFixed(0)}mm</text>
                    <text x={steelX + 5} y={38} fontSize={10} fill="#EF4444">θ_s = {result.theta_s.toFixed(0)}°C</text>
                    {/* temp scale */}
                    {[0, 200, 400, 600, 800, 1000, 1200].map((t, i) => (
                      <g key={i}>
                        <line x1={95} y1={10 + h - (t / maxT) * h} x2={100} y2={10 + h - (t / maxT) * h} stroke="#ccc" />
                        <text x={90} y={14 + h - (t / maxT) * h} fontSize={9} fill="#999" textAnchor="end">{t}</text>
                      </g>
                    ))}
                    {/* depth scale */}
                    {[0, 50, 100, 150, 200].map((d, i) => (
                      <g key={i}>
                        <line x1={100 + (d / maxD) * w} y1={10 + h} x2={100 + (d / maxD) * w} y2={10 + h + 5} stroke="#ccc" />
                        <text x={100 + (d / maxD) * w} y={10 + h + 18} fontSize={9} fill="#999" textAnchor="middle">{d}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {result.diag.length > 0 && (
            <div className="bg-gray-50 border rounded p-3 text-sm font-mono space-y-1">
              {result.diag.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Module157;
