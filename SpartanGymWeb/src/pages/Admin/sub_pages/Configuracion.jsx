import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Database,
  Globe,
  Image as ImageIcon,
  Lock,
  Mail,
  MonitorSmartphone,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  Smartphone,
  Store,
  Sun,
  UploadCloud,
} from 'lucide-react';
import {
  aplicarApariencia,
  CONFIGURACION_DEFECTO,
  guardarConfiguracionApp,
  leerConfiguracionApp,
  MONEDAS_DISPONIBLES,
  sincronizarConfiguracionRemota,
} from '../../../utils/configuracionApp';
import { LOGOS_APP_DEFECTO, obtenerLogosApp } from '../../../utils/logosApp';
import { aplicarPreferenciaTema, obtenerPreferenciaTemaGuardada } from '../../../utils/tema';
import { authStorage, configuracionApi } from '../../../services/api';

const cargarConfigInicial = () => {
  const configuracionGuardada = leerConfiguracionApp();
  const theme = obtenerPreferenciaTemaGuardada();

  return {
    ...CONFIGURACION_DEFECTO,
    ...configuracionGuardada,
    theme,
    themeSource: theme === 'system' ? 'system' : 'user',
  };
};

const TAMANO_MAXIMO_LOGO = 4 * 1024 * 1024;

const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = rechazar;
    lector.readAsDataURL(archivo);
  });

const cargarImagenDesdeDataUrl = (dataUrl) =>
  new Promise((resolver, rechazar) => {
    const imagen = new window.Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = dataUrl;
  });

