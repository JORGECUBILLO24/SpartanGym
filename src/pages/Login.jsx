import { useMemo, useState } from 'react';
import { User, Lock, Eye, EyeOff, Shield, ChevronDown, ChevronRight, Dumbbell, Bell, Crown } from 'lucide-react';

import LogoSpartan from '../assets/Logo SpartanGym.png'; 
import FondoLogin from '../assets/fondo_login.png'; 

export default function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const roles = useMemo(() => ([
    { id: 'socio', label: 'Socio', icon: <User size={18} className="text-gray-400" /> },
    { id: 'entrenador', label: 'Entrenador', icon: <Dumbbell size={18} className="text-gray-400" /> },
    { id: 'recepcionista', label: 'Recepcionista', icon: <Bell size={18} className="text-gray-400" /> },
    { id: 'administrador', label: 'Administrador', icon: <Crown size={18} className="text-gray-400" /> },
  ]), []);

  const credentials = {
    administrador: { identifier: 'admin@spartangym.com', password: 'admin123', route: '/admin' },
    recepcionista: { identifier: 'recepcion@spartangym.com', password: 'recep123', route: '/recepcionista' },
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setIsDropdownOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedRole) {
      setError('Selecciona un rol antes de iniciar sesión.');
      return;
    }

    const config = credentials[selectedRole.id];

    if (!config) {
      setError('Este rol todavía no tiene una pantalla asignada. Usa Recepcionista o Administrador.');
      return;
    }

    if (identifier.trim().toLowerCase() !== config.identifier || password !== config.password) {
      setError('Credenciales incorrectas. Revisa el correo, contraseña y rol.');
      return;
    }

    onLoginSuccess?.(selectedRole.id);
  };

  return (
    <div 
      className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${FondoLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Capa oscura para oscurecer el fondo y que resalte el formulario */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo y Título */}
        <img src={LogoSpartan} alt="Spartan Gym" className="w-64 object-contain" />
        <h2 className="text-gray-300 text-lg mb-8 tracking-wide">Sistema de Gestión Integral</h2>

        {/* Tarjeta del Formulario */}
        <form className="w-full bg-[#0a0a0a] border border-red-900/60 rounded-[2rem] p-6 shadow-2xl" onSubmit={handleSubmit}>
          
          {/* Input: Correo o usuario */}
          <div className="mb-5">
            <label className="block text-gray-300 text-sm font-medium mb-2">Correo o usuario</label>
            <div className="flex items-center bg-[#111111] border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-red-700 transition-colors">
              <User size={20} className="text-gray-500 mr-3" />
              <input 
                type="text" 
                placeholder="Ingresa tu correo o usuario" 
                className="bg-transparent w-full text-gray-200 focus:outline-none placeholder-gray-600 text-sm"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>
          </div>

          {/* Input: Contraseña */}
          <div className="mb-5">
            <label className="block text-gray-300 text-sm font-medium mb-2">Contraseña</label>
            <div className="flex items-center bg-[#111111] border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-red-700 transition-colors">
              <Lock size={20} className="text-gray-500 mr-3" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Ingresa tu contraseña" 
                className="bg-transparent w-full text-gray-200 focus:outline-none placeholder-gray-600 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Input Custom: Rol */}
          <div className="mb-8 relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Rol</label>
            
            {/* Botón del Dropdown */}
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-between bg-[#111111] border ${isDropdownOpen ? 'border-red-700' : 'border-zinc-800'} rounded-xl px-4 py-3 cursor-pointer transition-colors`}
            >
              <div className="flex items-center">
                {selectedRole ? selectedRole.icon : <Shield size={20} className="text-gray-500 mr-3" />}
                <span className={`text-sm ml-3 ${selectedRole ? 'text-gray-200' : 'text-gray-600'}`}>
                  {selectedRole ? selectedRole.label : 'Selecciona tu rol'}
                </span>
              </div>
              <ChevronDown size={20} className="text-gray-500" />
            </div>

            {/* Opciones del Dropdown */}
            {isDropdownOpen && (
              <div className="absolute w-full mt-2 bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden z-20 shadow-xl">
                {roles.map((role) => (
                  <div 
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className="flex items-center px-4 py-3 hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-0"
                  >
                    {role.icon}
                    <span className="text-gray-300 text-sm ml-3">{role.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón Iniciar Sesión */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-700 to-red-900 text-white font-semibold py-3.5 px-4 rounded-xl flex justify-between items-center hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-900/30"
          >
            <span className="w-full text-center">Iniciar sesión</span>
            <ChevronRight size={20} />
          </button>

          {error ? (
            <p className="mt-4 text-sm text-red-400 text-center leading-5">{error}</p>
          ) : null}

          {/* Link: Olvidaste tu contraseña */}
          <div className="mt-6 text-center">
            <a href="#" className="text-red-700 hover:text-red-500 text-sm transition-colors font-medium">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          
        </form>
      </div>
    </div>
  );
}