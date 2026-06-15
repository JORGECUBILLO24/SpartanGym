import { useEffect, useState } from 'react';
import { 
  User, Mail, Phone, Save, CheckCircle2, 
  Camera, ShieldAlert, Key, Briefcase, 
  Dumbbell, Headset, Lock, Building2, AlertCircle, Trash2
} from 'lucide-react';
import {
  leerGimnasiosDisponibles,
  obtenerGimnasioPredeterminado,
} from '../../../utils/gimnasiosCompartidos';
import {
  agregarPersonalCompartido,
  eliminarPersonalCompartido,
  EVENTO_PERSONAL,
  leerPersonalCompartido,
  obtenerNombrePersonal,
  personalCreadoPorCuentaActual,
} from '../../../utils/personalCompartido';

const crearFormularioInicial = () => ({
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  rol: '',
  password: '',
  gimnasio: obtenerGimnasioPredeterminado(),
});

const Usuarios = () => {
  const [formData, setFormData] = useState(crearFormularioInicial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState(null);
  const [personalCompartido, setPersonalCompartido] = useState(() => leerPersonalCompartido());
  const gimnasios = leerGimnasiosDisponibles();

  useEffect(() => {
    const actualizarPersonal = () => setPersonalCompartido(leerPersonalCompartido());

    window.addEventListener('storage', actualizarPersonal);
    window.addEventListener(EVENTO_PERSONAL, actualizarPersonal);

    return () => {
      window.removeEventListener('storage', actualizarPersonal);
      window.removeEventListener(EVENTO_PERSONAL, actualizarPersonal);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorRegistro('');
    setMensajeGestion(null);
  };

  const generarPassword = () => {
    const randomPass = Math.random().toString(36).slice(-8) + "Gym!";
    setFormData({ ...formData, password: randomPass });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const resultado = agregarPersonalCompartido(formData);

      if (!resultado.ok) {
        setIsSubmitting(false);
        setIsSaved(false);
        setErrorRegistro(resultado.mensaje);
        setPersonalCompartido(resultado.personal);
        return;
      }

      setPersonalCompartido(resultado.personal);
      setIsSubmitting(false);
      setIsSaved(true);
      setTimeout(() => {
        setFormData(crearFormularioInicial());
        setIsSaved(false);
      }, 3000);
    }, 1500);
  };

  const eliminarUsuario = (persona) => {
    if (!personalCreadoPorCuentaActual(persona)) {
      setMensajeGestion({
        tipo: 'error',
        texto: 'Solo puedes eliminar usuarios creados por tu cuenta.',
      });
      return;
    }

    const debeEliminar = typeof window === 'undefined'
      ? true
      : window.confirm(`Eliminar a ${obtenerNombrePersonal(persona)} del sistema?`);

    if (!debeEliminar) return;

    const resultado = eliminarPersonalCompartido(persona.id);
    setPersonalCompartido(resultado.personal);
    setMensajeGestion({
      tipo: resultado.ok ? 'exito' : 'error',
      texto: resultado.mensaje,
    });
  };

  const getRoleDetails = (rol) => {
    switch (rol) {
      case 'Administrador': return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Acceso Total' };
      case 'Entrenador': return { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Rutinas y Clientes' };
      case 'Recepcionista': return { icon: Headset, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Pagos y Accesos' };
      default: return { icon: Briefcase, color: 'text-gray-500', bg: 'bg-gray-800', label: 'Sin permisos asignados' };
    }
  };

  const RoleIcon = getRoleDetails(formData.rol).icon;

  return (
    <div className="flex w-full flex-col gap-6">

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:col-span-2 lg:p-8">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {errorRegistro && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                <AlertCircle size={15} />
                {errorRegistro}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Nombres del empleado</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                    placeholder="Ej. Carlos Roberto" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Apellidos</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" name="apellido" required value={formData.apellido} onChange={handleChange}
                    placeholder="Ej. Méndez" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Correo Electrónico (Usuario)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="email" name="correo" required value={formData.correo} onChange={handleChange}
                    placeholder="admin@spartangym.com" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                    placeholder="+505 0000 0000" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Rol en el Sistema</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-3.5 text-gray-500 z-10" size={18} />
                  <select 
                    name="rol" required value={formData.rol} onChange={handleChange}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-all appearance-none cursor-pointer relative z-0"
                  >
                    <option value="" disabled>Selecciona un rol...</option>
                    <option value="Administrador">Administrador (Acceso Total)</option>
                    <option value="Entrenador">Entrenador</option>
                    <option value="Recepcionista">Recepcionista</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 flex justify-between">
                  <span>Contraseña de Acceso</span>
                  <button type="button" onClick={generarPassword} className="text-red-500 hover:text-red-400">Generar</button>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" name="password" required value={formData.password} onChange={handleChange}
                    placeholder="Asigna una contraseña" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Gimnasio asignado</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 text-gray-500 z-10" size={18} />
                <select
                  name="gimnasio"
                  required
                  value={formData.gimnasio}
                  onChange={handleChange}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-[#111] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-red-600"
                >
                  {gimnasios.map((gimnasio) => (
                    <option key={gimnasio.id} value={gimnasio.nombre}>{gimnasio.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-stretch pt-6 sm:justify-end">
              <button 
                type="submit" disabled={isSubmitting || isSaved}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-all sm:w-auto
                  ${isSaved ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'} 
                  ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {isSubmitting ? (<>Creando credenciales...</>) : isSaved ? (<><CheckCircle2 size={18} /> Usuario Registrado</>) : (<><Save size={18} /> Registrar Personal</>)}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <div className="group relative flex min-h-[360px] flex-col items-center justify-start overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:min-h-[500px] lg:justify-center">
          
          <h3 className="mb-6 w-full text-center text-xs font-bold uppercase tracking-widest text-gray-500">
            Credencial de Sistema
          </h3>
          
          {/* Tarjeta tipo gafete premium: h-auto permite que crezca si el texto es largo */}
          <div className="w-full max-w-sm bg-gradient-to-b from-[#151515] to-[#050505] rounded-2xl border border-white/10 p-6 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] relative transition-all duration-300 h-auto">
            
            {/* Lanyard/Clip design */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3 bg-black border border-white/10 rounded-b-xl flex justify-center items-center">
              <div className="w-8 h-1 bg-white/20 rounded-full"></div>
            </div>
            
            {/* Contenedor del texto forzado a w-full para que respete el padding */}
            <div className="mt-4 flex flex-col items-center w-full">
              <div className="w-24 h-24 bg-[#111] rounded-2xl border-2 border-white/5 shadow-inner flex items-center justify-center mb-4 relative overflow-hidden cursor-pointer hover:border-red-500/50 transition-colors rotate-3 hover:rotate-0 duration-300 shrink-0">
                <Camera size={32} className="text-gray-700" />
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] font-bold text-white">SUBIR FOTO</span>
                </div>
              </div>

              {/* Nombre con break-words para que baje a la siguiente línea si es muy largo */}
              <h4 className="text-xl font-black text-white text-center tracking-tight leading-tight w-full break-words px-2">
                {formData.nombre || formData.apellido ? `${formData.nombre} ${formData.apellido}` : 'Nombre del Staff'}
              </h4>
              
              {/* Correo con break-all para cortar strings sin espacios */}
              <p className="text-xs text-gray-400 mt-1 mb-6 font-mono w-full text-center break-all px-2">
                {formData.correo || 'usuario@spartangym.com'}
              </p>
            </div>

            {/* Etiqueta de Rol Dinámica */}
            <div className={`w-full rounded-xl p-4 flex items-center justify-between border border-white/5 ${getRoleDetails(formData.rol).bg}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/50 ${getRoleDetails(formData.rol).color}`}>
                  <RoleIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cargo asignado</p>
                  <p className={`text-sm font-bold ${getRoleDetails(formData.rol).color}`}>
                    {formData.rol || 'Sin asignar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 w-full rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Gimnasio asignado</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white">
                <Building2 size={16} className="text-red-500" />
                <span className="min-w-0 break-words">{formData.gimnasio}</span>
              </div>
            </div>

            {/* Permisos */}
            <div className="w-full mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Lock size={12} />
                <span className="text-[10px] uppercase font-bold w-full break-words">{getRoleDetails(formData.rol).label}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                <span className={`w-1.5 h-1.5 rounded-full ${formData.rol ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <section className="rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Personal global</p>
            <h3 className="text-lg font-black text-white">Usuarios registrados por gimnasio</h3>
            <p className="mt-1 text-xs text-gray-500">Administradores, recepcionistas y entrenadores quedan ligados al gimnasio seleccionado.</p>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">
            {personalCompartido.length} usuarios
          </span>
        </div>

        {mensajeGestion && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
            mensajeGestion.tipo === 'exito'
              ? 'border-green-500/20 bg-green-500/10 text-green-500'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}>
            {mensajeGestion.tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {mensajeGestion.texto}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4 font-bold">Usuario</th>
                <th className="pb-3 pr-4 font-bold">Rol</th>
                <th className="pb-3 pr-4 font-bold">Gimnasio asignado</th>
                <th className="pb-3 pr-4 font-bold">Creado por</th>
                <th className="pb-3 pr-4 font-bold">Estado</th>
                <th className="pb-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {personalCompartido.map((persona) => {
                const puedeEliminar = personalCreadoPorCuentaActual(persona);

                return (
                  <tr key={persona.id} className="hover:bg-white/[0.03]">
                    <td className="py-3 pr-4">
                      <p className="font-black text-white">{obtenerNombrePersonal(persona)}</p>
                      <p className="text-[10px] text-gray-500">{persona.correo || persona.telefono || 'Sin contacto'}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{persona.rol}</td>
                    <td className="py-3 pr-4 text-gray-400">{persona.gimnasio}</td>
                    <td className="py-3 pr-4 text-gray-400">{persona.creadoPor}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase text-green-500">
                        {persona.estado}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={!puedeEliminar}
                        onClick={() => eliminarUsuario(persona)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase transition-all ${
                          puedeEliminar
                            ? 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white'
                            : 'cursor-not-allowed border-white/5 bg-white/5 text-gray-600'
                        }`}
                        title={puedeEliminar ? 'Eliminar usuario creado por tu cuenta' : 'Solo puedes eliminar usuarios creados por tu cuenta'}
                        aria-label={`Eliminar ${obtenerNombrePersonal(persona)}`}
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Usuarios;
