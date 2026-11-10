import { describe, expect, it, vi } from 'vitest';
import {
  CLAVE_CUENTA_ACTUAL,
  CLAVE_ULTIMO_CIERRE,
  EVENTO_CUENTA_ACTUAL,
  cerrarSesionActual,
  guardarCuentaActual,
  haySesionActiva,
  leerCuentaActual,
  obtenerEtiquetaCuentaActual,
  obtenerInicialesCuenta,
} from './cuentaActual';
import { guardarDatoLocal, leerDatoLocal, leerJsonSeguro } from './almacenamientoLocal';

describe('almacenamientoLocal', () => {
  it('leerJsonSeguro devuelve el respaldo si el JSON está corrupto o vacío', () => {
    expect(leerJsonSeguro('{roto', { a: 1 })).toEqual({ a: 1 });
    expect(leerJsonSeguro(null, 'x')).toBe('x');
    expect(leerJsonSeguro('{"b":2}', {})).toEqual({ b: 2 });
  });

  it('guardarDatoLocal y leerDatoLocal hacen ida y vuelta', () => {
    guardarDatoLocal('clave', { n: 5 });

    expect(leerDatoLocal('clave', null)).toEqual({ n: 5 });
    expect(leerDatoLocal('inexistente', 'por-defecto')).toBe('por-defecto');
  });
});

describe('cuentaActual', () => {
  it('sin nada guardado no hay sesión', () => {
    expect(leerCuentaActual()).toEqual({ username: '', role: '' });
    expect(haySesionActiva()).toBe(false);
  });

  it('sin cuenta actual usa el usuario que dejó el login de la API', () => {
    localStorage.setItem('spartan_user', JSON.stringify({ id: '1', email: 'a@a.com', rol: 'ROLE_ADMIN' }));

    expect(leerCuentaActual()).toMatchObject({ username: 'a@a.com', role: 'ROLE_ADMIN', id: '1' });
  });

  it('la cuenta actual guardada tiene prioridad sobre spartan_user', () => {
    localStorage.setItem('spartan_user', JSON.stringify({ email: 'api@a.com', rol: 'ROLE_ADMIN' }));
    guardarCuentaActual({ username: 'cuenta@a.com', role: 'Superadmin' });

    expect(leerCuentaActual()).toMatchObject({ username: 'cuenta@a.com', role: 'Superadmin' });
    expect(haySesionActiva()).toBe(true);
  });

  it('un spartan_user corrupto no rompe la lectura', () => {
    localStorage.setItem('spartan_user', '{corrupto');

    expect(leerCuentaActual()).toEqual({ username: '', role: '' });
  });

  it('guardarCuentaActual avisa a la interfaz y borra el registro del último cierre', () => {
    localStorage.setItem(CLAVE_ULTIMO_CIERRE, '{"motivo":"manual"}');
    const aviso = vi.fn();
    window.addEventListener(EVENTO_CUENTA_ACTUAL, aviso);

    guardarCuentaActual({ username: 'a@a.com', role: 'Administrador' });
    window.removeEventListener(EVENTO_CUENTA_ACTUAL, aviso);

    expect(aviso).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CLAVE_ULTIMO_CIERRE)).toBeNull();
  });

  it('cerrarSesionActual limpia los dos lugares de la sesión, anota el motivo y avisa', () => {
    localStorage.setItem('spartan_token', 't');
    localStorage.setItem('spartan_user', '{"email":"a@a.com"}');
    guardarCuentaActual({ username: 'a@a.com', role: 'Administrador' });
    const aviso = vi.fn();
    window.addEventListener(EVENTO_CUENTA_ACTUAL, aviso);

    cerrarSesionActual('sesion-expirada');
    window.removeEventListener(EVENTO_CUENTA_ACTUAL, aviso);

    expect(localStorage.getItem('spartan_token')).toBeNull();
    expect(localStorage.getItem('spartan_user')).toBeNull();
    expect(localStorage.getItem(CLAVE_CUENTA_ACTUAL)).toBeNull();
    expect(JSON.parse(localStorage.getItem(CLAVE_ULTIMO_CIERRE) ?? '{}').motivo).toBe('sesion-expirada');
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(haySesionActiva()).toBe(false);
  });

  it('el motivo por defecto del cierre es "manual"', () => {
    cerrarSesionActual();

    expect(JSON.parse(localStorage.getItem(CLAVE_ULTIMO_CIERRE) ?? '{}').motivo).toBe('manual');
  });

  it('obtenerEtiquetaCuentaActual muestra usuario y rol', () => {
    expect(obtenerEtiquetaCuentaActual()).toBe('Cuenta local');

    guardarCuentaActual({ username: 'a@a.com', role: 'Administrador' });

    expect(obtenerEtiquetaCuentaActual()).toBe('a@a.com (Administrador)');
  });
});

describe('obtenerInicialesCuenta', () => {
  it('toma las iniciales de las dos primeras palabras', () => {
    expect(obtenerInicialesCuenta({ name: 'ana maría pérez' })).toBe('AM');
    expect(obtenerInicialesCuenta({ name: 'Carlos' })).toBe('C');
  });

  it('si solo hay un correo (o nada) usa el respaldo', () => {
    expect(obtenerInicialesCuenta({ email: 'a@a.com' })).toBe('AD');
    expect(obtenerInicialesCuenta({ email: 'a@a.com' }, 'US')).toBe('US');
    expect(obtenerInicialesCuenta(null)).toBe('AD');
    expect(obtenerInicialesCuenta({ name: '   ' }, 'XX')).toBe('XX');
  });
});
