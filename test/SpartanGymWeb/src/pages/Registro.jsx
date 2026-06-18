import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, Phone, UserPlus, User } from 'lucide-react';
import LogoSpartan from '../assets/Logo SpartanGym.png';
import { authApi, authStorage } from '../services/api';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const session = await authApi.registerSocio(formData);
      authStorage.setSession(session);
      navigate('/login');
    } catch {
      setError('No se pudo completar el registro. Verifica los datos y que la API esté activa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative p-4">
      <div className="absolute inset-0 bg-[url('/src/assets/fondo_login.png')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black"></div>

      <Link
        to="/"
        className="relative z-10 mb-8"
        aria-label="Volver al inicio"
      >
        <img
          src={LogoSpartan}
          alt="Logo Spartan Gym"
          className="w-64 h-auto object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
        />
      </Link>

      <div className="relative z-10 w-full max-w-md bg-[#0c0c0d] p-8 rounded-3xl border border-red-900/30 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs text-red-500 uppercase font-extrabold tracking-[0.25em]">
            Crea tu cuenta
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            Regístrate en Spartan Gym
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Nombres</label>
              <div className="group relative mt-2">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
                <input name="nombres" value={formData.nombres} onChange={handleChange} required type="text" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Nombres" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">Apellidos</label>
              <div className="group relative mt-2">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
                <input name="apellidos" value={formData.apellidos} onChange={handleChange} required type="text" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Apellidos" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Correo electrónico</label>
            <div className="group relative mt-2">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input name="email" value={formData.email} onChange={handleChange} required type="email" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu correo" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Teléfono</label>
            <div className="group relative mt-2">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input name="telefono" value={formData.telefono} onChange={handleChange} type="tel" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Ingresa tu teléfono" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Contraseña</label>
            <div className="group relative mt-2">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input name="password" value={formData.password} onChange={handleChange} required minLength={6} type="password" className="w-full bg-[#171717] border border-white/5 rounded-xl py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]" placeholder="Crea una contraseña" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button disabled={isSubmitting} type="submit" className="flex w-full items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:cursor-wait disabled:bg-red-900 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]">
            <UserPlus className="w-4 h-4" />
            {isSubmitting ? 'Registrando...' : 'Registrarme'}
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
