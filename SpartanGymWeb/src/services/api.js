const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const authStorage = {
  getToken: () => localStorage.getItem('spartan_token'),
  getUser: () => {
    const rawUser = localStorage.getItem('spartan_user');
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  },
  setSession: ({ id, token, email, rol }) => {
    localStorage.setItem('spartan_token', token);
    localStorage.setItem('spartan_user', JSON.stringify({ id, email, rol }));
  },
  clear: () => {
    localStorage.removeItem('spartan_token');
    localStorage.removeItem('spartan_user');
  },
};

export async function apiRequest(path, options = {}) {
  const token = options.skipAuth ? null : authStorage.getToken();
  const sucursalId = localStorage.getItem('global_sucursal_id');
  const { skipAuth, ignoreSucursal, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sucursalId && !ignoreSucursal ? { 'X-Sucursal-Id': sucursalId } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      authStorage.clear();
      window.location.href = '/login';
      throw new Error('Sesion expirada. Por favor, inicia sesion de nuevo.');
    }
    const errorBody = await response.text();
    throw new Error(errorBody || `Error ${response.status} al conectar con la API`);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return response.text();

  return response.json();
}

export const authApi = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  solicitarRestablecimiento: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  restablecerPassword: ({ token, password }) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  }),
  registerSocio: ({ nombres, apellidos, email, password, telefono, sucursalId }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono, sucursalId }),
  }),
};

export const usuariosApi = {
  enviarEnlacePassword: (usuarioId) => apiRequest(`/usuarios/${usuarioId}/password-reset-link`, {
    method: 'POST',
  }),
  cambiarPassword: (usuarioId, password) => apiRequest(`/usuarios/${usuarioId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  }),
};

export const personalApi = {
  listar: () => apiRequest('/personal'),
  registrar: ({ nombres, apellidos, email, password, telefono, rol, especialidad, sucursalId }) => apiRequest('/personal/registrar', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono, rol, especialidad, sucursalId }),
  }),
  actualizarPerfil: (perfil) => apiRequest('/personal/me', {
    method: 'PUT',
    body: JSON.stringify(perfil),
  }),
  actualizarRol: (usuarioId, rol) => apiRequest(`/personal/${usuarioId}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  }),
  eliminar: (usuarioId) => apiRequest(`/personal/${usuarioId}`, { method: 'DELETE' }),
};

export const sociosApi = {
  listar: (options = {}) => apiRequest('/socios', options),
  estado: (socioId) => apiRequest(`/socios/estado/${socioId}`),
  registrar: ({ nombres, apellidos, email, password, telefono, sucursalId }) => authApi.registerSocio({
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
  listar: () => apiRequest('/rutinas'),
  crear: (rutina) => apiRequest('/rutinas', {
    method: 'POST',
    body: JSON.stringify(rutina),
  }),
  crearGlobal: (rutina) => apiRequest('/rutinas', {
    method: 'POST',
    body: JSON.stringify({ ...rutina, esGlobal: true, idSocio: null }),
  }),
};

export const membresiasApi = {
  tipos: () => apiRequest('/membresias/tipos'),
  crearTipo: ({ nombre, duracionDias, precio }) => apiRequest('/membresias/tipos', {
    method: 'POST',
    body: JSON.stringify({ nombre, duracionDias, precio }),
  }),
  eliminarTipo: (id) => apiRequest(`/membresias/tipos/${id}`, { method: 'DELETE' }),
  comprar: ({ tipoMembresiaId, metodoPago }) => apiRequest('/membresias/comprar', {
    method: 'POST',
    body: JSON.stringify({ tipoMembresiaId, metodoPago }),
  }),
};

export const pagosApi = {
  renovar: ({ idSocio, idTipoMembresia, metodoPago }) => apiRequest('/pagos/renovar', {
    method: 'POST',
    body: JSON.stringify({ idSocio, idTipoMembresia, metodoPago }),
  }),
};

export const asistenciasApi = {
  checkIn: (idSocio) => apiRequest('/asistencias/check-in', {
    method: 'POST',
    body: JSON.stringify({ idSocio }),
  }),
  qrValidacion: () => apiRequest('/asistencias/qr-validacion'),
  estadoQrValidacionPorToken: (token) => apiRequest('/asistencias/qr-validacion/estado', {
    method: 'POST',
    body: JSON.stringify({ token }),
    skipAuth: true,
  }),
  historialSocio: (socioId) => apiRequest(`/asistencias/socio/${socioId}`),
};

export const reportesApi = {
  resumen: () => apiRequest('/reportes/resumen'),
  generar: (tipo) => apiRequest('/reportes/generar', {
    method: 'POST',
    body: JSON.stringify({ tipo }),
  }),
};

export const inventarioApi = {
  listar: () => apiRequest('/inventario'),
  crear: (producto) => apiRequest('/inventario', {
    method: 'POST',
    body: JSON.stringify(producto),
  }),
  actualizar: (id, producto) => apiRequest(`/inventario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(producto),
  }),
  eliminar: (id) => apiRequest(`/inventario/${id}`, { method: 'DELETE' }),
};

export const ventasApi = {
  listarProductos: () => apiRequest('/ventas/productos'),
  venderProducto: (venta) => apiRequest('/ventas/productos', {
    method: 'POST',
    body: JSON.stringify(venta),
  }),
  facturaProducto: (id) => apiRequest(`/ventas/productos/${id}`),
};

export const sucursalesApi = {
  listar: () => apiRequest('/sucursales'),
  crear: (sucursal) => apiRequest('/sucursales', {
    method: 'POST',
    body: JSON.stringify(sucursal),
  }),
  actualizar: (id, sucursal) => apiRequest(`/sucursales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sucursal),
  }),
  eliminar: (id) => apiRequest(`/sucursales/${id}`, { method: 'DELETE' }),
};

export const finanzasApi = {
  listar: () => apiRequest('/finanzas'),
  crear: (movimiento) => apiRequest('/finanzas', {
    method: 'POST',
    body: JSON.stringify(movimiento),
  }),
};

export const operacionApi = {
  perfil: () => apiRequest('/operacion/me'),
  inicioRecepcion: () => apiRequest('/operacion/recepcion/inicio'),
  asistenciasRecientes: () => apiRequest('/operacion/asistencias/recientes'),
  pagos: () => apiRequest('/operacion/pagos'),
  membresias: () => apiRequest('/operacion/membresias'),
  notificaciones: () => apiRequest('/operacion/notificaciones'),
  marcarNotificacionLeida: (id) => apiRequest(`/operacion/notificaciones/${id}/leer`, { method: 'PATCH' }),
  pagosSocio: (socioId) => apiRequest(`/operacion/pagos/socio/${socioId}`),
  rutinasSocio: (socioId) => apiRequest(`/operacion/socio/${socioId}/rutinas`),
  entrenadorDashboard: () => apiRequest('/operacion/entrenador/dashboard'),
  entrenadorClientes: () => apiRequest('/operacion/entrenador/clientes'),
  entrenadorPerfil: () => apiRequest('/operacion/entrenador/perfil'),
};

export const configuracionApi = {
  obtener: () => apiRequest('/configuracion'),
  guardar: (configuracion) => apiRequest('/configuracion', {
    method: 'PUT',
    body: JSON.stringify(configuracion),
  }),
};

export const notificacionesApi = {
  listarGlobales: () => apiRequest('/notificaciones/globales'),
  crearGlobal: ({ tipo, titulo, mensaje }) => apiRequest('/notificaciones/globales', {
    method: 'POST',
    body: JSON.stringify({ tipo, titulo, mensaje }),
  }),
};
