import React, { useState } from 'react';
import NumField from '../../components/NumField';
import { DalleRetraitFerraillageInputs, DalleRetraitFerraillageOutput } from '../../types/engineering';

const Module156: React.FC = () => {
  const [inputs, setInputs] = useState<DalleRetraitFerraillageInputs>({
    b: 1.0, h: 0.20, d: 0.17, dp: 0.03, fck: 30, fyk: 500, gc: 1.5, gs: 1.15,
    classe_ciment: '32.5N', rh: 50, t: 365, ts: 7, t0: 28, ec2_modulus: 33, m: 10, aci: 5.0, acs: 3.0,
  });
  const [result, setResult] = useState<DalleRetraitFerraillageOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const r = await (window as any).__TAURI__.invoke('calculate_dalle_retrait_ferraillage_156', { p: inputs });
      setResult(r);
    } catch (e: any) {
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Module 156 — Dalle avec retrait et ferraillage quantitatif</h1>
      <p className="text-sm text-gray-500 mb-6">EC2 §3.1.3–3.1.4 — Retrait, fluage, effort de constrainte, ferraillage ELS</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Géométrie dalle (pour 1 m de largeur)</legend>
          <NumField label="Largeur b" unit="m" value={inputs.b} onChange={v => setInputs({ ...inputs, b: v })} />
          <NumField label="Épaisseur h" unit="m" value={inputs.h} onChange={v => setInputs({ ...inputs, h: v })} />
          <NumField label="Profondeur utile d" unit="m" value={inputs.d} onChange={v => setInputs({ ...inputs, d: v })} />
          <NumField label="Enrobage inférieur dp" unit="m" value={inputs.dp} onChange={v => setInputs({ ...inputs, dp: v })} />
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Matériaux</legend>
          <NumField label="fck" unit="MPa" value={inputs.fck} onChange={v => setInputs({ ...inputs, fck: v })} />
          <NumField label="fyk" unit="MPa" value={inputs.fyk} onChange={v => setInputs({ ...inputs, fyk: v })} />
          <NumField label="γc" unit="" value={inputs.gc} onChange={v => setInputs({ ...inputs, gc: v })} />
          <NumField label="γs" unit="" value={inputs.gs} onChange={v => setInputs({ ...inputs, gs: v })} />
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe ciment</label>
            <select value={inputs.classe_ciment} onChange={e => setInputs({ ...inputs, classe_ciment: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="32.5N">32.5N (S)</option>
              <option value="32.5R">32.5R (N)</option>
              <option value="42.5N">42.5N (N)</option>
              <option value="42.5R">42.5R (R)</option>
              <option value="52.5N">52.5N (R)</option>
              <option value="52.5R">52.5R (R)</option>
            </select>
          </div>
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Environnement et âges</legend>
          <NumField label="RH" unit="%" value={inputs.rh} onChange={v => setInputs({ ...inputs, rh: v })} />
          <NumField label="Âge total t" unit="j" value={inputs.t} onChange={v => setInputs({ ...inputs, t: v })} />
          <NumField label="Âge au démoulage ts" unit="j" value={inputs.ts} onChange={v => setInputs({ ...inputs, ts: v })} />
          <NumField label="Âge début fluage t0" unit="j" value={inputs.t0} onChange={v => setInputs({ ...inputs, t0: v })} />
          <NumField label="Module Ec2" unit="GPa" value={inputs.ec2_modulus} onChange={v => setInputs({ ...inputs, ec2_modulus: v })} />
        </fieldset>
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold text-blue-700">Sollicitations et ferraillage</legend>
          <NumField label="Moment M" unit="MN·m/m" value={inputs.m} onChange={v => setInputs({ ...inputs, m: v })} />
          <NumField label="Acier inf. Ai" unit="cm²/m" value={inputs.aci} onChange={v => setInputs({ ...inputs, aci: v })} />
          <NumField label="Acier sup. As" unit="cm²/m" value={inputs.acs} onChange={v => setInputs({ ...inputs, acs: v })} />
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
              { label: 'h0', value: (result.h0 * 1000).toFixed(0), unit: 'mm' },
              { label: 'kh', value: result.kh.toFixed(2), unit: '' },
              { label: 'εcd', value: (result.eps_cd * 1000).toFixed(4), unit: '‰' },
              { label: 'εca', value: (result.eps_ca * 1000).toFixed(4), unit: '‰' },
              { label: 'εcs', value: (result.eps_cs * 1000).toFixed(4), unit: '‰' },
              { label: 'φ(t,t0)', value: result.phi.toFixed(2), unit: '' },
              { label: 'N_restraint', value: result.n_restraint.toFixed(3), unit: 'MN' },
              { label: 'x', value: (result.x * 1000).toFixed(1), unit: 'mm' },
              { label: 'σc', value: result.sc.toFixed(2), unit: 'MPa' },
              { label: 'σs', value: result.ss.toFixed(2), unit: 'MPa' },
              { label: 'Ai nec', value: result.aci_nec.toFixed(2), unit: 'cm²/m' },
              { label: 'ε_def', value: (result.ec_def * 1000).toFixed(4), unit: '‰' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 border rounded p-2 text-center">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-lg font-bold">{item.value} <span className="text-xs text-gray-400">{item.unit}</span></div>
              </div>
            ))}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Décomposition retrait + fluage</h3>
            <svg viewBox="0 0 600 200" className="w-full">
              {(() => {
                const maxEps = result.eps_cs * 1000 || 1;
                const barH = 30;
                const cdW = Math.max(0, (result.eps_cd * 1000) / maxEps * 400);
                const caW = Math.max(0, (result.eps_ca * 1000) / maxEps * 400);
                const defW = Math.max(0, (result.ec_def * 1000) / maxEps * 400);
                return (
                  <>
                    <text x={10} y={30} fontSize={12} fill="#374151">εcd (séchage)</text>
                    <rect x={130} y={15} width={cdW} height={barH} fill="#3B82F6" rx={3} />
                    <text x={135 + cdW} y={35} fontSize={11}>{(result.eps_cd * 1000).toFixed(3)}‰</text>

                    <text x={10} y={80} fontSize={12} fill="#374151">εca (autogène)</text>
                    <rect x={130} y={65} width={caW} height={barH} fill="#10B981" rx={3} />
                    <text x={135 + caW} y={85} fontSize={11}>{(result.eps_ca * 1000).toFixed(3)}‰</text>

                    <text x={10} y={130} fontSize={12} fill="#374151">εcs (total)</text>
                    <rect x={130} y={115} width={cdW + caW} height={barH} fill="#6366F1" rx={3} />
                    <text x={135 + cdW + caW} y={135} fontSize={11}>{(result.eps_cs * 1000).toFixed(3)}‰</text>

                    <text x={10} y={180} fontSize={12} fill="#374151">ε_def (avec fluage)</text>
                    <rect x={130} y={165} width={defW} height={barH} fill="#F59E0B" rx={3} />
                    <text x={135 + defW} y={185} fontSize={11}>{(result.ec_def * 1000).toFixed(3)}‰</text>
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

export default Module156;
