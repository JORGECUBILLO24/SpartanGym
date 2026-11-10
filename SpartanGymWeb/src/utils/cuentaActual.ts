import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_CUENTA_ACTUAL = 'spartanGym.currentAccount';
export const EVENTO_CUENTA_ACTUAL = 'spartanGym.currentAccountChanged';
export const CLAVE_ULTIMO_CIERRE = 'spartanGym.lastLogout';

/** Cuenta que la interfaz muestra como "sesión actual". Todos los campos son opcionales. */
export interface CuentaActual {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  /** Etiqueta legible del rol ("Superadmin"), o el valor crudo de la API ("ROLE_ADMIN"). */
  role?: string;
  loggedAt?: string;
}

const CUENTA_SIN_SESION: CuentaActual = {
  username: '',
  role: '',
};

interface UsuarioApiGuardado {
  id?: string;
  email?: string;
  rol?: string;
}

const leerCuentaApi = (): CuentaActual | null => {
  if (typeof window === 'undefined') return null;

  try {
    const bruto = window.localStorage.getItem('spartan_user');
    if (!bruto) return null;
    const usuario = JSON.parse(bruto) as UsuarioApiGuardado | null;
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

export const leerCuentaActiva = (): CuentaActual | null => leerDatoLocal<CuentaActual | null>(CLAVE_CUENTA_ACTUAL, null);

export const haySesionActiva = (): boolean => Boolean(leerCuentaActiva()?.role);

export const leerCuentaActual = (): CuentaActual => leerCuentaActiva() || leerCuentaApi() || CUENTA_SIN_SESION;

export const guardarCuentaActual = (cuenta: CuentaActual): CuentaActual => {
  const cuentaGuardada = guardarDatoLocal(CLAVE_CUENTA_ACTUAL, cuenta);

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CLAVE_ULTIMO_CIERRE);
    window.dispatchEvent(new Event(EVENTO_CUENTA_ACTUAL));
  }

  return cuentaGuardada;
};

/** Cierra la sesión en los DOS lugares donde vive (cuenta actual y token/usuario de la API). */
export const cerrarSesionActual = (motivo = 'manual'): void => {
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

export const obtenerEtiquetaCuentaActual = (): string => {
  const cuenta = leerCuentaActual();
  const usuario = cuenta.username || cuenta.email || cuenta.name || 'Cuenta local';
  const rol = cuenta.role ? ` (${cuenta.role})` : '';

  return `${usuario}${rol}`;
};

export const obtenerInicialesCuenta = (
  cuenta: Pick<CuentaActual, 'name' | 'username' | 'email'> | null | undefined,
  respaldo = 'AD',
): string => {
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
