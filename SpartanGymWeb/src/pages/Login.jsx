import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { guardarCuentaActual } from '../utils/cuentaActual';
import { useLogosApp } from '../utils/logosApp';
import { obtenerNombreGimnasio, useConfiguracionApp } from '../utils/configuracionApp';
import { authApi, authStorage } from '../services/api';
import AccesoGoogle from '../components/AccesoGoogle';
import showcaseImage from '../assets/gym-youngla-physique.webp';

const clienteGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

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
  const configuracionApp = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracionApp);
  const logoMarca = logos.acceso || logos.principal;
  const mostrarLogoMarca = Boolean(logoMarca);

  const completarSesion = (session) => {
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authApi.login(email.trim(), password);
      completarSesion(session);
    } catch (err) {
      setError(
        err.status
          ? err.message
          : 'No se pudo conectar con la API. Verifica tu conexión a internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const session = await authApi.loginGoogle(credential);
      completarSesion(session);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión con Google.');
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
      setRecoveryError('Ingresa tu correo electrónico para enviar el enlace de recuperación.');
      return;
    }

    try {
      setRecoveryLoading(true);
      await authApi.solicitarRestablecimiento(correoDestino);
      setRecoveryMessage('Hemos enviado un correo con las instrucciones de recuperación.');
    } catch (err) {
      setRecoveryError(err.message || 'No se pudo solicitar el enlace de recuperación.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const usaCorreoIngresado = email.trim().length > 0;

  return (
    <div className="min-h-screen w-full bg-[#070606] text-white flex flex-col lg:grid lg:grid-cols-2 overflow-x-hidden">
      {/* ====================================================================
          COLUMNA IZQUIERDA: Formulario ordenado, pulido y ergonomico
          ==================================================================== */}
      <div className="w-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 min-h-screen z-10">
        {/* Cabecera superior con navegación */}
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] backdrop-blur-md"
            aria-label="Volver al inicio"
          >
            <span>← Volver al inicio</span>
          </Link>

          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 border border-white/10 px-3 py-1 rounded-full bg-white/[0.02]">
            Plataforma Pro
          </span>
        </header>

        {/* Contenido Central del Formulario */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {/* Marca configurable del gimnasio */}
          <div className="flex flex-col items-center text-center mb-5">
            <Link to="/" className="group inline-block" aria-label={nombreGimnasio}>
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-3 rounded-full bg-red-600/20 blur-2xl opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                {mostrarLogoMarca ? (
                  <img src={logoMarca} alt={nombreGimnasio} width="180" height="90" className="relative h-20 sm:h-24 w-auto object-contain drop-shadow-[0_10px_25px_rgba(239,68,68,0.25)] transition-transform duration-300 group-hover:scale-105" />
                ) : <span className="relative max-w-[18rem] text-center text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">{nombreGimnasio}</span>}
              </div>
            </Link>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Iniciar Sesión<span>.</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              Ingresa tus credenciales para acceder a {nombreGimnasio}
            </p>
          </div>

          {/* Selector Segmentado estilo iOS entre Iniciar sesión y Registrarse */}
          <div className="flex p-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl mb-5">
            <span className="flex-1 text-center py-2 text-xs font-bold rounded-full bg-white text-black shadow-lg">
              Iniciar sesión
            </span>
            <Link
              to="/registro"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-full text-neutral-400 hover:text-white transition-colors"
            >
              Crear cuenta
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5" aria-busy={loading}>
            {/* Campo Correo */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Correo electrónico
              </label>
              <div className="group relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500 transition-colors group-focus-within:text-white" />
                <input
                  id="login-email"
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full rounded-2xl border border-white/10 bg-[#121111] py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-white/30 focus:bg-[#181616] focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecovery((actual) => !actual);
                    setRecoveryEmail((actual) => actual || email);
                    setRecoveryMessage('');
                    setRecoveryError('');
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500 transition-colors group-focus-within:text-white" />
                <input
                  id="login-password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña"
                  className="w-full rounded-2xl border border-white/10 bg-[#121111] py-2.5 pl-11 pr-11 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-white/30 focus:bg-[#181616] focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-3.5 text-neutral-500 transition-colors hover:text-white"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Campo Rol */}
            <div>
              <label htmlFor="login-role" className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Rol <span className="font-normal text-neutral-500">(opcional)</span>
              </label>
              <div className="relative">
                <select
                  id="login-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-[#121111] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-white/30 focus:bg-[#181616] focus:ring-1 focus:ring-white/20"
                >
                  <option value="">Detectar automáticamente</option>
                  <option value="ROLE_RECEPCIONISTA">Recepcionista</option>
                  <option value="ROLE_ADMIN">Administrador</option>
                  <option value="ROLE_SUPERADMIN">Superadmin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">
                  <span className="text-xs">▼</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] p-3 text-xs text-neutral-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-white mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Principal en Negro Obsidiana */}
            <button
              disabled={loading}
              type="submit"
              className="w-full h-11 mt-1 rounded-2xl bg-black border border-white/25 text-white font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 hover:bg-neutral-900 hover:border-white/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait shadow-xl shadow-black/80 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Google SSO */}
          {clienteGoogle && (
            <div className="mt-3.5">
              <AccesoGoogle cliente={clienteGoogle} recibirCredencial={handleGoogle} ocupado={loading} />
            </div>
          )}

          {/* Formulario Desplegable de Recuperación */}
          {showRecovery && (
            <form
              id="recovery-form"
              onSubmit={handleRecovery}
              className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center animate-in fade-in duration-300"
            >
              <h2 className="text-xs font-black uppercase tracking-wide text-white">¿Olvidaste tu contraseña?</h2>
              <p className="text-[11px] leading-4 text-neutral-400">
                {usaCorreoIngresado
                  ? 'Enviaremos un enlace seguro al correo indicado arriba.'
                  : 'Ingresa tu correo para recibir un enlace de recuperación.'}
              </p>

              {!usaCorreoIngresado && (
                <div className="group relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    placeholder="tu.correo@ejemplo.com"
                    className="w-full rounded-xl border border-white/10 bg-[#121111] py-2 pl-11 pr-4 text-xs text-white placeholder-neutral-600 outline-none focus:border-white/30"
                  />
                </div>
              )}

              {recoveryError && (
                <div role="alert" className="text-xs text-neutral-300 bg-white/5 border border-white/10 rounded-xl p-2.5">
                  {recoveryError}
                </div>
              )}

              {recoveryMessage && (
                <div role="status" className="text-xs text-white bg-white/10 border border-white/20 rounded-xl p-2.5">
                  {recoveryMessage}
                </div>
              )}

              <button
                disabled={recoveryLoading}
                type="submit"
                className="w-full h-9 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wide transition-all hover:bg-neutral-200 active:scale-95"
              >
                {recoveryLoading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {/* Pie de Enlace a Registro */}
          <div className="mt-4 text-center text-xs text-neutral-500">
            ¿Aún no tienes una cuenta?{' '}
            <Link to="/registro" className="font-bold text-white hover:underline ml-1">
              Regístrate aquí
            </Link>
          </div>
        </div>

        {/* Footer simple */}
        <footer className="text-center text-[11px] text-neutral-600 mt-4">
          © {new Date().getFullYear()} {nombreGimnasio} • Todos los derechos reservados.
        </footer>
      </div>

      {/* ====================================================================
          COLUMNA DERECHA: Vitrina Cinematográfica Gymshark / YoungLA (50% pantalla)
          ==================================================================== */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between relative min-h-screen overflow-hidden bg-black p-10 xl:p-14">
        {/* Imagen de fondo de alta estética YoungLA / Gymshark */}
        <img
          src={showcaseImage}
          alt="Atleta entrenando en un gimnasio"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105 scale-100 hover:scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Gradiente y Viñeta Cinematográfica */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070606] via-[#070606]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070606] via-transparent to-transparent opacity-90" />

        {/* Badge Superior */}
        <div className="relative z-10 self-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-xl text-xs font-semibold text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>{nombreGimnasio.toUpperCase()} • ATHLETIC PERFORMANCE</span>
          </div>
        </div>

        {/* Contenido Flotante estilo Campaña YoungLA / Gymshark */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-xl mb-4 text-xs font-bold text-neutral-300">
            <Sparkles size={14} className="text-white" />
            <span>DISCIPLINA & ALTO RENDIMIENTO</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Forja tu mejor versión<span>.</span>
          </h2>

          <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
            Equipamiento biomecánico de última generación, comunidad inquebrantable y seguimiento profesional en cada repetición.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Zap size={14} />
              <span>+100 Estaciones Pro</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <ShieldCheck size={14} />
              <span>Coaching Certificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
