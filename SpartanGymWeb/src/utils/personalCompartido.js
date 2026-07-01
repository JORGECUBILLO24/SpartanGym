export const EVENTO_PERSONAL = 'evento_personal';

const clavePersonal = 'spartan_gym_personal';

export const leerPersonalCompartido = () => {
  const data = localStorage.getItem(clavePersonal);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const eliminarPersonalCompartido = (id) => {
  let personal = leerPersonalCompartido();
  personal = personal.filter((p) => p.id !== id);
  localStorage.setItem(clavePersonal, JSON.stringify(personal));
  window.dispatchEvent(new Event(EVENTO_PERSONAL));
  return { personal };
};

export const obtenerNombrePersonal = (persona) => {
  if (!persona) return 'Desconocido';
  return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim();
};

export const personalCreadoPorCuentaActual = (personal, cuentaId) => {
  if (!personal) return [];
  return personal.filter((p) => p.creadoPor === cuentaId);
};
