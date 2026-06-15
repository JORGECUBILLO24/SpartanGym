import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_MEMBRESIAS = 'spartanGym.memberships';
export const EVENTO_MEMBRESIAS = 'spartanGym.membershipsChanged';

export const membresiasBase = [
  {
    id: 'MEM-BASE',
    nombrePlan: 'Basica',
    precio: '30',
    duracion: '1 Mes',
    beneficios: ['Acceso ilimitado', 'Vestidores'],
    popular: false,
  },
  {
    id: 'MEM-PREMIUM',
    nombrePlan: 'Premium',
    precio: '80',
    duracion: '3 Meses',
    beneficios: ['Acceso ilimitado', 'Asesoria nutricional', 'Clases grupales'],
    popular: true,
  },
  {
    id: 'MEM-ELITE',
    nombrePlan: 'Elite',
    precio: '150',
    duracion: '6 Meses',
    beneficios: ['Todo Premium', 'Acceso 24/7', 'Entrenador personal'],
    popular: false,
  },
];

const normalizarMembresia = (membresia) => ({
  id: membresia.id || `MEM-${Date.now()}`,
  nombrePlan: String(membresia.nombrePlan || '').trim(),
  precio: String(membresia.precio || '').trim(),
  duracion: membresia.duracion || 'Personalizada',
  beneficios: (membresia.beneficios || []).map((beneficio) => String(beneficio).trim()).filter(Boolean),
  popular: Boolean(membresia.popular),
  creadaEn: membresia.creadaEn || new Date().toISOString(),
});

const notificarCambioMembresias = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_MEMBRESIAS));
  }
};

export const leerMembresiasCompartidas = () => {
  const membresias = leerDatoLocal(CLAVE_MEMBRESIAS, membresiasBase);

  return Array.isArray(membresias) && membresias.length
    ? membresias.map(normalizarMembresia)
    : membresiasBase;
};

export const guardarMembresiasCompartidas = (membresias) => {
  const membresiasNormalizadas = membresias.map(normalizarMembresia);
  guardarDatoLocal(CLAVE_MEMBRESIAS, membresiasNormalizadas);
  notificarCambioMembresias();

  return membresiasNormalizadas;
};

export const agregarMembresiaCompartida = (membresia) => {
  const nuevaMembresia = normalizarMembresia({
    ...membresia,
    id: `MEM-${Date.now()}`,
  });
  const membresias = [nuevaMembresia, ...leerMembresiasCompartidas()];

  return guardarMembresiasCompartidas(membresias);
};

export const eliminarMembresiaCompartida = (id) => {
  const membresias = leerMembresiasCompartidas().filter((membresia) => membresia.id !== id);

  return guardarMembresiasCompartidas(membresias.length ? membresias : membresiasBase);
};

export const formatearPrecioMembresia = (precio) => {
  const precioNumerico = Number(precio);

  return Number.isFinite(precioNumerico) ? `$${precioNumerico.toFixed(2)}` : '$0.00';
};

export const obtenerEtiquetaMembresia = (membresia) =>
  `${membresia.nombrePlan} (${membresia.duracion}) - ${formatearPrecioMembresia(membresia.precio)}`;
