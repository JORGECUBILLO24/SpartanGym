import LogoAccesoDefecto from '../assets/Logo SpartanGym.webp';
import LogoPrincipalDefecto from '../assets/Logo Web.webp';
import FondoLoginDefecto from '../assets/fondo_login.webp';
import { useConfiguracionApp } from './configuracionApp';

export const LOGOS_APP_DEFECTO = {
  principal: LogoPrincipalDefecto,
  acceso: LogoAccesoDefecto,
  fondoLogin: FondoLoginDefecto,
};

export const obtenerLogosApp = (configuracion = {}) => ({
  principal: configuracion.logoPrincipal || LOGOS_APP_DEFECTO.principal,
  acceso: configuracion.logoAcceso || LOGOS_APP_DEFECTO.acceso,
  fondoLogin: configuracion.fondoLogin || LOGOS_APP_DEFECTO.fondoLogin,
});

export const useLogosApp = () => obtenerLogosApp(useConfiguracionApp());
