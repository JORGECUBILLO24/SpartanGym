// Lectura y escritura de JSON en localStorage. Nunca lanzan: si el valor está corrupto o el
// navegador no tiene localStorage (SSR, modo privado), devuelven el respaldo.

export const leerJsonSeguro = <T = Record<string, unknown>>(valor: string | null, respaldo: T = {} as T): T => {
  try {
    return valor ? (JSON.parse(valor) as T) : respaldo;
  } catch {
    return respaldo;
  }
};

export const leerDatoLocal = <T = Record<string, unknown>>(clave: string, respaldo: T = {} as T): T => {
  if (typeof window === 'undefined') return respaldo;

  return leerJsonSeguro<T>(window.localStorage.getItem(clave), respaldo);
};

export const guardarDatoLocal = <T>(clave: string, valor: T): T => {
  if (typeof window === 'undefined') return valor;

  window.localStorage.setItem(clave, JSON.stringify(valor));
  return valor;
};
