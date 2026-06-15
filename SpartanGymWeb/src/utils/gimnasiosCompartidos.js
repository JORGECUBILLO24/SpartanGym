export const gimnasiosDisponibles = [
  {
    id: 'central',
    nombre: 'SpartanGym Central',
    ciudad: 'Managua',
    estado: 'Activo',
    usuarios: 520,
    personal: 18,
    efectivoDia: 18450,
    ventas: 42100,
    pagosPendientes: 8,
    asistencias: 214,
  },
  {
    id: 'carretera-sur',
    nombre: 'SpartanGym Carretera Sur',
    ciudad: 'Managua',
    estado: 'Activo',
    usuarios: 316,
    personal: 11,
    efectivoDia: 9720,
    ventas: 23850,
    pagosPendientes: 5,
    asistencias: 126,
  },
  {
    id: 'masaya',
    nombre: 'SpartanGym Masaya',
    ciudad: 'Masaya',
    estado: 'Activo',
    usuarios: 248,
    personal: 9,
    efectivoDia: 6850,
    ventas: 17320,
    pagosPendientes: 4,
    asistencias: 98,
  },
  {
    id: 'leon',
    nombre: 'SpartanGym Leon',
    ciudad: 'Leon',
    estado: 'Expansion',
    usuarios: 164,
    personal: 7,
    efectivoDia: 4320,
    ventas: 12100,
    pagosPendientes: 3,
    asistencias: 76,
  },
  {
    id: 'san-rafael',
    nombre: 'Gym San Rafael',
    ciudad: 'San Rafael',
    estado: 'Activo',
    usuarios: 24,
    personal: 4,
    efectivoDia: 12222,
    ventas: 32323,
    pagosPendientes: 2,
    asistencias: 38,
  },
];

export const obtenerGimnasioPredeterminado = () => gimnasiosDisponibles[0]?.nombre || 'SpartanGym Central';

export const leerGimnasiosDisponibles = () => gimnasiosDisponibles;

export const obtenerGimnasioPorNombre = (nombre) =>
  gimnasiosDisponibles.find((gimnasio) => gimnasio.nombre === nombre) || gimnasiosDisponibles[0];
