import { useEffect, useState } from 'react';
import { 
  Settings, Bell, ShieldAlert, Store, 
  Save, CheckCircle2, Globe, Mail, 
  Smartphone, Database, Lock, CreditCard,
  Palette, Sun, Moon
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'spartanGym.settings';

const defaultConfig = {
  gymName: 'Spartan Gym',
  email: 'admin@spartangym.com',
  phone: '+505 0000 0000',
  currency: 'USD',
  taxRate: '15',
  theme: 'dark',
  emailAlerts: true,
  smsAlerts: false,
  dailyReports: true,
  twoFactor: false,
  sessionTimeout: '30',
};

const cargarConfigInicial = () => {
  try {
    return {
      ...defaultConfig,
      ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}'),
    };
  } catch {
    return defaultConfig;
  }
};

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Estados simulados de configuración
  const [config, setConfig] = useState(cargarConfigInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme === 'light' ? 'light' : 'dark';
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...cargarConfigInicial(), theme: config.theme }));
  }, [config.theme]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfig({ ...config, [e.target.name]: value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      
      {/* CABECERA */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Ajustes del Sistema</h1>
        <p className="text-gray-400 text-sm">Configura los parámetros globales, notificaciones y seguridad de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* MENÚ LATERAL DE PESTAÑAS */}
        <div className="bg-[#090909] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')} 
            icon={Store} label="General" 
          />
          <TabButton 
            active={activeTab === 'apariencia'} 
            onClick={() => setActiveTab('apariencia')} 
            icon={Palette} label="Apariencia" 
          />
          <TabButton 
            active={activeTab === 'notificaciones'} 
            onClick={() => setActiveTab('notificaciones')} 
            icon={Bell} label="Notificaciones" 
          />
          <TabButton 
            active={activeTab === 'seguridad'} 
            onClick={() => setActiveTab('seguridad')} 
            icon={ShieldAlert} label="Seguridad y Datos" 
          />
        </div>

        {/* ÁREA DE FORMULARIO PRINCIPAL */}
        <div className="md:col-span-3 bg-[#090909] border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

          <form onSubmit={handleSave} className="space-y-8 relative z-10">
            
            {/* --- PESTAÑA: GENERAL --- */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Settings className="text-red-500" size={24} />
                  <h2 className="text-lg font-bold">Configuración General</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Nombre del Gimnasio</label>
                    <input type="text" name="gymName" value={config.gymName} onChange={handleChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-red-600 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Correo Principal</label>
                    <input type="email" name="email" value={config.email} onChange={handleChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-red-600 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Moneda Base</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 text-gray-600" size={16} />
                      <select name="currency" value={config.currency} onChange={handleChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-600 appearance-none cursor-pointer">
                        <option value="NIO">Córdobas (C$)</option>
                        <option value="USD">Dólares ($)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Teléfono / WhatsApp</label>
                    <input type="text" name="phone" value={config.phone} onChange={handleChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-red-600 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Impuesto Aplicable (%)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 text-gray-600" size={16} />
                      <input type="number" name="taxRate" value={config.taxRate} onChange={handleChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-600 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- PESTAÑA: NOTIFICACIONES --- */}
            {activeTab === 'apariencia' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Palette className="text-red-500" size={24} />
                  <h2 className="text-lg font-bold">Apariencia</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ThemeOption
                    active={config.theme === 'dark'}
                    icon={Moon}
                    title="Tema oscuro"
                    desc="Interfaz de alto contraste para uso diario en recepcion y administracion."
                    onClick={() => setConfig({ ...config, theme: 'dark' })}
                  />
                  <ThemeOption
                    active={config.theme === 'light'}
                    icon={Sun}
                    title="Tema blanco"
                    desc="Fondos claros para trabajar mejor en pantallas con mucha luz."
                    onClick={() => setConfig({ ...config, theme: 'light' })}
                  />
                </div>

                <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Vista previa</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded-lg border border-white/10 bg-[#090909]" />
                    <div className="h-16 rounded-lg border border-red-500/30 bg-red-600/15" />
                    <div className="h-16 rounded-lg border border-white/10 bg-white/5" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificaciones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Bell className="text-red-500" size={24} />
                  <h2 className="text-lg font-bold">Alertas y Comunicaciones</h2>
                </div>

                <div className="space-y-4">
                  <ToggleSwitch 
                    icon={Mail} title="Correos de Bienvenida" 
                    desc="Enviar email automático cuando un socio se registra en el sistema." 
                    name="emailAlerts" checked={config.emailAlerts} onChange={handleChange} 
                  />
                  <ToggleSwitch 
                    icon={Smartphone} title="Recordatorios por SMS / WhatsApp" 
                    desc="Notificar 3 días antes del vencimiento de la membresía." 
                    name="smsAlerts" checked={config.smsAlerts} onChange={handleChange} 
                  />
                  <ToggleSwitch 
                    icon={Database} title="Reporte Diario de Caja" 
                    desc="Recibir un resumen financiero al correo del administrador cada noche." 
                    name="dailyReports" checked={config.dailyReports} onChange={handleChange} 
                  />
                </div>
              </div>
            )}

            {/* --- PESTAÑA: SEGURIDAD --- */}
            {activeTab === 'seguridad' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <ShieldAlert className="text-red-500" size={24} />
                  <h2 className="text-lg font-bold">Seguridad y Respaldo</h2>
                </div>

                <div className="space-y-6">
                  <ToggleSwitch 
                    icon={Lock} title="Autenticación de Dos Pasos (2FA)" 
                    desc="Exigir código adicional para el inicio de sesión de administradores." 
                    name="twoFactor" checked={config.twoFactor} onChange={handleChange} 
                  />
                  
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Cierre de sesión automático (Minutos)</label>
                    <select name="sessionTimeout" value={config.sessionTimeout} onChange={handleChange} className="w-full max-w-xs bg-[#111] border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-red-600 appearance-none cursor-pointer">
                      <option value="15">15 Minutos de inactividad</option>
                      <option value="30">30 Minutos de inactividad</option>
                      <option value="60">1 Hora de inactividad</option>
                      <option value="never">Nunca (No recomendado)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-8">
                    <h4 className="text-sm font-bold text-red-500 mb-1">Zona de Peligro</h4>
                    <p className="text-xs text-gray-400 mb-3">Las acciones aquí son irreversibles. Ten precaución.</p>
                    <button type="button" className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                      Borrar Historial de Asistencias (Año Anterior)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÓN DE GUARDADO GLOBAL */}
            <div className="pt-4 flex justify-end border-t border-white/5 mt-8">
              <button 
                type="submit" disabled={isSubmitting || isSaved}
                className={`flex items-center gap-2 font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg text-sm
                  ${isSaved ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'} 
                  ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {isSubmitting ? 'Guardando cambios...' : isSaved ? <><CheckCircle2 size={18} /> ¡Ajustes Guardados!</> : <><Save size={18} /> Guardar Configuración</>}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

// Sub-componente para los botones de las pestañas
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-bold text-left
      ${active ? 'bg-red-600/10 text-red-500 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}
    `}
  >
    <Icon size={18} /> {label}
  </button>
);

// Sub-componente para los interruptores (Toggles) de opciones
const ToggleSwitch = ({ icon: Icon, title, desc, name, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
    <div className="flex items-start gap-4">
      <div className="p-2 bg-white/5 rounded-lg text-gray-400 mt-0.5">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
    </label>
  </div>
);

const ThemeOption = ({ active, icon: Icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex min-h-36 flex-col items-start justify-between rounded-xl border p-4 text-left transition-all duration-300 ${
      active
        ? 'border-red-500/60 bg-red-600/10 shadow-lg shadow-red-950/20'
        : 'border-white/5 bg-[#111] hover:-translate-y-0.5 hover:border-white/15'
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

export default Configuracion;
