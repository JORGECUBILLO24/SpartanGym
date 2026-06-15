import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';
import { leerCuentaActual } from './cuentaActual';

export const CLAVE_SOCIOS = 'spartanGym.members';
export const EVENTO_SOCIOS = 'spartanGym.membersChanged';

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const normalizarTelefono = (valor) => String(valor || '').replace(/\D/g, '');

export const sociosBase = [
  {
    id: 'SOC-BASE-001',
    nombre: 'Carlos',
    apellido: 'Ramirez',
    correo: 'carlos@spartangym.com',
    telefono: '+505 8888 1001',
    membresia: 'Elite',
    sucursal: 'SpartanGym Central',
    creadoPorRol: 'Administrador',
    creadoPor: 'admin@spartangym.com',
    creadoEn: '2026-06-01T10:00:00.000Z',
    estado: 'Activo',
  },
  {
    id: 'SOC-BASE-002',
    nombre: 'Ana',
    apellido: 'Torres',
    correo: 'ana@spartangym.com',
    telefono: '+505 8888 1002',
    membresia: 'Basica',
    sucursal: 'Gym San Rafael',
    creadoPorRol: 'Recepcionista',
    creadoPor: 'recepcion@spartangym.com',
    creadoEn: '2026-06-02T16:30:00.000Z',
    estado: 'Activo',
  },
];

const normalizarSocio = (socio) => ({
  id: socio.id || `SOC-${Date.now()}`,
  nombre: String(socio.nombre || '').trim(),
  apellido: String(socio.apellido || '').trim(),
  correo: String(socio.correo || '').trim(),
  telefono: String(socio.telefono || '').trim(),
  membresia: String(socio.membresia || '').trim(),
  sucursal: socio.sucursal === 'SpartanGym San Rafael' ? 'Gym San Rafael' : socio.sucursal || 'SpartanGym Central',
  creadoPorRol: socio.creadoPorRol || 'Sistema',
  creadoPor: socio.creadoPor || 'Cuenta local',
  creadoEn: socio.creadoEn || new Date().toISOString(),
  estado: socio.estado || 'Activo',
});

const notificarCambioSocios = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_SOCIOS));
  }
};

export const leerSociosCompartidos = () => {
  const socios = leerDatoLocal(CLAVE_SOCIOS, sociosBase);

  return Array.isArray(socios) && socios.length ? socios.map(normalizarSocio) : sociosBase;
};

export const guardarSociosCompartidos = (socios) => {
  const sociosNormalizados = socios.map(normalizarSocio);
  guardarDatoLocal(CLAVE_SOCIOS, sociosNormalizados);
  notificarCambioSocios();

  return sociosNormalizados;
};

export const buscarDuplicadoSocio = (socio, socios = leerSociosCompartidos()) => {
  const correo = normalizarTexto(socio.correo);
  const telefono = normalizarTelefono(socio.telefono);
  const nombreCompleto = normalizarTexto(`${socio.nombre} ${socio.apellido}`);

  return socios.find((existente) => {
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

export const agregarSocioCompartido = (socio) => {
  const cuenta = leerCuentaActual();
  const socios = leerSociosCompartidos();
  const duplicado = buscarDuplicadoSocio(socio, socios);

  if (duplicado) {
    return {
      ok: false,
      mensaje: `Este socio ya existe: ${duplicado.nombre} ${duplicado.apellido}.`,
      socios,
      duplicado,
    };
  }

  const nuevoSocio = normalizarSocio({
    ...socio,
    id: `SOC-${Date.now()}`,
    creadoPorRol: cuenta.role || 'Sistema',
    creadoPor: cuenta.username || cuenta.email || cuenta.name || 'Cuenta local',
  });
  const sociosActualizados = guardarSociosCompartidos([nuevoSocio, ...socios]);

  return {
    ok: true,
    mensaje: 'Socio guardado y sincronizado.',
    socios: sociosActualizados,
    socio: nuevoSocio,
  };
};

export const obtenerNombreSocio = (socio) => [socio.nombre, socio.apellido].filter(Boolean).join(' ');
