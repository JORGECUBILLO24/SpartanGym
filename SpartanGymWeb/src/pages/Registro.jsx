import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, UserPlus, User } from 'lucide-react';
import FondoLogin from '../assets/fondo_login.webp';
import { useLogosApp } from '../utils/logosApp';

const Registro = () => {
  const navigate = useNavigate();
  const logos = useLogosApp();

  const handleRegister = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${FondoLogin})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black"></div>

      <Link
        to="/"
        className="relative z-10 mb-8"
        aria-label="Volver al inicio"
      >
        <img
          src={logos.acceso}
          alt="Logo Spartan Gym"
          width="512"
          height="512"
          decoding="async"
          fetchPriority="high"
          className="w-64 h-auto object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
        />
      </Link>

      <div className="tarjeta-sistema relative z-10 w-full max-w-md rounded-3xl border border-red-900/30 bg-[#0c0c0d] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs text-red-500 uppercase font-extrabold tracking-[0.25em]">
            Crea tu cuenta
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Regístrate en Spartan Gym
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Nombre completo</label>
            <div className="group relative mt-2">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="text" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu nombre" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Correo electrónico</label>
            <div className="group relative mt-2">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="email" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu correo" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Teléfono</label>
            <div className="group relative mt-2">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="tel" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu teléfono" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Contraseña</label>
            <div className="group relative mt-2">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input type="password" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Crea una contraseña" />
            </div>
          </div>

          <button type="submit" className="flex w-full items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]">
            <UserPlus className="w-4 h-4" />
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-red-500 hover:text-red-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;
