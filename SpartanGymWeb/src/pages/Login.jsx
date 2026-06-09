import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import LogoSpartan from '../assets/Logo SpartanGym.png'; 

const Login = () => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'Administrador') navigate('/admin');
    else if (role === 'Recepcionista') navigate('/recepcion');
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
              <input type="text" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu correo" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Contraseña</label>
            <div className="group relative mt-2">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="password" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu contraseña" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Rol</label>
            <select 
              className="w-full mt-2 bg-[#171717] border border-white/5 rounded-xl py-3 px-4 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Selecciona tu rol</option>
              <option value="Recepcionista">Recepcionista</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]">
            Iniciar sesión                 
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
