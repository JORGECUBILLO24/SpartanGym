import { leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_CONFIGURACION = 'spartanGym.settings';

export const leerConfiguracionGuardada = () => leerDatoLocal(CLAVE_CONFIGURACION, {});

export const obtenerTemaDelSistema = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const resolverPreferenciaTema = (preferenciaTema = 'system') => {
  if (preferenciaTema === 'light' || preferenciaTema === 'dark') return preferenciaTema;

  return obtenerTemaDelSistema();
};

export const aplicarPreferenciaTema = (preferenciaTema = 'system') => {
  if (typeof document === 'undefined') return 'dark';

  const preferenciaNormalizada = ['light', 'dark', 'system'].includes(preferenciaTema)
    ? preferenciaTema
    : 'system';
  const temaResuelto = resolverPreferenciaTema(preferenciaNormalizada);

  document.documentElement.dataset.theme = temaResuelto;
  document.documentElement.dataset.themePreference = preferenciaNormalizada;

  return temaResuelto;
};

export const aplicarTemaGuardado = () => {
  const configuracionGuardada = leerConfiguracionGuardada();

  return aplicarPreferenciaTema(configuracionGuardada.theme || 'system');
};
