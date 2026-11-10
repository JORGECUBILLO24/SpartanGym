import LogoAccesoDefecto from '../assets/Logo SpartanGym.webp';
import LogoPrincipalDefecto from '../assets/Logo Web.webp';
import FondoLoginDefecto from '../assets/fondo_login.webp';
import { obtenerNombreGimnasio, useConfiguracionApp } from './configuracionApp';

export const LOGOS_APP_DEFECTO = {
  principal: LogoPrincipalDefecto,
  acceso: LogoAccesoDefecto,
  fondoLogin: FondoLoginDefecto,
};

const correspondeAlNombreActual = (logo, nombreGuardado, nombreActual) => {
  if (!logo) return false;
  if (!nombreGuardado) return nombreActual.toLowerCase() === 'spartan gym';
  return String(nombreGuardado).trim().toLowerCase() === nombreActual.trim().toLowerCase();
};

export const obtenerLogosApp = (configuracion = {}) => {
  const nombre = obtenerNombreGimnasio(configuracion);
  const logoPrincipalValido = correspondeAlNombreActual(configuracion.logoPrincipal, configuracion.logoPrincipalNombre, nombre);
  const logoAccesoValido = correspondeAlNombreActual(configuracion.logoAcceso, configuracion.logoAccesoNombre, nombre);
  const esMarcaPredeterminada = nombre.toLowerCase() === 'spartan gym';
  const principal = logoPrincipalValido
    ? configuracion.logoPrincipal
    : esMarcaPredeterminada ? LOGOS_APP_DEFECTO.principal : '';
  const acceso = logoAccesoValido
    ? configuracion.logoAcceso
    : principal || (esMarcaPredeterminada ? LOGOS_APP_DEFECTO.acceso : '');

  return {
    principal,
    acceso,
    fondoLogin: configuracion.fondoLogin || LOGOS_APP_DEFECTO.fondoLogin,
  };
};

export const useLogosApp = () => obtenerLogosApp(useConfiguracionApp());