const prepararLogo = async (archivo, { maxWidth, maxHeight }) => {
  if (!archivo?.type?.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.');
  }

  if (archivo.size > TAMANO_MAXIMO_LOGO) {
    throw new Error('La imagen no debe superar 4 MB.');
  }

  const dataUrl = await leerArchivoComoDataUrl(archivo);

  if (typeof document === 'undefined') {
    return dataUrl;
  }

  const imagen = await cargarImagenDesdeDataUrl(dataUrl);
  const escala = Math.min(1, maxWidth / imagen.width, maxHeight / imagen.height);
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));
  const canvas = document.createElement('canvas');
  const contexto = canvas.getContext('2d');

  canvas.width = ancho;
  canvas.height = alto;
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  return canvas.toDataURL('image/webp', 0.9);
};

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [config, setConfig] = useState(cargarConfigInicial);
  const logosVigentes = obtenerLogosApp(config);
  const nombreGimnasio = String(config.gymName || '').trim() || CONFIGURACION_DEFECTO.gymName;
  const monedaSeleccionada = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === config.currency) || MONEDAS_DISPONIBLES[1];
  const rolActual = String(authStorage.getUser()?.rol || '').toUpperCase();
  const esSuperAdmin = rolActual === 'ROLE_SUPERADMIN' || rolActual === 'SUPERADMIN';
  const nombreApp = String(config.appName || '').trim() || nombreGimnasio;
  const logoAppNombre = String(config.appLogoNombre || '').trim();
  const logoAppVigente = (logoAppNombre
    ? logoAppNombre.toLowerCase() === nombreApp.toLowerCase()
    : nombreApp.toLowerCase() === 'spartan gym') ? config.appLogo : '';
  const {
    theme,
    accentColor,
    accentHoverColor,
    accentSoftColor,
  } = config;
  const usaAparienciaPredeterminada =
    theme === CONFIGURACION_DEFECTO.theme &&
    String(accentColor).toLowerCase() === CONFIGURACION_DEFECTO.accentColor &&
    String(accentHoverColor).toLowerCase() === CONFIGURACION_DEFECTO.accentHoverColor &&
    String(accentSoftColor).toLowerCase() === CONFIGURACION_DEFECTO.accentSoftColor;

  useEffect(() => {
    sincronizarConfiguracionRemota().then((configuracion) => {
      setConfig((configActual) => ({
        ...configActual,
        ...configuracion,
        theme: configuracion.theme || configActual.theme,
        themeSource: configuracion.themeSource || configActual.themeSource,
      }));
    });
  }, []);

  useEffect(() => {
    const apariencia = {
      theme,
      accentColor,
      accentHoverColor,
      accentSoftColor,
    };

    aplicarPreferenciaTema(theme);
    aplicarApariencia(apariencia);
    guardarConfiguracionApp({
      theme,
      themeSource: theme === 'system' ? 'system' : 'user',
      accentColor,
      accentHoverColor,
      accentSoftColor,
    });
  }, [theme, accentColor, accentHoverColor, accentSoftColor]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfig({ ...config, [e.target.name]: value });
  };

  const actualizarColor = (nombre, valor) => {
    const nuevaConfig = { ...config, [nombre]: valor };
    setConfig(nuevaConfig);
    aplicarApariencia(nuevaConfig);
  };

  const restaurarAparienciaPredeterminada = () => {
    setConfig({
      ...config,
      theme: CONFIGURACION_DEFECTO.theme,
      themeSource: CONFIGURACION_DEFECTO.themeSource,
      accentColor: CONFIGURACION_DEFECTO.accentColor,
      accentHoverColor: CONFIGURACION_DEFECTO.accentHoverColor,
      accentSoftColor: CONFIGURACION_DEFECTO.accentSoftColor,
    });
  };

  const actualizarLogo = async (clave, archivo, dimensiones) => {
    if (!archivo) return;

    setLogoError('');

    try {
      const dataUrl = await prepararLogo(archivo, dimensiones);
      setConfig((configActual) => ({
        ...configActual,
        [clave]: dataUrl,
        ...(clave === 'logoPrincipal' ? { logoPrincipalNombre: String(configActual.gymName || '').trim() } : {}),
        ...(clave === 'logoAcceso' ? { logoAccesoNombre: String(configActual.gymName || '').trim() } : {}),
        ...(clave === 'appLogo' ? { appLogoNombre: String(configActual.appName || configActual.gymName || '').trim() } : {}),
      }));
    } catch (error) {
      setLogoError(error.message || 'No se pudo cargar el logo.');
    }
  };

  const restaurarLogo = (clave) => {
    setLogoError('');
    setConfig((configActual) => ({
      ...configActual,
      [clave]: CONFIGURACION_DEFECTO[clave],
      ...(clave === 'logoPrincipal' ? { logoPrincipalNombre: '' } : {}),
      ...(clave === 'logoAcceso' ? { logoAccesoNombre: '' } : {}),
      ...(clave === 'appLogo' ? { appLogoNombre: '' } : {}),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const configuracionParaGuardar = {
        ...config,
        gymName: String(config.gymName || '').trim(),
        themeSource: config.theme === 'system' ? 'system' : 'user',
      };
      const respuesta = await configuracionApi.guardar(configuracionParaGuardar);
      const configuracionGuardada = guardarConfiguracionApp(respuesta || configuracionParaGuardar);
      setConfig((actual) => ({ ...actual, ...configuracionGuardada }));
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setIsSubmitting(false);
      setLogoError('No se pudo guardar en la API. Revisa la sesion o usa logos mas livianos.');
    }
  };

  return (
    <div className="workspace-page pb-4 text-white">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Ajustes del Sistema</h1>
        <p className="text-sm text-gray-400">Configura parametros globales, apariencia, notificaciones y seguridad.</p>
      </div>

      <div className="workspace-grid workspace-settings-layout">
        <div className="workspace-settings-tabs">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Store} label="General" />
          <TabButton active={activeTab === 'apariencia'} onClick={() => setActiveTab('apariencia')} icon={Palette} label="Apariencia" />
          <TabButton active={activeTab === 'notificaciones'} onClick={() => setActiveTab('notificaciones')} icon={Bell} label="Notificaciones" />
          <TabButton active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon={ShieldAlert} label="Seguridad y Datos" />
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909] p-4 sm:p-6">
          <div className="absolute left-0 top-0 h-px w-full bg-red-600/50" />

          <form onSubmit={handleSave} className="relative z-10 space-y-8">
            {activeTab === 'general' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={Settings} titulo="Configuracion General" />

                <div className="workspace-grid--cards">
                  {esSuperAdmin && <CampoTexto etiqueta="Nombre del Gimnasio" name="gymName" value={config.gymName} onChange={handleChange} required maxLength={80} />}
                  <CampoTexto etiqueta="Correo Principal" type="email" name="email" value={config.email} onChange={handleChange} />
                </div>

                <div className="workspace-grid--cards">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-gray-500">Moneda base</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 text-gray-600" size={16} />
                      <select
                        name="currency"
                        value={config.currency}
                        onChange={handleChange}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-[#111] py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-red-600"
                      >
                        {MONEDAS_DISPONIBLES.map((moneda) => (
                          <option key={moneda.codigo} value={moneda.codigo}>
                            {moneda.nombre} ({moneda.simbolo}) - {moneda.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-500">
                      Los cobros usaran {monedaSeleccionada.simbolo} despues de guardar.
                    </p>
                  </div>

                  <CampoTexto etiqueta="Telefono / WhatsApp" name="phone" value={config.phone} onChange={handleChange} />

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-gray-500">Impuesto aplicable (%)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 text-gray-600" size={16} />
                      <input
                        type="number"
                        name="taxRate"
                        value={config.taxRate}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-white/5 bg-[#111] py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                {esSuperAdmin ? <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded-xl bg-red-600/10 p-2 text-red-500">
                      <ImageIcon size={20} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white">Marca de la aplicación móvil</h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">El nombre, logo, color y fondo se sincronizan con la app móvil desde la API.</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl border border-white/5 bg-black/25 p-3">
                    <CampoTexto
                      etiqueta="Nombre visible en la app móvil"
                      name="appName"
                      value={config.appName || ''}
                      onChange={handleChange}
                      placeholder={nombreGimnasio}
                      maxLength={80}
                    />
                    <p className="mt-2 text-[11px] leading-5 text-gray-500">
                      Se actualiza dentro de la app al sincronizar. Si el logo incluye el nombre, vuelve a subirlo al cambiarlo. El nombre e icono del launcher de Android requieren generar y distribuir una APK nueva.
                    </p>
                  </div>

                  {logoError && (
                    <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-400">
                      {logoError}
                    </p>
                  )}

                  <div className="workspace-grid--cards">
                    <SelectorLogo
                      titulo="Logo de la app móvil"
                      descripcion="Identidad principal al iniciar sesión y en los paneles móviles."
                      valor={logoAppVigente}
                      hayValor={Boolean(config.appLogo)}
                      respaldo={logosVigentes.principal}
                      marcaTexto={config.appName || nombreGimnasio}
                      onChange={(archivo) => actualizarLogo('appLogo', archivo, { maxWidth: 640, maxHeight: 640 })}
                      onReset={() => restaurarLogo('appLogo')}
                    />
                    <SelectorLogo
                      titulo="Logo principal"
                      descripcion="Se usa en la web, menús y documentos."
                      valor={logosVigentes.principal}
                      hayValor={Boolean(config.logoPrincipal)}
                      respaldo={nombreGimnasio.toLowerCase() === 'spartan gym' ? LOGOS_APP_DEFECTO.principal : ''}
                      marcaTexto={nombreGimnasio}
                      onChange={(archivo) => actualizarLogo('logoPrincipal', archivo, { maxWidth: 900, maxHeight: 520 })}
                      onReset={() => restaurarLogo('logoPrincipal')}
                    />
                    <SelectorLogo
                      titulo="Logo de acceso"
                      descripcion="Se usa en login y registro web."
                      valor={logosVigentes.acceso}
                      hayValor={Boolean(config.logoAcceso)}
                      respaldo={nombreGimnasio.toLowerCase() === 'spartan gym' ? LOGOS_APP_DEFECTO.acceso : ''}
                      marcaTexto={nombreGimnasio}
                      onChange={(archivo) => actualizarLogo('logoAcceso', archivo, { maxWidth: 640, maxHeight: 640 })}
                      onReset={() => restaurarLogo('logoAcceso')}
                    />
                    <SelectorLogo
                      titulo="Fondo de acceso"
                      descripcion="Se usa como fondo de login y bienvenida móvil."
                      valor={config.fondoLogin}
                      hayValor={Boolean(config.fondoLogin)}
                      respaldo={LOGOS_APP_DEFECTO.fondoLogin}
                      onChange={(archivo) => actualizarLogo('fondoLogin', archivo, { maxWidth: 1440, maxHeight: 1800 })}
                      onReset={() => restaurarLogo('fondoLogin')}
                    />
                  </div>
                </div> : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2 font-semibold text-gray-200"><Lock size={16} /> Marca reservada al superadmin</div>
                    <p className="mt-2 text-xs leading-5">El nombre, los logos, los colores de marca y el fondo de la app móvil solo pueden ser modificados por un superadmin.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'apariencia' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={Palette} titulo="Apariencia" />

                <div className="workspace-grid--cards">
                  {esSuperAdmin && <OpcionTema
                    active={usaAparienciaPredeterminada}
                    icon={RotateCcw}
                    title="Predeterminado"
                    desc="Quita el tema fijo y vuelve al navegador con los colores originales."
                    onClick={restaurarAparienciaPredeterminada}
                  />}
                  <OpcionTema
                    active={config.theme === 'system' && !usaAparienciaPredeterminada}
                    icon={MonitorSmartphone}
                    title="Segun navegador"
                    desc="La interfaz cambia con el tema real del navegador o sistema."
                    onClick={() => setConfig({ ...config, theme: 'system', themeSource: 'system' })}
                  />
                  <OpcionTema
                    active={config.theme === 'dark'}
                    icon={Moon}
                    title="Tema oscuro"
                    desc="Alto contraste para recepcion y administracion."
                    onClick={() => setConfig({ ...config, theme: 'dark', themeSource: 'user' })}
                  />
                  <OpcionTema
                    active={config.theme === 'light'}
                    icon={Sun}
                    title="Tema blanco"
                    desc="Fondos claros para pantallas con mucha luz."
                    onClick={() => setConfig({ ...config, theme: 'light', themeSource: 'user' })}
                  />
                </div>

                <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Vista previa y colores</p>

                  {esSuperAdmin ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <SelectorColor label="Principal" name="accentColor" value={config.accentColor} onChange={actualizarColor} />
                      <SelectorColor label="Hover" name="accentHoverColor" value={config.accentHoverColor} onChange={actualizarColor} />
                      <SelectorColor label="Suave" name="accentSoftColor" value={config.accentSoftColor} onChange={actualizarColor} />
                    </div>
                  ) : <p className="mt-2 text-xs text-gray-500">Los colores se administran desde una cuenta superadmin.</p>}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded-lg border border-white/10 bg-[#090909]" />
                    <div
                      className="h-16 rounded-lg border"
                      style={{ backgroundColor: `${config.accentColor}26`, borderColor: `${config.accentColor}80` }}
                    />
                    <div className="h-16 rounded-lg border border-white/10" style={{ backgroundColor: config.accentSoftColor }} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificaciones' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={Bell} titulo="Alertas y Comunicaciones" />

                <div className="space-y-4">
                  <ToggleSwitch
                    icon={Mail}
                    title="Correos de Bienvenida"
                    desc="Enviar email automatico cuando un socio se registra en el sistema."
                    name="emailAlerts"
                    checked={config.emailAlerts}
                    onChange={handleChange}
                  />
                  <ToggleSwitch
                    icon={Smartphone}
                    title="Recordatorios por SMS / WhatsApp"
                    desc="Notificar 3 dias antes del vencimiento de la membresia."
                    name="smsAlerts"
                    checked={config.smsAlerts}
                    onChange={handleChange}
                  />
                  <ToggleSwitch
                    icon={Database}
                    title="Reporte Diario de Caja"
                    desc="Recibir un resumen financiero al correo del administrador cada noche."
                    name="dailyReports"
                    checked={config.dailyReports}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {activeTab === 'seguridad' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={ShieldAlert} titulo="Seguridad y Respaldo" />

                <div className="space-y-6">
                  <ToggleSwitch
                    icon={Lock}
                    title="Autenticacion de Dos Pasos (2FA)"
                    desc="Exigir codigo adicional para el inicio de sesion de administradores."
                    name="twoFactor"
                    checked={config.twoFactor}
                    onChange={handleChange}
                  />

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-gray-500">Cierre automatico (Minutos)</label>
                    <select
                      name="sessionTimeout"
                      value={config.sessionTimeout}
                      onChange={handleChange}
                      className="w-full max-w-xs cursor-pointer appearance-none rounded-xl border border-white/5 bg-[#111] px-4 py-2.5 text-sm outline-none focus:border-red-600"
                    >
                      <option value="15">15 Minutos de inactividad</option>
                      <option value="30">30 Minutos de inactividad</option>
                      <option value="60">1 Hora de inactividad</option>
                      <option value="never">Nunca (No recomendado)</option>
                    </select>
                  </div>

                  <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <h4 className="mb-1 text-sm font-bold text-red-500">Zona de Peligro</h4>
                    <p className="mb-3 text-xs text-gray-400">Las acciones aqui son irreversibles. Ten precaucion.</p>
                    <button type="button" className="rounded-lg border border-red-500 px-4 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white">
                      Borrar Historial de Asistencias
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-white/5 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isSaved}
                className={`flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold text-white shadow-lg transition-all ${
                  isSaved ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20 hover:bg-red-700'
                } ${isSubmitting ? 'cursor-wait opacity-70' : ''}`}
              >
                {isSubmitting ? 'Guardando cambios...' : isSaved ? <><CheckCircle2 size={18} /> Ajustes guardados</> : <><Save size={18} /> Guardar Configuracion</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const TituloSeccion = ({ icon: Icon, titulo }) => (
  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
    <Icon className="text-red-500" size={24} />
    <h2 className="text-lg font-bold">{titulo}</h2>
  </div>
);

const CampoTexto = ({ etiqueta, type = 'text', name, value, onChange, ...inputProps }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-bold uppercase text-gray-500">{etiqueta}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      {...inputProps}
      className="w-full rounded-xl border border-white/5 bg-[#111] px-4 py-2.5 text-sm outline-none transition-all focus:border-red-600"
    />
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-bold transition-all ${
      active ? 'border-red-500/20 bg-red-600/10 text-red-500' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

const ToggleSwitch = ({ icon: Icon, title, desc, name, checked, onChange }) => (
  <div className="toggle-option flex items-center justify-between rounded-xl border border-white/5 bg-[#111] p-4">
    <div className="flex items-start gap-4">
      <div className="toggle-option-icon mt-0.5 rounded-lg bg-white/5 p-2 text-gray-400">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="mt-0.5 text-[11px] text-gray-500">{desc}</p>
      </div>
    </div>
    <label className="relative ml-4 inline-flex shrink-0 cursor-pointer items-center">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="toggle-switch-input sr-only peer" />
      <div className="toggle-switch-track h-6 w-11 rounded-full bg-gray-700 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
    </label>
  </div>
);

const OpcionTema = ({ active, icon: Icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex min-h-36 flex-col items-start justify-between rounded-xl border p-4 text-left transition-all duration-300 ${
      active ? 'border-red-500/60 bg-red-600/10 shadow-lg shadow-red-950/20' : 'border-white/5 bg-[#111] hover:-translate-y-0.5 hover:border-white/15'
    }`}
  >
    <span className={`rounded-xl p-2 transition-colors ${active ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
      <Icon size={20} />
    </span>
    <span>
      <span className="block text-sm font-bold text-white">{title}</span>
      <span className="mt-1 block text-[11px] leading-4 text-gray-500">{desc}</span>
    </span>
  </button>
);

const SelectorColor = ({ label, name, value, onChange }) => (
  <label className="group cursor-pointer rounded-xl border border-white/10 bg-[#090909] p-3 transition-all hover:-translate-y-0.5 hover:border-red-500/50">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
    <span className="flex items-center gap-3">
      <span className="h-10 w-10 rounded-xl border border-white/15 shadow-inner" style={{ backgroundColor: value }} />
      <span className="font-mono text-xs font-bold text-white">{value}</span>
    </span>
    <input
      type="color"
      value={value}
      onInput={(evento) => onChange(name, evento.currentTarget.value)}
      onChange={(evento) => onChange(name, evento.currentTarget.value)}
      className="sr-only"
    />
  </label>
);

const SelectorLogo = ({ titulo, descripcion, valor, hayValor = Boolean(valor), respaldo, marcaTexto, onChange, onReset }) => (
  <article className="rounded-xl border border-white/10 bg-[#090909] p-4">
    <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4">
      {valor || respaldo ? (
        <img
          src={valor || respaldo}
          alt={valor ? titulo : titulo + ' predeterminado'}
          className="max-h-full max-w-full object-contain drop-shadow-[0_0_14px_rgba(0,0,0,0.45)]"
        />
      ) : marcaTexto ? (
        <span className="max-w-full break-words text-center text-lg font-black uppercase tracking-wide text-white">{marcaTexto}</span>
      ) : <span className="text-sm text-gray-500">Fondo predeterminado</span>}
    </div>

    <div className="mt-4">
      <h4 className="text-sm font-black text-white">{titulo}</h4>
      <p className="mt-1 min-h-8 text-[11px] leading-4 text-gray-500">{descripcion}</p>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white transition-all hover:bg-red-700">
        <UploadCloud size={14} />
        Subir logo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(evento) => {
            onChange(evento.currentTarget.files?.[0]);
            evento.currentTarget.value = '';
          }}
        />
      </label>
      <button
        type="button"
        onClick={onReset}
        disabled={!hayValor}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-300 transition-all hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        <RotateCcw size={14} />
        Original
      </button>
    </div>
  </article>
);

export default Configuracion;
