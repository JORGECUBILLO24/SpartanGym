import { leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_CONFIGURACION = 'spartanGym.settings';

const TEMAS_VALIDOS = ['light', 'dark', 'system'];

export const normalizarPreferenciaTema = (preferenciaTema = 'system') =>
  TEMAS_VALIDOS.includes(preferenciaTema) ? preferenciaTema : 'system';

export const leerConfiguracionGuardada = () => leerDatoLocal(CLAVE_CONFIGURACION, {});

export const obtenerTemaDelSistema = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const obtenerPreferenciaTemaGuardada = () => {
  const configuracionGuardada = leerConfiguracionGuardada();
  const preferencia = normalizarPreferenciaTema(configuracionGuardada.theme);

  if (preferencia === 'system') return 'system';

  return configuracionGuardada.themeSource === 'user' ? preferencia : 'system';
};

export const resolverPreferenciaTema = (preferenciaTema = 'system') => {
  const preferenciaNormalizada = normalizarPreferenciaTema(preferenciaTema);

  if (preferenciaNormalizada === 'light' || preferenciaNormalizada === 'dark') {
    return preferenciaNormalizada;
  }

  return obtenerTemaDelSistema();
};

export const aplicarPreferenciaTema = (preferenciaTema = 'system') => {
  if (typeof document === 'undefined') return 'dark';

  const preferenciaNormalizada = normalizarPreferenciaTema(preferenciaTema);
  const temaResuelto = resolverPreferenciaTema(preferenciaNormalizada);

  document.documentElement.dataset.theme = temaResuelto;
  document.documentElement.dataset.themePreference = preferenciaNormalizada;

  return temaResuelto;
};

export const aplicarTemaGuardado = () => aplicarPreferenciaTema(obtenerPreferenciaTemaGuardada());

export const iniciarSincronizacionTemaSistema = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  const actualizarSiUsaSistema = () => {
    if (obtenerPreferenciaTemaGuardada() === 'system') {
      aplicarPreferenciaTema('system');
    }
  };

  const consultas = [
    window.matchMedia('(prefers-color-scheme: light)'),
    window.matchMedia('(prefers-color-scheme: dark)'),
  ];

  consultas.forEach((consulta) => {
    if (consulta.addEventListener) {
      consulta.addEventListener('change', actualizarSiUsaSistema);
      return;
    }

    consulta.addListener(actualizarSiUsaSistema);
  });

  window.addEventListener('storage', actualizarSiUsaSistema);

  return () => {
    consultas.forEach((consulta) => {
      if (consulta.removeEventListener) {
        consulta.removeEventListener('change', actualizarSiUsaSistema);
        return;
      }

      consulta.removeListener(actualizarSiUsaSistema);
    });

    window.removeEventListener('storage', actualizarSiUsaSistema);
  };
};
