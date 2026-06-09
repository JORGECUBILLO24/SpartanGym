import { useState } from 'react';
import { 
  User, CreditCard, Save, CheckCircle2, 
  Mail, Phone, Camera, ShieldCheck 
} from 'lucide-react';

const RegistrarSocio = () => {
  // Estado para guardar los datos del formulario en tiempo real
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    membresia: ''
  });

  // Estados para animar el botón de guardado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Función para actualizar los datos mientras se escribe
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función al darle clic en "Guardar registro"
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulamos que se guarda en una base de datos (tarda 1.5 segundos)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSaved(true);
      
      // Después de 3 segundos, limpiamos el formulario para uno nuevo
      setTimeout(() => {
        setFormData({ nombre: '', apellido: '', correo: '', telefono: '', membresia: '' });
        setIsSaved(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-2 bg-[#111111] rounded-2xl border border-white/5 p-6 lg:p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Datos del Nuevo Socio</h2>
            <p className="text-gray-400 text-sm">Ingresa la información personal y selecciona el plan para completar el registro.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Nombres</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Juan Carlos" 
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-colors" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Apellidos</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    name="apellido"
                    required
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Ej. Pérez Silva" 
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="email" 
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com" 
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-colors" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Teléfono (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="tel" 
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+505 0000 0000" 
                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-colors" 
                  />
                </div>
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Plan de Membresía</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <select 
                  name="membresia"
                  required
                  value={formData.membresia}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona un plan...</option>
                  <option value="Básica (1 Mes)">Básica (1 Mes) - $30.00</option>
                  <option value="Premium (3 Meses)">Premium (3 Meses) - $80.00</option>
                  <option value="Elite (6 Meses)">Elite (6 Meses) - $150.00</option>
                  <option value="Spartan Anual">Spartan Anual - $250.00</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || isSaved}
                className={`flex items-center gap-2 font-bold py-3 px-8 rounded-xl transition-all shadow-lg text-sm
                  ${isSaved 
                    ? 'bg-green-600 text-white shadow-green-900/20' 
                    : 'bg-[#e50914] hover:bg-red-700 text-white shadow-red-900/20'
                  } 
                  ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {isSubmitting ? (
                  <>Guardando...</>
                ) : isSaved ? (
                  <><CheckCircle2 size={18} /> ¡Socio Guardado!</>
                ) : (
                  <><Save size={18} /> Completar Registro</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 lg:p-8 flex flex-col items-center shadow-lg h-fit">
          <h3 className="font-bold text-sm text-gray-400 w-full mb-6 uppercase tracking-wider text-center">Vista Previa del Perfil</h3>
          
          {/* Tarjeta con sintaxis actualizada bg-linear-to-br */}
          <div className="w-full max-w-65 bg-linear-to-br from-[#1a1a1a] to-[#050505] rounded-2xl border border-white/10 p-5 flex flex-col items-center shadow-2xl relative">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-red-600 rounded-b-md"></div>
            
            <div className="w-24 h-24 bg-[#0a0a0a] rounded-full border-2 border-white/5 flex items-center justify-center mt-4 mb-4 relative overflow-hidden group cursor-pointer hover:border-red-500/50 transition-colors">
              <User size={40} className="text-gray-600 group-hover:hidden" />
              <div className="hidden group-hover:flex flex-col items-center text-red-500">
                <Camera size={24} />
                <span className="text-[10px] font-bold mt-1">AÑADIR</span>
              </div>
            </div>

            <h4 className="text-lg font-bold text-white text-center w-full px-2">
              {formData.nombre || formData.apellido 
                ? `${formData.nombre} ${formData.apellido}` 
                : 'Nombre del Socio'}
            </h4>
            
            <p className="text-xs text-gray-500 mt-1 mb-4 flex items-center gap-1">
              {formData.correo || 'correo@gym.com'}
            </p>

            <div className="w-full bg-[#0a0a0a] rounded-xl p-3 border border-white/5 mb-2">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Membresía Activa</p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={formData.membresia ? "text-red-500" : "text-gray-600"} />
                <p className={`text-sm font-bold ${formData.membresia ? "text-white" : "text-gray-600"}`}>
                  {formData.membresia || 'Sin plan asignado'}
                </p>
              </div>
            </div>

            <div className="w-full h-8 bg-white/5 rounded mt-2 flex items-center justify-center">
              <p className="text-[8px] text-gray-500 tracking-[0.3em]">ID PENDIENTE</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RegistrarSocio;