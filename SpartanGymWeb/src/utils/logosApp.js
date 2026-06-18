import LogoAccesoDefecto from '../assets/Logo SpartanGym.webp';
import LogoPrincipalDefecto from '../assets/Logo Web.webp';
import { useConfiguracionApp } from './configuracionApp';

export const LOGOS_APP_DEFECTO = {
  principal: LogoPrincipalDefecto,
  acceso: LogoAccesoDefecto,
};

export const obtenerLogosApp = (configuracion = {}) => ({
  principal: configuracion.logoPrincipal || LOGOS_APP_DEFECTO.principal,
  acceso: configuracion.logoAcceso || LOGOS_APP_DEFECTO.acceso,
});

export const useLogosApp = () => obtenerLogosApp(useConfiguracionApp());
