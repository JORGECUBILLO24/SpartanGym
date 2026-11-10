import { cerrarSesionActual } from '../utils/cuentaActual';
import type { Sucursal, SucursalDisponible, SesionUsuario, TipoMembresia, UsuarioGuardado } from '../types/domain';

const FALLBACK_API_BASE_URL = 'http://localhost:8080/api';

const normalizeApiBaseUrl = (rawValue: unknown): string => {
  const value = String(rawValue ?? '').trim();
  if (!value) return FALLBACK_API_BASE_URL;
  return value.replace(/\/+$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const authStorage = {
  getToken: (): string | null => localStorage.getItem('spartan_token'),
  getUser: (): UsuarioGuardado | null => {
    const rawUser = localStorage.getItem('spartan_user');
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as UsuarioGuardado;
    } catch {
      return null;
    }
  },
  setSession: ({ id, token, email, rol }: SesionUsuario): void => {
    localStorage.setItem('spartan_token', token);
    localStorage.setItem('spartan_user', JSON.stringify({ id, email, rol }));
  },
  clear: (): void => {
    localStorage.removeItem('spartan_token');
    localStorage.removeItem('spartan_user');
  },
};

// Error de la API con el mismo mensaje de siempre en `.message`, más el status HTTP y el
// `codigo` estable del contrato de errores (RFC 9457). Los usos existentes de
// `error.message` no cambian. Un fallo de red (CORS, sin conexión) NO es un ApiError: no
// tiene `status`, y así la pantalla puede distinguirlo de un rechazo de la API.
export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string | null;

  constructor(message: string, status: number, codigo: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  /** No enviar el token (endpoints públicos) ni tratar un 401 como sesión vencida. */
  skipAuth?: boolean;
  /** No enviar el header X-Sucursal-Id con la sucursal global elegida. */
  ignoreSucursal?: boolean;
}

interface ProblemaRespuesta {
  detail?: string;
  codigo?: string | null;
}

export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = options.skipAuth ? null : authStorage.getToken();
  const sucursalId = localStorage.getItem('global_sucursal_id');
  const { skipAuth, ignoreSucursal, ...fetchOptions } = options;
  const normalizedPath = String(path ?? '').startsWith('/') ? path : `/${String(path ?? '')}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...fetchOptions,
    headers: {
      // application/json va primero: si problem+json tuviera más prioridad, Spring también
      // negociaría las respuestas EXITOSAS como problem+json. Basta con que problem+json
      // aparezca en la lista para que la API devuelva los errores en formato RFC 9457.
      Accept: 'application/json, application/problem+json;q=0.9, */*;q=0.8',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sucursalId && !ignoreSucursal ? { 'X-Sucursal-Id': sucursalId } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      // La sesión vive en dos lugares (token/usuario y la cuenta actual): se limpian ambos.
      cerrarSesionActual('sesion-expirada');
      window.location.href = '/login';
      throw new ApiError('Sesion expirada. Por favor, inicia sesion de nuevo.', 401, 'NO_AUTENTICADO');
    }
    const tipoError = response.headers.get('content-type') || '';
    if (tipoError.includes('application/problem+json')) {
      const problema = (await response.json().catch(() => null)) as ProblemaRespuesta | null;
      throw new ApiError(
        problema?.detail || `Error ${response.status} al conectar con la API`,
        response.status,
        problema?.codigo ?? null,
      );
    }
    const errorBody = await response.text();
    throw new ApiError(errorBody || `Error ${response.status} al conectar con la API`, response.status);
  }

  if (response.status === 204) return null as T;

  const contentType = response.headers.get('content-type') || '';
  // Cualquier variante JSON (application/json, application/*+json) se parsea como JSON.
  if (!contentType.includes('json')) return (await response.text()) as T;

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------------------
// Cuerpos de las peticiones. Las respuestas se tipan de a poco: donde la forma todavía no está
// modelada se devuelve `unknown` y quien llama indica el tipo con apiRequest<T>().
// ---------------------------------------------------------------------------------------

export interface RegistroSocioRequest {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
  sucursalId?: string;
}

export interface RegistroPersonalRequest extends RegistroSocioRequest {
  rol: string;
  especialidad?: string;
}

export interface TipoMembresiaRequest {
  nombre: string;
  duracionDias: number;
  precio: number;
  /** Texto libre con los beneficios del plan. */
  beneficios?: string | null;
}

export interface MovimientoFinancieroRequest {
  concepto: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  metodo?: string;
  categoria?: string;
  sucursalId?: string;
}

export const authApi = {
  loginGoogle: (credential: string) => apiRequest<SesionUsuario>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  }),
  login: (email: string, password: string) => apiRequest<SesionUsuario>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  solicitarRestablecimiento: (email: string) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  restablecerPassword: ({ token, password }: { token: string; password: string }) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  }),
  registerSocio: ({ nombres, apellidos, email, password, telefono, sucursalId }: RegistroSocioRequest) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono, sucursalId }),
  }),
};

export const usuariosApi = {
  enviarEnlacePassword: (usuarioId: string) => apiRequest(`/usuarios/${usuarioId}/password-reset-link`, {
    method: 'POST',
  }),
  cambiarPassword: (usuarioId: string, password: string) => apiRequest(`/usuarios/${usuarioId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  }),
};

