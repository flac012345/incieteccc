import { useCallback, useEffect, useRef, useState } from 'react';
import { ZONES } from '../data/medellinZones';
import { fetchZonesWeather, type ZoneWeather } from '../services/weather';

const REFRESH_MS = 10 * 60 * 1000;

export type WeatherStatus = 'loading' | 'ready' | 'error';

/** Datos de lluvia en vivo para todas las zonas, con refresco automático cada 10 min. */
export function useLiveWeather() {
  const [data, setData] = useState<Record<string, ZoneWeather> | null>(null);
  const [status, setStatus] = useState<WeatherStatus>('loading');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const result = await fetchZonesWeather(ZONES, ctrl.signal);
      setData(result);
      setUpdatedAt(new Date());
      setStatus('ready');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return { data, status, updatedAt, refresh };
}
