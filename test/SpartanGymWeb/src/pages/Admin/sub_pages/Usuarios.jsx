import { useEffect, useState } from 'react';
import { 
  User, Mail, Phone, Save, CheckCircle2, 
  Camera, ShieldAlert, Key, Briefcase, 
  Dumbbell, Headset, Lock, AlertCircle, RefreshCw
} from 'lucide-react';
import { personalApi } from '../../../services/api';

const Usuarios = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    rol: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generarPassword = () => {
    const randomPass = Math.random().toString(36).slice(-8) + "Gym!";
    setFormData({ ...formData, password: randomPass });
  };

  const rolesApi = {
    Administrador: 'ROLE_ADMIN',
    Entrenador: 'ROLE_ENTRENADOR',
    Recepcionista: 'ROLE_RECEPCIONISTA',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await personalApi.registrar({
        nombres: formData.nombre,
        apellidos: formData.apellido,
        email: formData.correo,
        telefono: formData.telefono,
        password: formData.password,
        rol: rolesApi[formData.rol],
        especialidad: formData.rol,
      });

      setIsSaved(true);
      setTimeout(() => {
        setFormData({ nombre: '', apellido: '', correo: '', telefono: '', rol: '', password: '' });
        cargarUsuarios();
        setIsSaved(false);
      }, 3000);
    } catch {
      setError('No se pudo registrar el personal. Verifica tu sesión de administrador y los datos ingresados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDetails = (rol) => {
    switch (rol) {
      case 'Superadmin': return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Control Maestro' };
      case 'Administrador': return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Acceso Total' };
      case 'Entrenador': return { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Rutinas y Clientes' };
      case 'Recepcionista': return { icon: Headset, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Pagos y Accesos' };
      default: return { icon: Briefcase, color: 'text-gray-500', bg: 'bg-gray-800', label: 'Sin permisos asignados' };
    }
  };

  const [usuarios, setUsuarios] = useState([]);

  const cargarUsuarios = async () => {
    try {
      setUsuarios(await personalApi.listar());
    } catch {
      setError('No se pudo cargar la lista de usuarios desde la base de datos.');
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const actualizarRol = async (usuarioId, rol) => {
    try {
      const actualizado = await personalApi.actualizarRol(usuarioId, rol);
      setUsuarios(usuarios.map((usuario) => usuario.id === usuarioId ? actualizado : usuario));
    } catch {
      setError('No se pudo actualizar el rol del usuario.');
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

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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

        <div className="rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Usuarios actuales</h3>
              <p className="text-xs text-gray-500">Personal cargado directamente desde la base de datos.</p>
            </div>
            <button type="button" onClick={cargarUsuarios} className="rounded-xl border border-white/10 p-2 text-gray-300 hover:bg-white/10">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                <tr><th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Rol</th><th className="p-3">Cambiar rol</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="p-3 font-bold text-white">{usuario.nombres} {usuario.apellidos}</td>
                    <td className="p-3 text-gray-400">{usuario.email}</td>
                    <td className="p-3 text-red-300">{usuario.rol}</td>
                    <td className="p-3">
                      <select value={usuario.rol} onChange={(e) => actualizarRol(usuario.id, e.target.value)} className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white">
                        <option value="ROLE_ADMIN">Administrador</option>
                        <option value="ROLE_ENTRENADOR">Entrenador</option>
                        <option value="ROLE_RECEPCIONISTA">Recepcionista</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default Usuarios;
