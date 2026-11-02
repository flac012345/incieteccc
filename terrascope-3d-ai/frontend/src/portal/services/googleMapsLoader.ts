/**
 * Cargador mínimo de Google Maps JavaScript API (sin dependencias extra).
 * - Usa VITE_GOOGLE_MAPS_API_KEY si existe.
 * - Sin key, Google renderiza el mapa en "modo desarrollo" (con marca de agua).
 */
let loaderPromise: Promise<typeof google.maps> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

export function onGoogleAuthFailure(cb: () => void) {
  if (authFailed) cb();
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    const callbackName = '__terrascopeGmapsReady';

    w.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((cb) => cb());
    };

    w[callbackName] = async () => {
      try {
        await google.maps.importLibrary('maps');
        resolve(google.maps);
      } catch (e) {
        reject(e);
      }
    };

    const params = new URLSearchParams({
      v: 'weekly',
      callback: callbackName,
      language: 'es',
      region: 'CO',
      loading: 'async',
    });
    if (GOOGLE_MAPS_KEY) params.set('key', GOOGLE_MAPS_KEY);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('No se pudo cargar Google Maps. Verifica tu conexión.'));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
