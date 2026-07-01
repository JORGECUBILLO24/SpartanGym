import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { guardarCuentaActual } from '../utils/cuentaActual';
import { useLogosApp } from '../utils/logosApp';
import { authApi, authStorage } from '../services/api';

const roleRoutes = {
  ROLE_SUPERADMIN: '/admin',
  ROLE_ADMIN: '/admin',
  ROLE_RECEPCIONISTA: '/recepcion',
};

const roleLabels = {
  ROLE_SUPERADMIN: 'Superadmin',
  ROLE_ADMIN: 'Administrador',
  ROLE_RECEPCIONISTA: 'Recepcionista',
};

const Login = () => {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const logos = useLogosApp();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authApi.login(email, password);
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

      authStorage.setSession(session);
      guardarCuentaActual({
        username: session.email || email,
        role: roleLabels[apiRole] || apiRole,
        loggedAt: new Date().toISOString(),
      });
      navigate(destination);
    } catch {
      setError('No se pudo iniciar sesion. Verifica tus credenciales y que la API este activa.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setRecoveryMessage('');
    setRecoveryError('');

    const correoDestino = email.trim() || recoveryEmail.trim();
    if (!correoDestino) {
      setRecoveryError('Ingresa tu correo electronico para enviar el enlace de recuperacion.');
      return;
    }

    try {
      setRecoveryLoading(true);
      await authApi.solicitarRestablecimiento(correoDestino);
      setRecoveryMessage('Hemos enviado un correo de recuperacion.');
    } catch (error) {
      setRecoveryError(error.message || 'No se pudo solicitar el enlace de recuperacion.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const usaCorreoIngresado = email.trim().length > 0;

  return (
    <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${logos.fondoLogin})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/80 to-black" />

      <Link to="/" className="relative z-10 mb-10" aria-label="Volver al inicio">
        <img
          src={logos.acceso}
          alt="Logo Spartan Gym"
          width="512"
          height="512"
          decoding="async"
          fetchPriority="high"
          className="h-auto w-64 object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
        />
      </Link>

      <div className="tarjeta-sistema relative z-10 w-full max-w-sm rounded-3xl border border-red-900/30 bg-[#0c0c0d] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">Acceso Spartan</p>
          <h1 className="mt-2 text-2xl font-black text-white">Iniciar sesion</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Correo</label>
            <div className="group relative mt-2">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
                placeholder="Ingresa tu correo"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Contraseña</label>
            <div className="group relative mt-2">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 pr-11 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
                placeholder="Ingresa tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3.5 text-gray-500 transition-colors hover:text-red-500"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Rol</label>
            <select
              className="mt-2 w-full rounded-xl border border-white/5 bg-[#171717] px-4 py-3 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
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

          <button
            disabled={loading}
            type="submit"
            className="mt-4 w-full rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-red-900"
          >
            {loading ? 'Conectando con API...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="mt-5 border-t border-white/5 pt-5">
          <button
            type="button"
            onClick={() => {
              setShowRecovery((actual) => !actual);
              setRecoveryEmail((actual) => actual || email);
              setRecoveryMessage('');
              setRecoveryError('');
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-gray-200 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-white"
          >
            <Mail size={16} />
            Recuperar contraseña
          </button>

          {showRecovery && (
            <form onSubmit={handleRecovery} className="mt-4 space-y-4 rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center">
              <div className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-wide text-white">¿Has olvidado la contraseña?</h2>
                <p className="text-xs leading-5 text-gray-400">
                  {usaCorreoIngresado
                    ? 'Enviaremos un enlace seguro al correo que escribiste para iniciar sesion.'
                    : 'Escribe tu correo registrado para enviarte un enlace seguro.'}
                </p>
              </div>

              {!usaCorreoIngresado && (
                <div className="group relative text-left">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              )}

              {recoveryMessage && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs font-bold text-green-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{recoveryMessage}</span>
                </div>
              )}

              {recoveryError && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={recoveryLoading}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition-all hover:bg-gray-200 disabled:cursor-wait disabled:bg-gray-500"
              >
                {recoveryLoading ? 'Enviando enlace...' : 'Enviar enlace seguro'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
