import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import NumField from '../../components/NumField';

interface CurvePoint { m: number; n: number; }

export default function Module101() {
  const [fck, setFck] = useState(25);
  const [fyk, setFyk] = useState(500);
  const [bx, setBx] = useState(0.3);
  const [h, setH] = useState(0.5);
  const [asc, setAsc] = useState(4);
  const [ast, setAst] = useState(4);
  const [curve, setCurve] = useState<CurvePoint[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    invoke<CurvePoint[]>('calculate_interaction_curve', {
      p: { fck, fyk, bx, h, asc, ast },
    })
      .then((r) => { if (!dead) { setCurve(r); setErr(null); } })
      .catch((e) => { if (!dead) setErr(String(e)); });
    return () => { dead = true; };
  }, [fck, fyk, bx, h, asc, ast]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">101 Interaction M-N</h2>
        <p className="text-xs text-slate-500">
          D'après EGF N°101 © Henry Thonier — EC2/BAEL
        </p>
      </div>

      <div className="grid grid-cols-6 gap-3">
        <NumField label="fck" unit="MPa" value={fck} onChange={setFck} min={12} max={90} step={1} />
        <NumField label="fyk" unit="MPa" value={fyk} onChange={setFyk} min={400} max={600} step={10} />
        <NumField label="bx" unit="m" value={bx} onChange={setBx} min={0.1} max={2} step={0.05} />
        <NumField label="h" unit="m" value={h} onChange={setH} min={0.15} max={2} step={0.05} />
        <NumField label="Asc" unit="cm²" value={asc} onChange={setAsc} min={0} max={100} step={0.5} />
        <NumField label="Ast" unit="cm²" value={ast} onChange={setAst} min={0} max={100} step={0.5} />
      </div>

      {err && (
        <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">
          {err}
        </p>
      )}

      <div className="h-[400px] border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0f172a] p-4">
        {curve.length === 0 ? (
          <p className="text-xs text-slate-500 text-center pt-16">computing…</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="m" type="number" name="M" unit=" kNm"
                tick={{ fontSize: 11 }} />
              <YAxis dataKey="n" type="number" name="N" unit=" kN"
                tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="n" stroke="#2563eb" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
