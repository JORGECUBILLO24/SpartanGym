export const leerJsonSeguro = (valor, respaldo = {}) => {
  try {
    return valor ? JSON.parse(valor) : respaldo;
  } catch {
    return respaldo;
  }
};

export const leerDatoLocal = (clave, respaldo = {}) => {
  if (typeof window === 'undefined') return respaldo;

  return leerJsonSeguro(window.localStorage.getItem(clave), respaldo);
};

export const guardarDatoLocal = (clave, valor) => {
  if (typeof window === 'undefined') return valor;

  window.localStorage.setItem(clave, JSON.stringify(valor));
  return valor;
};
