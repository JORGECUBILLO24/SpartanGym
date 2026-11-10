/**
 * Modelos de dominio para la migración gradual a React + TypeScript.
 * Reflejan los DTO/entidades de SpartanGymAPI; se amplían a medida que se tipan más pantallas.
 */
export type Rol =
  | 'ROLE_SUPERADMIN'
  | 'ROLE_ADMIN'
  | 'ROLE_RECEPCIONISTA'
  | 'ROLE_ENTRENADOR'
  | 'ROLE_SOCIO';

export type Identificador = string;

/** Respuesta de POST /api/auth/login (AuthResponse). */
export interface SesionUsuario {
  id: Identificador;
  email: string;
  rol: Rol;
  token: string;
}

/** Usuario que el cliente deja en localStorage ("spartan_user"): la sesión sin el token. */
export type UsuarioGuardado = Pick<SesionUsuario, 'id' | 'email' | 'rol'>;

/** Cuerpo de error RFC 9457 (application/problem+json) con el `codigo` estable de la API. */
export interface ApiProblem {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  codigo?: string | null;
}

/** Entidad Sucursal de la API. */
export interface Sucursal {
  id: Identificador;
  nombre: string;
  ubicacion: string;
  telefono?: string | null;
  capacidad: number;
  horarioApertura: string;
  horarioCierre: string;
  estado: string;
  fechaCreacion?: string;
}

export type SucursalResumen = Pick<Sucursal, 'id' | 'nombre' | 'ubicacion' | 'estado'>;

/** Respuesta pública de GET /api/sucursales/disponibles. */
export type SucursalDisponible = Pick<Sucursal, 'id' | 'nombre'>;

/** Plan de membresía (TipoMembresia). */
export interface TipoMembresia {
  id: number;
  nombre: string;
  duracionDias: number;
  precio: number;
  imagenUrl?: string | null;
  beneficios?: string | null;
}
