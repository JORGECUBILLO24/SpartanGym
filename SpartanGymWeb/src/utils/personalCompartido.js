import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';
import { leerCuentaActual } from './cuentaActual';
import { obtenerGimnasioPredeterminado } from './gimnasiosCompartidos';

export const CLAVE_PERSONAL = 'spartanGym.staff';
export const EVENTO_PERSONAL = 'spartanGym.staffChanged';

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const normalizarTelefono = (valor) => String(valor || '').replace(/\D/g, '');

const obtenerIdentidadesCuenta = (cuenta = leerCuentaActual()) => (
  [cuenta.username, cuenta.email, cuenta.name]
    .map(normalizarTexto)
    .filter(Boolean)
);

export const personalBase = [
  {
    id: 'PER-BASE-001',
    nombre: 'Andrea',
    apellido: 'Mejia',
    correo: 'andrea@spartangym.com',
    telefono: '+505 8888 2001',
    rol: 'Administrador',
    cargo: 'Admin sucursal',
    gimnasio: 'SpartanGym Carretera Sur',
    estado: 'Activo',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-01T11:00:00.000Z',
  },
  {
    id: 'PER-BASE-002',
    nombre: 'Carlos',
    apellido: 'Rivas',
    correo: 'carlos.staff@spartangym.com',
    telefono: '+505 8888 2002',
    rol: 'Administrador',
    cargo: 'Admin inventario',
    gimnasio: 'SpartanGym Central',
    estado: 'Activo',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'PER-BASE-003',
    nombre: 'Valeria',
    apellido: 'Soto',
    correo: 'valeria@spartangym.com',
    telefono: '+505 8888 2003',
    rol: 'Administrador',
    cargo: 'Admin caja',
    gimnasio: 'SpartanGym Masaya',
    estado: 'Activo',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-01T13:00:00.000Z',
  },
  {
    id: 'PER-BASE-004',
    nombre: 'Marco',
    apellido: 'Salinas',
    correo: 'marco@spartangym.com',
    telefono: '+505 8888 3001',
    rol: 'Entrenador',
    especialidad: 'Fuerza',
    gimnasio: 'SpartanGym Central',
    estado: 'Turno tarde',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'PER-BASE-005',
    nombre: 'Diana',
    apellido: 'Lopez',
    correo: 'diana@spartangym.com',
    telefono: '+505 8888 3002',
    rol: 'Entrenador',
    especialidad: 'Funcional',
    gimnasio: 'SpartanGym Carretera Sur',
    estado: 'Turno manana',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-02T11:00:00.000Z',
  },
  {
    id: 'PER-BASE-006',
    nombre: 'Roberto',
    apellido: 'Cruz',
    correo: 'roberto@spartangym.com',
    telefono: '+505 8888 3003',
    rol: 'Entrenador',
    especialidad: 'Hipertrofia',
    gimnasio: 'SpartanGym Masaya',
    estado: 'Turno tarde',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-02T12:00:00.000Z',
  },
  {
    id: 'PER-BASE-007',
    nombre: 'Karla',
    apellido: 'Mena',
    correo: 'karla@spartangym.com',
    telefono: '+505 8888 3004',
    rol: 'Entrenador',
    especialidad: 'Movilidad',
    gimnasio: 'SpartanGym Leon',
    estado: 'Turno mixto',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-02T13:00:00.000Z',
  },
  {
    id: 'PER-BASE-008',
    nombre: 'Jorge',
    apellido: 'Cubillo',
    correo: 'jorge@spartangym.com',
    telefono: '+505 8888 4001',
    rol: 'Recepcionista',
    cargo: 'Recepcionista',
    gimnasio: 'SpartanGym Central',
    estado: 'Turno manana',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-03T08:00:00.000Z',
  },
  {
    id: 'PER-BASE-009',
    nombre: 'Anthony',
    apellido: 'Flores',
    correo: 'anthony@spartangym.com',
    telefono: '+505 8888 4002',
    rol: 'Recepcionista',
    cargo: 'Recepcionista',
    gimnasio: 'Gym San Rafael',
    estado: 'Turno tarde',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-03T09:00:00.000Z',
  },
  {
    id: 'PER-BASE-010',
    nombre: 'Mariela',
    apellido: 'Gomez',
    correo: 'mariela@spartangym.com',
    telefono: '+505 8888 4003',
    rol: 'Recepcionista',
    cargo: 'Recepcionista',
    gimnasio: 'SpartanGym Carretera Sur',
    estado: 'Turno mixto',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-03T10:00:00.000Z',
  },
];

