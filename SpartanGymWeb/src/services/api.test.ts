import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, authApi, authStorage } from './api';
import { CLAVE_CUENTA_ACTUAL, CLAVE_ULTIMO_CIERRE } from '../utils/cuentaActual';

const fetchMock = vi.fn();

const respuesta = (cuerpo: string | null, status = 200, contentType?: string): Response =>
  new Response(cuerpo, { status, headers: contentType ? { 'Content-Type': contentType } : {} });

const problema = (detail: string, status: number, codigo: string): Response =>
  respuesta(JSON.stringify({ type: 'about:blank', status, detail, codigo }), status, 'application/problem+json;charset=UTF-8');

const cabecerasEnviadas = (): Record<string, string> =>
  (fetchMock.mock.calls[0][1] as { headers: Record<string, string> }).headers;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  // window.location.href = '/login' no se puede ejecutar de verdad en jsdom: se reemplaza.
  vi.stubGlobal('location', { href: 'http://localhost/admin' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest: cabecera Accept', () => {
  it('pide application/json ANTES que problem+json', async () => {
    fetchMock.mockResolvedValue(respuesta('{}', 200, 'application/json'));

    await apiRequest('/socios');

    // Regresión de producción: con problem+json primero, Spring negociaba también las respuestas
    // EXITOSAS como application/problem+json y la web dejaba de parsear el JSON.
    const accept = cabecerasEnviadas().Accept;
    expect(accept.indexOf('application/json')).toBeGreaterThanOrEqual(0);
    expect(accept.indexOf('application/json')).toBeLessThan(accept.indexOf('application/problem+json'));
    expect(accept).toMatch(/application\/problem\+json;\s*q=0\.\d/);
  });

  it('manda el mismo valor exacto que fija el test del backend (AcceptDeLosClientesTest)', async () => {
    fetchMock.mockResolvedValue(respuesta('{}', 200, 'application/json'));

    await apiRequest('/socios');

    expect(cabecerasEnviadas().Accept).toBe('application/json, application/problem+json;q=0.9, */*;q=0.8');
  });
});

describe('apiRequest: autenticación y sucursal', () => {
  it('envía el token y la sucursal elegida', async () => {
    localStorage.setItem('spartan_token', 'tok-123');
    localStorage.setItem('global_sucursal_id', 'suc-9');
    fetchMock.mockResolvedValue(respuesta('[]', 200, 'application/json'));

    await apiRequest('/socios');

    expect(cabecerasEnviadas().Authorization).toBe('Bearer tok-123');
    expect(cabecerasEnviadas()['X-Sucursal-Id']).toBe('suc-9');
  });

  it('con skipAuth no envía el token y con ignoreSucursal no envía la sucursal', async () => {
    localStorage.setItem('spartan_token', 'tok-123');
    localStorage.setItem('global_sucursal_id', 'suc-9');
    fetchMock.mockResolvedValue(respuesta('{}', 200, 'application/json'));

    await apiRequest('/x', { skipAuth: true, ignoreSucursal: true });

    expect(cabecerasEnviadas()).not.toHaveProperty('Authorization');
    expect(cabecerasEnviadas()).not.toHaveProperty('X-Sucursal-Id');
  });

  it('normaliza la ruta (con o sin barra inicial)', async () => {
    // Una respuesta nueva por llamada: el cuerpo de un Response solo se puede leer una vez.
    fetchMock.mockImplementation(() => Promise.resolve(respuesta('{}', 200, 'application/json')));

    await apiRequest('socios');
    await apiRequest('/socios');

    expect(fetchMock.mock.calls[0][0]).toBe(fetchMock.mock.calls[1][0]);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/socios$/);
  });
});

describe('apiRequest: respuestas exitosas', () => {
  it('parsea application/json', async () => {
    fetchMock.mockResolvedValue(respuesta('{"id":7,"nombre":"Ana"}', 200, 'application/json'));

    await expect(apiRequest('/socios/7')).resolves.toEqual({ id: 7, nombre: 'Ana' });
  });

  it('parsea también application/*+json', async () => {
    fetchMock.mockResolvedValue(respuesta('{"ok":true}', 200, 'application/vnd.api+json'));

    await expect(apiRequest('/x')).resolves.toEqual({ ok: true });
  });

  it('devuelve texto cuando la respuesta no es JSON', async () => {
    fetchMock.mockResolvedValue(respuesta('Hemos enviado un correo', 200, 'text/plain;charset=UTF-8'));

    await expect(apiRequest('/auth/forgot-password')).resolves.toBe('Hemos enviado un correo');
  });

  it('devuelve null en un 204', async () => {
    fetchMock.mockResolvedValue(respuesta(null, 204));

    await expect(apiRequest('/personal/1', { method: 'DELETE' })).resolves.toBeNull();
  });
});

