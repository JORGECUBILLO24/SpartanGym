import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Database,
  Globe,
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
} from 'lucide-react';
import {
  aplicarApariencia,
  CONFIGURACION_DEFECTO,
  guardarConfiguracionApp,
  leerConfiguracionApp,
  MONEDAS_DISPONIBLES,
} from '../../../utils/configuracionApp';
import { aplicarPreferenciaTema, obtenerPreferenciaTemaGuardada } from '../../../utils/tema';

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

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [config, setConfig] = useState(cargarConfigInicial);
  const monedaSeleccionada = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === config.currency) || MONEDAS_DISPONIBLES[1];
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

  const handleSave = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    guardarConfiguracionApp({
      ...config,
      themeSource: config.theme === 'system' ? 'system' : 'user',
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 pb-10 text-white">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Ajustes del Sistema</h1>
        <p className="text-sm text-gray-400">Configura parametros globales, apariencia, notificaciones y seguridad.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#090909] p-4 shadow-2xl">
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Store} label="General" />
          <TabButton active={activeTab === 'apariencia'} onClick={() => setActiveTab('apariencia')} icon={Palette} label="Apariencia" />
          <TabButton active={activeTab === 'notificaciones'} onClick={() => setActiveTab('notificaciones')} icon={Bell} label="Notificaciones" />
          <TabButton active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon={ShieldAlert} label="Seguridad y Datos" />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-6 shadow-2xl md:col-span-3 lg:p-8">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

          <form onSubmit={handleSave} className="relative z-10 space-y-8">
            {activeTab === 'general' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={Settings} titulo="Configuracion General" />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <CampoTexto etiqueta="Nombre del Gimnasio" name="gymName" value={config.gymName} onChange={handleChange} />
                  <CampoTexto etiqueta="Correo Principal" type="email" name="email" value={config.email} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
              </div>
            )}

            {activeTab === 'apariencia' && (
              <div className="animate-in fade-in space-y-6 duration-300">
                <TituloSeccion icon={Palette} titulo="Apariencia" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <OpcionTema
                    active={usaAparienciaPredeterminada}
                    icon={RotateCcw}
                    title="Predeterminado"
                    desc="Quita el tema fijo y vuelve al navegador con los colores originales."
                    onClick={restaurarAparienciaPredeterminada}
                  />
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

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <SelectorColor label="Principal" name="accentColor" value={config.accentColor} onChange={actualizarColor} />
                    <SelectorColor label="Hover" name="accentHoverColor" value={config.accentHoverColor} onChange={actualizarColor} />
                    <SelectorColor label="Suave" name="accentSoftColor" value={config.accentSoftColor} onChange={actualizarColor} />
                  </div>

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

const CampoTexto = ({ etiqueta, type = 'text', name, value, onChange }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-bold uppercase text-gray-500">{etiqueta}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
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

export default Configuracion;