export const personalApi = {
  listar: () => apiRequest('/personal'),
  registrar: ({ nombres, apellidos, email, password, telefono, rol, especialidad, sucursalId }: RegistroPersonalRequest) => apiRequest('/personal/registrar', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono, rol, especialidad, sucursalId }),
  }),
  actualizarPerfil: (perfil: Record<string, unknown>) => apiRequest('/personal/me', {
    method: 'PUT',
    body: JSON.stringify(perfil),
  }),
  actualizarRol: (usuarioId: string, rol: string) => apiRequest(`/personal/${usuarioId}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  }),
  eliminar: (usuarioId: string) => apiRequest(`/personal/${usuarioId}`, { method: 'DELETE' }),
};

export const sociosApi = {
  listar: (options: ApiRequestOptions = {}) => apiRequest('/socios', options),
  estado: (socioId: string) => apiRequest(`/socios/estado/${socioId}`),
  registrar: ({ nombres, apellidos, email, password, telefono, sucursalId }: RegistroSocioRequest) => authApi.registerSocio({
    nombres,
    apellidos,
    email,
    password,
    telefono,
    sucursalId,
  }),
};

export const catalogoApi = {
  ejercicios: () => apiRequest('/catalogo/ejercicios'),
  gruposMusculares: () => apiRequest('/catalogo/grupos-musculares'),
};

export const rutinasApi = {
  actualizarImagen: (id: string, imagenUrl: string) => apiRequest(`/rutinas/${id}/imagen`, {
    method: 'PATCH', body: JSON.stringify({ imagenUrl }),
  }),
  listar: () => apiRequest('/rutinas'),
  crear: (rutina: Record<string, unknown>) => apiRequest('/rutinas', {
    method: 'POST',
    body: JSON.stringify(rutina),
  }),
  crearGlobal: (rutina: Record<string, unknown>) => apiRequest('/rutinas/global', {
    method: 'POST',
    body: JSON.stringify({ ...rutina, esGlobal: true, idSocio: null }),
  }),
};

export const membresiasApi = {
  tipos: () => apiRequest<TipoMembresia[]>('/membresias/tipos'),
  actualizarImagen: (id: number, imagenUrl: string) => apiRequest<TipoMembresia>(`/membresias/tipos/${id}/imagen`, {
    method: 'PATCH',
    body: JSON.stringify({ imagenUrl }),
  }),
  crearTipo: ({ nombre, duracionDias, precio, beneficios }: TipoMembresiaRequest) => apiRequest<TipoMembresia>('/membresias/tipos', {
    method: 'POST',
    body: JSON.stringify({ nombre, duracionDias, precio, beneficios }),
  }),
  actualizarTipo: (id: number, { nombre, duracionDias, precio, beneficios }: TipoMembresiaRequest) => apiRequest<TipoMembresia>(`/membresias/tipos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre, duracionDias, precio, beneficios }),
  }),
  eliminarTipo: (id: number) => apiRequest(`/membresias/tipos/${id}`, { method: 'DELETE' }),
  comprar: ({ tipoMembresiaId, metodoPago }: { tipoMembresiaId: number; metodoPago: string }) => apiRequest('/membresias/comprar', {
    method: 'POST',
    body: JSON.stringify({ tipoMembresiaId, metodoPago }),
  }),
};

export const pagosApi = {
  renovar: ({ idSocio, idTipoMembresia, metodoPago }: { idSocio: string; idTipoMembresia: number; metodoPago: string }) => apiRequest('/pagos/renovar', {
    method: 'POST',
    body: JSON.stringify({ idSocio, idTipoMembresia, metodoPago }),
  }),
};

