import { useState } from 'react';
import { ParamSlider } from '../../components/common/ParamSlider';
import { useModuleCalc } from '../../components/common/useModuleCalc';
import { Workstation, verdictStatus } from '../../components/common/Workstation';
import { FormulaCard } from '../../components/common/FormulaCard';
import { SectionCanvas } from '../../components/drafting';

interface InputState {
  fck: number;
  fyk: number;
  gc: number;
  gs: number;
  b: number;
  bw: number;
  h: number;
  d: number;
  asw: number;
  s: number;
  rho_l: number;
  cot_theta: number;
  ned: number;
  ved: number;
}

const DEFAULT: InputState = {
  fck: 25.0,
  fyk: 500.0,
  gc: 1.5,
  gs: 1.15,
  b: 300.0,
  bw: 200.0,
  h: 500.0,
  d: 440.0,
  asw: 100.0,
  s: 200.0,
  rho_l: 0.01,
  cot_theta: 2.5,
  ned: 0.0,
  ved: 80.0,
};

interface Res155 {
  vrdc: number; vrds: number; vrd_max: number; vrd_bael: number;
  tau_ed: number; acw: number; verdict: string; governing: string;
  ratio_ec2: number; ratio_bael: number; diag: string[];
}

export default function Module155() {
  const [inp, setInp] = useState<InputState>(DEFAULT);
  const { data: res, error: err, live } = useModuleCalc<InputState, Res155>(
    'calculate_eff_tr_compar_ec2_bael_155', inp,
  );

  const S = (k: keyof InputState) => (v: number) =>
    setInp((p) => ({ ...p, [k]: v }));

  const maxVal = res ? Math.max(res.vrdc, res.vrds, res.vrd_max, res.vrd_bael, inp.ved) * 1.2 : 100;

  const status = !res ? 'computing'
    : res.ratio_ec2 > 1.0 || res.ratio_bael > 1.0 ? 'fail' : verdictStatus(res.verdict);

  const slider = (
    key: keyof InputState, label: string, unit: string,
    min: number, max: number, step: number,
  ) => (
    <ParamSlider label={label} unit={unit} value={inp[key]} min={min} max={max} step={step} onChange={S(key)} />
  );

  return (
    <Workstation
      title="155 Eff Tr compar EC2 BAEL"
      subtitle="D'après EGF N°155 © Henry Thonier — RUST"
      eurocode="EC2 §6.2"
      status={status}
      live={live}
      params={
        <>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Materiau</div>
          {slider('fck', 'fck', 'MPa', 10, 80, 1)}
          {slider('fyk', 'fyk', 'MPa', 400, 600, 10)}
          {slider('gc', 'gc', '-', 1.0, 2.0, 0.05)}
          {slider('gs', 'gs', '-', 1.0, 2.0, 0.05)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Section</div>
          {slider('b', 'b', 'mm', 100, 2000, 10)}
          {slider('bw', 'bw', 'mm', 100, 2000, 10)}
          {slider('h', 'h', 'mm', 100, 2000, 10)}
          {slider('d', 'd', 'mm', 50, 2000, 5)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Armatures tranchantes</div>
          {slider('asw', 'Asw', 'mm2', 0, 2000, 10)}
          {slider('s', 's', 'mm', 50, 500, 10)}
          {slider('rho_l', 'rho_l', '-', 0, 0.05, 0.001)}
          {slider('cot_theta', 'cot(theta)', '-', 1.0, 3.0, 0.1)}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pt-1">Sollicitation</div>
          {slider('ved', 'VEd', 'kN', 0, 500, 5)}
          {slider('ned', 'NEd', 'kN', -1000, 1000, 10)}
          {err && (
            <p className="text-[11px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{err}</p>
          )}
        </>
      }
      sketch={
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Comparaison EC2 vs BAEL" vbW={300} vbH={160}>
              {res && maxVal > 0 && (() => {
                const barW = 45;
                const gap = 15;
                const startX = 30;
                const baseY = 130;
                const scale = 100 / maxVal;
                const bars = [
                  { label: 'VEd', val: inp.ved, color: '#ef4444' },
                  { label: 'VRd,c', val: res.vrdc, color: '#3b82f6' },
                  { label: 'VRd,s', val: res.vrds, color: '#8b5cf6' },
                  { label: 'VRd,max', val: res.vrd_max, color: '#f59e0b' },
                  { label: 'BAEL', val: res.vrd_bael, color: '#22c55e' },
                ];
                return (
                  <>
                    {bars.map((bar, i) => {
                      const x = startX + i * (barW + gap);
                      const barH = Math.max(2, bar.val * scale);
                      return (
                        <g key={i}>
                          <rect x={x} y={baseY - barH} width={barW} height={barH} fill={bar.color} opacity={0.8} rx={2} />
                          <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" fontSize={8} fill="#94a3b8">
                            {bar.label}
                          </text>
                          <text x={x + barW / 2} y={baseY - barH - 4} textAnchor="middle" fontSize={8} fill={bar.color} fontWeight="bold">
                            {bar.val.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                    {inp.ved > 0 && (
                      <line x1={20} y1={baseY - inp.ved * scale} x2={280} y2={baseY - inp.ved * scale} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 2" />
                    )}
                  </>
                );
              })()}
            </SectionCanvas>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-4">
            <SectionCanvas title="Diagramme de cisaillement" vbW={300} vbH={120}>
              {res && (() => {
                const baseY = 100;
                const startX = 40;
                const endX = 260;
                const scale = 80 / Math.max(res.tau_ed, res.vrdc, 1.0);
                return (
                  <>
                    <rect x={startX} y={10} width={endX - startX} height={baseY - 10} fill="#60a5fa" opacity={0.1} stroke="#3b82f6" strokeWidth={1} />
                    <line x1={startX} y1={baseY - res.vrdc * scale} x2={endX} y2={baseY - res.vrdc * scale} stroke="#3b82f6" strokeWidth={2} />
                    <text x={endX + 5} y={baseY - res.vrdc * scale + 3} fontSize={8} fill="#3b82f6">VRd,c</text>
                    <line x1={startX} y1={baseY - res.tau_ed * scale} x2={endX} y2={baseY - res.tau_ed * scale} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
                    <text x={endX + 5} y={baseY - res.tau_ed * scale + 3} fontSize={8} fill="#ef4444">tau_ed</text>
                    <text x={startX - 5} y={baseY + 12} fontSize={8} fill="#94a3b8" textAnchor="end">0</text>
                    <text x={startX - 5} y={12} fontSize={8} fill="#94a3b8" textAnchor="end">
                      {Math.max(res.tau_ed, res.vrdc).toFixed(1)}
                    </text>
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
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">VRd,c</div>
                  <div className={`font-bold ${res.vrdc > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                    {res.vrdc.toFixed(2)} kN
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">VRd,s</div>
                  <div className="font-bold">{res.vrds.toFixed(2)} kN</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">VRd,max</div>
                  <div className={`font-bold ${res.vrd_max > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                    {res.vrd_max.toFixed(2)} kN
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">VRd (BAEL)</div>
                  <div className={`font-bold ${res.vrd_bael > inp.ved ? 'text-green-500' : 'text-red-500'}`}>
                    {res.vrd_bael.toFixed(2)} kN
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">tau_ed</div>
                  <div className="font-bold">{res.tau_ed.toFixed(2)} MPa</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded p-2">
                  <div className="text-slate-500">acw</div>
                  <div className="font-bold">{res.acw.toFixed(3)}</div>
                </div>
              </div>
              <FormulaCard
                title="EC2 contre BAEL"
                latex={String.raw`\tau_u = \frac{V_u}{b_0 d} \;\; \longleftrightarrow \;\; V_{Rd}`}
                description="Comparaison des deux règlements"
                status={status === 'computing' ? 'neutral' : status}
                variables={[
                  { symbol: String.raw`V_{Rd,s}`, meaning: 'Cadres EC2', value: res.vrds.toFixed(2), unit: 'kN' },
                  { symbol: String.raw`\tau_{Ed}`, meaning: 'Contrainte', value: res.tau_ed.toFixed(2), unit: 'MPa' },
                  { symbol: String.raw`V_{Ed}/V_{Rd}`, meaning: 'Ratio EC2', value: res.ratio_ec2.toFixed(3) },
                ]}
              />
              <ul className="text-xs space-y-2">
                <li className="text-slate-500">— verdict: {res.verdict}</li>
                <li className="font-mono text-slate-600 dark:text-slate-400">Mode: {res.governing}</li>
                <li className="font-mono text-slate-600 dark:text-slate-400">EC2 ratio: {res.ratio_ec2.toFixed(3)}</li>
                <li className="font-mono text-slate-600 dark:text-slate-400">BAEL ratio: {res.ratio_bael.toFixed(3)}</li>
                {res.diag && res.diag.map((d: string, i: number) => (
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
