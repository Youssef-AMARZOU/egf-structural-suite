import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CalcState<TOut> {
  data: TOut | null;
  error: string | null;
  live: boolean;
}

/**
 * Debounced Tauri IPC: recomputes `delay` ms after the last input change,
 * drops stale responses. Gives every module instant reactivity for free.
 */
export function useModuleCalc<TIn extends object, TOut>(
  cmd: string,
  inputs: TIn,
  delay = 250,
): CalcState<TOut> {
  const [data, setData] = useState<TOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const req = useRef(0);
  const key = JSON.stringify(inputs);

  useEffect(() => {
    const id = ++req.current;
    setLive(true);
    const t = setTimeout(() => {
      invoke<TOut>(cmd, { p: JSON.parse(key) })
        .then((r) => {
          if (req.current === id) {
            setData(r);
            setError(null);
            setLive(false);
          }
        })
        .catch((e) => {
          if (req.current === id) {
            setError(String(e));
            setLive(false);
          }
        });
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd, key, delay]);

  return { data, error, live };
}