export const asistenciasApi = {
  checkIn: (idSocio: string) => apiRequest('/asistencias/check-in', {
    method: 'POST',
    body: JSON.stringify({ idSocio }),
  }),
  qrValidacion: () => apiRequest('/asistencias/qr-validacion'),
  estadoQrValidacionPorToken: (token: string) => apiRequest('/asistencias/qr-validacion/estado', {
    method: 'POST',
    body: JSON.stringify({ token }),
    skipAuth: true,
  }),
  historialSocio: (socioId: string) => apiRequest(`/asistencias/socio/${socioId}`),
};

export const reportesApi = {
  resumen: () => apiRequest('/reportes/resumen'),
  generar: (tipo: string) => apiRequest('/reportes/generar', {
    method: 'POST',
    body: JSON.stringify({ tipo }),
  }),
};

export const inventarioApi = {
  listar: () => apiRequest('/inventario'),
  crear: (producto: Record<string, unknown>) => apiRequest('/inventario', {
    method: 'POST',
    body: JSON.stringify(producto),
  }),
  actualizar: (id: string, producto: Record<string, unknown>) => apiRequest(`/inventario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(producto),
  }),
  eliminar: (id: string) => apiRequest(`/inventario/${id}`, { method: 'DELETE' }),
};

export const ventasApi = {
  listarProductos: () => apiRequest('/ventas/productos'),
  venderProducto: (venta: Record<string, unknown>) => apiRequest('/ventas/productos', {
    method: 'POST',
    body: JSON.stringify(venta),
  }),
  facturaProducto: (id: string) => apiRequest(`/ventas/productos/${id}`),
};

export const sucursalesApi = {
  listar: () => apiRequest<Sucursal[]>('/sucursales'),
  /** Público (sin sesión): solo id y nombre, para el formulario de registro. */
  listarDisponibles: () => apiRequest<SucursalDisponible[]>('/sucursales/disponibles', { skipAuth: true }),
  crear: (sucursal: Partial<Sucursal>) => apiRequest<Sucursal>('/sucursales', {
    method: 'POST',
    body: JSON.stringify(sucursal),
  }),
  actualizar: (id: string, sucursal: Partial<Sucursal>) => apiRequest<Sucursal>(`/sucursales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sucursal),
  }),
  eliminar: (id: string) => apiRequest(`/sucursales/${id}`, { method: 'DELETE' }),
};

export const finanzasApi = {
  listar: () => apiRequest('/finanzas'),
  crear: (movimiento: MovimientoFinancieroRequest) => apiRequest('/finanzas', {
    method: 'POST',
    body: JSON.stringify(movimiento),
  }),
};

export const operacionApi = {
  perfil: () => apiRequest('/operacion/me'),
  actualizarFoto: (fotoUrl: string) => apiRequest('/operacion/me/foto', {
    method: 'PUT',
    body: JSON.stringify({ fotoUrl }),
  }),
  inicioRecepcion: () => apiRequest('/operacion/recepcion/inicio'),
  asistenciasRecientes: () => apiRequest('/operacion/asistencias/recientes'),
  pagos: () => apiRequest('/operacion/pagos'),
  membresias: () => apiRequest('/operacion/membresias'),
  notificaciones: () => apiRequest('/operacion/notificaciones'),
  marcarNotificacionLeida: (id: string) => apiRequest(`/operacion/notificaciones/${id}/leer`, { method: 'PATCH' }),
  pagosSocio: (socioId: string) => apiRequest(`/operacion/pagos/socio/${socioId}`),
  rutinasSocio: (socioId: string) => apiRequest(`/operacion/socio/${socioId}/rutinas`),
  entrenadorDashboard: () => apiRequest('/operacion/entrenador/dashboard'),
  entrenadorClientes: () => apiRequest('/operacion/entrenador/clientes'),
  entrenadorPerfil: () => apiRequest('/operacion/entrenador/perfil'),
};

export const configuracionApi = {
  obtener: () => apiRequest('/configuracion'),
  guardar: (configuracion: Record<string, unknown>) => apiRequest('/configuracion', {
    method: 'PUT',
    body: JSON.stringify(configuracion),
  }),
};

export const notificacionesApi = {
  listarGlobales: () => apiRequest('/notificaciones/globales'),
  crearGlobal: ({ tipo, titulo, mensaje }: { tipo: string; titulo: string; mensaje: string }) => apiRequest('/notificaciones/globales', {
    method: 'POST',
    body: JSON.stringify({ tipo, titulo, mensaje }),
  }),
};
