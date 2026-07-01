import { useEffect, useState } from 'react';
import { guardarDatoLocal, leerDatoLocal } from './almacenamientoLocal';
import { aplicarPreferenciaTema, CLAVE_CONFIGURACION } from './tema';
import { configuracionApi } from '../services/api';

export const EVENTO_CONFIGURACION = 'spartanGym.settingsChanged';

export const COLORES_APARIENCIA_DEFECTO = {
  accentColor: '#e50914',
  accentHoverColor: '#b91c1c',
  accentSoftColor: '#450a0a',
};

export const MONEDAS_DISPONIBLES = [
  { codigo: 'NIO', nombre: 'Cordobas', simbolo: 'C$', locale: 'es-NI' },
  { codigo: 'USD', nombre: 'Dolares', simbolo: '$', locale: 'en-US' },
  { codigo: 'EUR', nombre: 'Euros', simbolo: 'EUR', locale: 'es-ES' },
  { codigo: 'MXN', nombre: 'Pesos mexicanos', simbolo: '$', locale: 'es-MX' },
  { codigo: 'CRC', nombre: 'Colones costarricenses', simbolo: 'CRC', locale: 'es-CR' },
  { codigo: 'HNL', nombre: 'Lempiras hondurenos', simbolo: 'L', locale: 'es-HN' },
  { codigo: 'GTQ', nombre: 'Quetzales', simbolo: 'Q', locale: 'es-GT' },
  { codigo: 'COP', nombre: 'Pesos colombianos', simbolo: '$', locale: 'es-CO' },
];

export const CONFIGURACION_DEFECTO = {
  gymName: 'Spartan Gym',
  email: 'admin@spartangym.com',
  phone: '+505 0000 0000',
  currency: 'USD',
  taxRate: '15',
  theme: 'system',
  themeSource: 'system',
  ...COLORES_APARIENCIA_DEFECTO,
  logoPrincipal: '',
  logoAcceso: '',
  fondoLogin: '',
  emailAlerts: true,
  smsAlerts: false,
  dailyReports: true,
  twoFactor: false,
  sessionTimeout: '30',
};

const hexAEntero = (hex) => Number.parseInt(hex, 16);

const normalizarHex = (valor, respaldo = COLORES_APARIENCIA_DEFECTO.accentColor) => {
  const texto = String(valor || '').trim();
  const hex = texto.startsWith('#') ? texto.slice(1) : texto;

  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : respaldo;
};

const hexARgb = (valor) => {
  const hex = normalizarHex(valor).slice(1);

  return {
    r: hexAEntero(hex.slice(0, 2)),
    g: hexAEntero(hex.slice(2, 4)),
    b: hexAEntero(hex.slice(4, 6)),
  };
};

const rgbAHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((canal) => Math.max(0, Math.min(255, Math.round(canal))).toString(16).padStart(2, '0'))
    .join('')}`;

const mezclarColor = (color, destino, pesoDestino) => {
  const base = hexARgb(color);
  const final = hexARgb(destino);
  const pesoBase = 1 - pesoDestino;

  return rgbAHex({
    r: base.r * pesoBase + final.r * pesoDestino,
    g: base.g * pesoBase + final.g * pesoDestino,
    b: base.b * pesoBase + final.b * pesoDestino,
  });
};

export const crearPaletaApariencia = (configuracion = {}) => {
  const accentColor = normalizarHex(configuracion.accentColor);
  const accentHoverColor = normalizarHex(
    configuracion.accentHoverColor,
    mezclarColor(accentColor, '#000000', 0.18)
  );
  const accentSoftColor = normalizarHex(
    configuracion.accentSoftColor,
    mezclarColor(accentColor, '#000000', 0.62)
  );
  const { r, g, b } = hexARgb(accentColor);

  return {
    accentColor,
    accentHoverColor,
    accentSoftColor,
    accentRgb: `${r}, ${g}, ${b}`,
  };
};

export const leerConfiguracionApp = () => ({
  ...CONFIGURACION_DEFECTO,
  ...leerDatoLocal(CLAVE_CONFIGURACION, {}),
});

export const guardarConfiguracionApp = (configuracion) => {
  const configuracionGuardada = guardarDatoLocal(CLAVE_CONFIGURACION, {
    ...leerConfiguracionApp(),
    ...configuracion,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_CONFIGURACION));
  }

  return configuracionGuardada;
};

export const obtenerMonedaActual = () => {
  const codigo = leerConfiguracionApp().currency;

  return MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === codigo) || MONEDAS_DISPONIBLES[1];
};

export const obtenerSimboloMoneda = () => obtenerMonedaActual().simbolo;

export const formatearMoneda = (valor, codigoMoneda) => {
  const moneda = MONEDAS_DISPONIBLES.find((item) => item.codigo === codigoMoneda) || obtenerMonedaActual();
  const numero = Number(valor);

  return new Intl.NumberFormat(moneda.locale, {
    style: 'currency',
    currency: moneda.codigo,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

export const obtenerMontoNumerico = (monto) => {
  if (typeof monto === 'number') return Number.isFinite(monto) ? monto : 0;

  const limpio = String(monto ?? '').trim().replace(/[^0-9,.-]/g, '');
  if (!limpio) return 0;

  const ultimaComa = limpio.lastIndexOf(',');
  const ultimoPunto = limpio.lastIndexOf('.');
  let normalizado = limpio;

  if (ultimaComa > -1 && ultimoPunto > -1) {
    normalizado = ultimaComa > ultimoPunto
      ? limpio.replace(/\./g, '').replace(',', '.')
      : limpio.replace(/,/g, '');
  } else if (ultimaComa > -1) {
    const decimales = limpio.length - ultimaComa - 1;
    normalizado = decimales > 0 && decimales <= 2
      ? limpio.replace(',', '.')
      : limpio.replace(/,/g, '');
  } else if (ultimoPunto > -1) {
    const decimales = limpio.length - ultimoPunto - 1;
    normalizado = decimales > 2 ? limpio.replace(/\./g, '') : limpio;
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : 0;
};

const PATRON_MONTO_DOLAR_BASE = /(^|[^A-Za-z])\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/g;

export const convertirTextoMoneda = (texto) =>
  String(texto ?? '').replace(PATRON_MONTO_DOLAR_BASE, (_, prefijo, valor) =>
    `${prefijo}${formatearMoneda(Number(valor.replaceAll(',', '')))}`
  );

export const aplicarApariencia = (configuracion = leerConfiguracionApp()) => {
  if (typeof document === 'undefined') return crearPaletaApariencia(configuracion);

  const paleta = crearPaletaApariencia(configuracion);
  const raiz = document.documentElement;

  raiz.style.setProperty('--accent-color', paleta.accentColor);
  raiz.style.setProperty('--accent-hover-color', paleta.accentHoverColor);
  raiz.style.setProperty('--accent-soft-color', paleta.accentSoftColor);
  raiz.style.setProperty('--accent-rgb', paleta.accentRgb);

  return paleta;
};

export const sincronizarConfiguracionRemota = async () => {
  try {
    const configuracionRemota = await configuracionApi.obtener();

    if (!configuracionRemota || typeof configuracionRemota !== 'object') {
      return leerConfiguracionApp();
    }

    const configuracion = guardarConfiguracionApp(configuracionRemota);
    aplicarPreferenciaTema(configuracion.theme);
    aplicarApariencia(configuracion);
    return configuracion;
  } catch {
    return leerConfiguracionApp();
  }
};

export const useConfiguracionApp = () => {
  const [configuracion, setConfiguracion] = useState(leerConfiguracionApp);

  useEffect(() => {
    const actualizar = () => setConfiguracion(leerConfiguracionApp());

    window.addEventListener('storage', actualizar);
    window.addEventListener(EVENTO_CONFIGURACION, actualizar);

    return () => {
      window.removeEventListener('storage', actualizar);
      window.removeEventListener(EVENTO_CONFIGURACION, actualizar);
    };
  }, []);

  return configuracion;
};