const notificarCambioPersonal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_PERSONAL));
  }
};

const normalizarPersonal = (persona) => ({
  id: persona.id || `PER-${Date.now()}`,
  nombre: String(persona.nombre || '').trim(),
  apellido: String(persona.apellido || '').trim(),
  correo: String(persona.correo || '').trim(),
  telefono: String(persona.telefono || '').trim(),
  rol: String(persona.rol || '').trim(),
  password: String(persona.password || '').trim(),
  cargo: String(persona.cargo || '').trim(),
  especialidad: String(persona.especialidad || '').trim(),
  gimnasio: persona.gimnasio || obtenerGimnasioPredeterminado(),
  estado: persona.estado || 'Activo',
  creadoPor: persona.creadoPor || 'Cuenta local',
  creadoEn: persona.creadoEn || new Date().toISOString(),
});

export const leerPersonalCompartido = () => {
  const personal = leerDatoLocal(CLAVE_PERSONAL, personalBase);

  return Array.isArray(personal) ? personal.map(normalizarPersonal) : personalBase;
};

export const guardarPersonalCompartido = (personal) => {
  const personalNormalizado = personal.map(normalizarPersonal);
  guardarDatoLocal(CLAVE_PERSONAL, personalNormalizado);
  notificarCambioPersonal();

  return personalNormalizado;
};

export const buscarDuplicadoPersonal = (persona, personal = leerPersonalCompartido()) => {
  const correo = normalizarTexto(persona.correo);
  const telefono = normalizarTelefono(persona.telefono);
  const nombreCompleto = normalizarTexto(`${persona.nombre} ${persona.apellido}`);

  return personal.find((existente) => {
    const correoExistente = normalizarTexto(existente.correo);
    const telefonoExistente = normalizarTelefono(existente.telefono);
    const nombreExistente = normalizarTexto(`${existente.nombre} ${existente.apellido}`);

    return (
      (correo && correo === correoExistente) ||
      (telefono && telefono.length >= 7 && telefono === telefonoExistente) ||
      (nombreCompleto && nombreCompleto === nombreExistente)
    );
  });
};

export const agregarPersonalCompartido = (persona) => {
  const cuenta = leerCuentaActual();
  const personal = leerPersonalCompartido();
  const duplicado = buscarDuplicadoPersonal(persona, personal);

  if (duplicado) {
    return {
      ok: false,
      mensaje: `Este usuario ya existe: ${duplicado.nombre} ${duplicado.apellido}.`,
      personal,
      duplicado,
    };
  }

  const nuevoPersonal = normalizarPersonal({
    ...persona,
    id: `PER-${Date.now()}`,
    cargo: persona.rol === 'Administrador' ? 'Admin sucursal' : persona.rol,
    especialidad: persona.rol === 'Entrenador' ? 'Entrenador general' : '',
    creadoPor: cuenta.username || cuenta.email || cuenta.name || 'Cuenta local',
  });
  const personalActualizado = guardarPersonalCompartido([nuevoPersonal, ...personal]);

  return {
    ok: true,
    mensaje: 'Usuario guardado y asignado al gimnasio.',
    personal: personalActualizado,
    persona: nuevoPersonal,
  };
};

export const personalCreadoPorCuentaActual = (persona, cuenta = leerCuentaActual()) => {
  const creadoPor = normalizarTexto(persona.creadoPor);
  const identidadesCuenta = obtenerIdentidadesCuenta(cuenta);

  return Boolean(creadoPor && identidadesCuenta.includes(creadoPor));
};

export const eliminarPersonalCompartido = (id) => {
  const cuenta = leerCuentaActual();
  const personal = leerPersonalCompartido();
  const persona = personal.find((item) => item.id === id);

  if (!persona) {
    return {
      ok: false,
      mensaje: 'No encontramos ese usuario para eliminar.',
      personal,
    };
  }

  if (!personalCreadoPorCuentaActual(persona, cuenta)) {
    return {
      ok: false,
      mensaje: 'Solo puedes eliminar usuarios creados por tu cuenta.',
      personal,
      persona,
    };
  }

  const personalActualizado = guardarPersonalCompartido(personal.filter((item) => item.id !== id));

  return {
    ok: true,
    mensaje: `${persona.nombre} ${persona.apellido} fue eliminado del sistema.`,
    personal: personalActualizado,
    persona,
  };
};

export const obtenerNombrePersonal = (persona) =>
  [persona.nombre, persona.apellido].filter(Boolean).join(' ');
