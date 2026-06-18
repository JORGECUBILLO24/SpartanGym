import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, User } from 'lucide-react';
import { authApi, authStorage } from '../services/api';
import LogoSpartan from '../assets/Logo SpartanGym.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleRoutes = {
    ROLE_SUPERADMIN: '/admin',
    ROLE_ADMIN: '/admin',
    ROLE_RECEPCIONISTA: '/recepcion',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authApi.login(email, password);
      authStorage.setSession(session);
      const apiRole = session.rol?.toUpperCase();
      const selectedRole = role?.toUpperCase();

      if (selectedRole && apiRole !== selectedRole) {
        setError('El rol seleccionado no coincide con el usuario autenticado.');
        authStorage.clear();
        return;
      }

      const destination = roleRoutes[apiRole];

      if (!destination) {
        setError('Tu rol no tiene acceso al panel web administrativo.');
        authStorage.clear();
        return;
      }

      navigate(destination);
    } catch {
      setError('No se pudo iniciar sesión. Verifica tus credenciales y que la API esté activa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative p-4">
      <div className="absolute inset-0 bg-[url('/src/assets/fondo_login.png')] bg-cover bg-center opacity-20"></div>

      <Link to="/" className="relative z-10 mb-10" aria-label="Volver al inicio">
        <img
          src={LogoSpartan}
          alt="Logo Spartan Gym"
          className="w-64 h-auto object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
        />
      </Link>

      <div className="relative z-10 w-full max-w-sm bg-[#0c0c0d] p-8 rounded-3xl border border-red-900/30 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Correo o usuario</label>
            <div className="group relative mt-2">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu correo" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Contraseña</label>
            <div className="group relative mt-2">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu contraseña" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Rol</label>
            <select
              className="w-full mt-2 bg-[#171717] border border-white/5 rounded-xl py-3 px-4 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Selecciona tu rol</option>
              <option value="ROLE_RECEPCIONISTA">Recepcionista</option>
              <option value="ROLE_ADMIN">Administrador</option>
              <option value="ROLE_SUPERADMIN">Superadmin</option>
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full bg-red-600 hover:bg-red-700 disabled:cursor-wait disabled:bg-red-900 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]">
            {loading ? 'Conectando con API...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
