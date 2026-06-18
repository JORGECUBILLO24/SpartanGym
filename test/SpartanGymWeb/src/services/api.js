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
  setSession: ({ token, email, rol }) => {
    localStorage.setItem('spartan_token', token);
    localStorage.setItem('spartan_user', JSON.stringify({ email, rol }));
  },
  clear: () => {
    localStorage.removeItem('spartan_token');
    localStorage.removeItem('spartan_user');
  },
};

export async function apiRequest(path, options = {}) {
  const token = authStorage.getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
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
  registerSocio: ({ nombres, apellidos, email, password, telefono }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono }),
  }),
};

export const personalApi = {
  listar: () => apiRequest('/personal'),
  registrar: ({ nombres, apellidos, email, password, telefono, rol, especialidad }) => apiRequest('/personal/registrar', {
    method: 'POST',
    body: JSON.stringify({ nombres, apellidos, email, password, telefono, rol, especialidad }),
  }),
  actualizarRol: (usuarioId, rol) => apiRequest(`/personal/${usuarioId}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  }),
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
  eliminar: (id) => apiRequest(`/inventario/${id}`, { method: 'DELETE' }),
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
  rutinasSocio: (socioId) => apiRequest(`/operacion/socio/${socioId}/rutinas`),
  entrenadorDashboard: () => apiRequest('/operacion/entrenador/dashboard'),
  entrenadorClientes: () => apiRequest('/operacion/entrenador/clientes'),
  entrenadorPerfil: () => apiRequest('/operacion/entrenador/perfil'),
};
