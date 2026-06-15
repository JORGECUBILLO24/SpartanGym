import { leerDatoLocal } from './almacenamientoLocal';

export const CLAVE_MENSAJES_GLOBALES = 'spartanGym.globalMessages';
export const EVENTO_MENSAJES_GLOBALES = 'spartanGym.globalMessagesChanged';

export const leerMensajesGlobales = () => {
  const mensajes = leerDatoLocal(CLAVE_MENSAJES_GLOBALES, []);

  return Array.isArray(mensajes) ? mensajes : [];
};

export const guardarMensajeGlobal = (mensaje) => {
  if (typeof window === 'undefined') return [];

  const mensajes = [mensaje, ...leerMensajesGlobales()].slice(0, 30);
  window.localStorage.setItem(CLAVE_MENSAJES_GLOBALES, JSON.stringify(mensajes));
  window.dispatchEvent(new Event(EVENTO_MENSAJES_GLOBALES));

  return mensajes;
};

export const formatearHoraMensaje = (fechaEntrada) => {
  const fecha = fechaEntrada ? new Date(fechaEntrada) : new Date();

  if (Number.isNaN(fecha.getTime())) return 'Ahora';

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
};
