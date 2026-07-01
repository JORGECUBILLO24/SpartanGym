import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_CUENTA_ACTUAL = 'spartanGym.currentAccount';
export const EVENTO_CUENTA_ACTUAL = 'spartanGym.currentAccountChanged';
export const CLAVE_ULTIMO_CIERRE = 'spartanGym.lastLogout';

const CUENTA_SIN_SESION = {
  username: '',
  role: '',
};

const leerCuentaApi = () => {
  if (typeof window === 'undefined') return null;

  try {
    const usuario = JSON.parse(window.localStorage.getItem('spartan_user'));
    if (!usuario) return null;

    return {
      username: usuario.email,
      email: usuario.email,
      role: usuario.rol,
      id: usuario.id,
    };
  } catch {
    return null;
  }
};

export const leerCuentaActiva = () => leerDatoLocal(CLAVE_CUENTA_ACTUAL, null);

export const haySesionActiva = () => Boolean(leerCuentaActiva()?.role);

export const leerCuentaActual = () => leerCuentaActiva() || leerCuentaApi() || CUENTA_SIN_SESION;

export const guardarCuentaActual = (cuenta) => {
  const cuentaGuardada = guardarDatoLocal(CLAVE_CUENTA_ACTUAL, cuenta);

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CLAVE_ULTIMO_CIERRE);
    window.dispatchEvent(new Event(EVENTO_CUENTA_ACTUAL));
  }

  return cuentaGuardada;
};

export const cerrarSesionActual = (motivo = 'manual') => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(CLAVE_CUENTA_ACTUAL);
  window.localStorage.removeItem('spartan_token');
  window.localStorage.removeItem('spartan_user');
  window.localStorage.setItem(
    CLAVE_ULTIMO_CIERRE,
    JSON.stringify({ motivo, fecha: new Date().toISOString() })
  );
  window.dispatchEvent(new Event(EVENTO_CUENTA_ACTUAL));
};

export const obtenerEtiquetaCuentaActual = () => {
  const cuenta = leerCuentaActual();
  const usuario = cuenta.username || cuenta.email || cuenta.name || 'Cuenta local';
  const rol = cuenta.role ? ` (${cuenta.role})` : '';

  return `${usuario}${rol}`;
};

export const obtenerInicialesCuenta = (cuenta, respaldo = 'AD') => {
  const nombre = cuenta?.name || cuenta?.username || cuenta?.email || '';

  if (!nombre || nombre.includes('@')) return respaldo;

  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || respaldo;
};