describe('apiRequest: errores RFC 9457', () => {
  it('lanza ApiError con el detail, el status y el código de problem+json', async () => {
    fetchMock.mockResolvedValue(problema('El enlace de restablecimiento no es valido o ya fue usado', 400, 'REGLA_NEGOCIO'));

    const error = await apiRequest('/auth/reset-password').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: 'El enlace de restablecimiento no es valido o ya fue usado',
      status: 400,
      codigo: 'REGLA_NEGOCIO',
    });
  });

  it('con un cuerpo de texto plano (API vieja) usa el texto como mensaje y no inventa código', async () => {
    fetchMock.mockResolvedValue(respuesta('Stock insuficiente para Proteína', 400, 'text/plain;charset=UTF-8'));

    const error = await apiRequest('/ventas/productos').catch((e: unknown) => e);

    expect(error).toMatchObject({ message: 'Stock insuficiente para Proteína', status: 400, codigo: null });
  });

  it('con cuerpo vacío usa un mensaje genérico con el status', async () => {
    fetchMock.mockResolvedValue(respuesta('', 500));

    const error = await apiRequest('/x').catch((e: unknown) => e);

    expect(error).toMatchObject({ message: 'Error 500 al conectar con la API', status: 500 });
  });

  it('si problem+json viene corrupto no explota: usa el mensaje genérico', async () => {
    fetchMock.mockResolvedValue(respuesta('{no-es-json', 503, 'application/problem+json'));

    const error = await apiRequest('/x').catch((e: unknown) => e);

    expect(error).toMatchObject({ message: 'Error 503 al conectar con la API', status: 503, codigo: null });
  });

  it('un 503 de dependencia caída conserva su código', async () => {
    fetchMock.mockResolvedValue(problema('El servicio no esta disponible temporalmente.', 503, 'SERVICIO_NO_DISPONIBLE'));

    await expect(apiRequest('/asistencias/qr-validacion')).rejects.toMatchObject({
      status: 503,
      codigo: 'SERVICIO_NO_DISPONIBLE',
    });
  });
});

describe('apiRequest: 401 y sesión vencida', () => {
  beforeEach(() => {
    localStorage.setItem('spartan_token', 'vencido');
    localStorage.setItem('spartan_user', JSON.stringify({ email: 'x@x.com', rol: 'ROLE_ADMIN' }));
    localStorage.setItem(CLAVE_CUENTA_ACTUAL, JSON.stringify({ username: 'x@x.com', role: 'Administrador' }));
  });

  it('cierra la sesión COMPLETA y manda a /login', async () => {
    fetchMock.mockResolvedValue(problema('Tu sesión expiró', 401, 'NO_AUTENTICADO'));

    await expect(apiRequest('/socios')).rejects.toMatchObject({ status: 401, codigo: 'NO_AUTENTICADO' });

    // La sesión vive en dos lugares; si solo se limpiara uno, /login volvía a /admin en loop.
    expect(localStorage.getItem('spartan_token')).toBeNull();
    expect(localStorage.getItem('spartan_user')).toBeNull();
    expect(localStorage.getItem(CLAVE_CUENTA_ACTUAL)).toBeNull();
    expect(JSON.parse(localStorage.getItem(CLAVE_ULTIMO_CIERRE) ?? '{}')).toMatchObject({ motivo: 'sesion-expirada' });
    expect(window.location.href).toBe('/login');
  });

  it('con skipAuth un 401 NO cierra la sesión ni redirige (p. ej. login con clave mala)', async () => {
    fetchMock.mockResolvedValue(problema('Correo o contraseña incorrectos.', 401, 'CREDENCIALES_INVALIDAS'));

    await expect(apiRequest('/auth/login', { skipAuth: true })).rejects.toMatchObject({
      message: 'Correo o contraseña incorrectos.',
      status: 401,
    });

    expect(localStorage.getItem('spartan_token')).toBe('vencido');
    expect(window.location.href).toBe('http://localhost/admin');
  });
});

describe('apiRequest: fallos de conexión', () => {
  it('un fallo de red NO es un ApiError (no tiene status): la pantalla lo distingue de un rechazo de la API', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiRequest('/auth/login').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as { status?: number }).status).toBeUndefined();
  });
});

describe('authApi y authStorage', () => {
  it('login manda email y password por POST /auth/login', async () => {
    fetchMock.mockResolvedValue(
      respuesta(JSON.stringify({ id: '1', token: 't', email: 'a@a.com', rol: 'ROLE_ADMIN' }), 200, 'application/json'),
    );

    const sesion = await authApi.login('a@a.com', 'clave');

    expect(sesion.rol).toBe('ROLE_ADMIN');
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/auth\/login$/);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"email":"a@a.com","password":"clave"}' });
  });

  it('setSession guarda el token aparte del usuario y clear borra ambos', () => {
    authStorage.setSession({ id: '1', token: 'secreto', email: 'a@a.com', rol: 'ROLE_ADMIN' });

    expect(authStorage.getToken()).toBe('secreto');
    expect(authStorage.getUser()).toEqual({ id: '1', email: 'a@a.com', rol: 'ROLE_ADMIN' });
    // El token nunca se guarda dentro del objeto de usuario.
    expect(localStorage.getItem('spartan_user')).not.toContain('secreto');

    authStorage.clear();

    expect(authStorage.getToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it('getUser tolera un valor corrupto', () => {
    localStorage.setItem('spartan_user', '{corrupto');

    expect(authStorage.getUser()).toBeNull();
  });
});
