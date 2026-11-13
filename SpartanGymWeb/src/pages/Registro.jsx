import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useLogosApp } from '../utils/logosApp';
import { obtenerNombreGimnasio, useConfiguracionApp } from '../utils/configuracionApp';
import { authApi, authStorage, sucursalesApi } from '../services/api';
import showcaseImage from '../assets/gym-youngla-athlete.webp';

const Registro = () => {
  const navigate = useNavigate();
  const logos = useLogosApp();
  const configuracionApp = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracionApp);
  const logoMarca = logos.acceso || logos.principal;
  const mostrarLogoMarca = Boolean(logoMarca);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    sucursalId: '',
  });
  const [sucursales, setSucursales] = useState([]);
  const [sucursalesError, setSucursalesError] = useState('');
  const [cargandoSucursales, setCargandoSucursales] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sucursalesApi
      .listarDisponibles()
      .then((resultado) => {
        const datos = Array.isArray(resultado) ? resultado : [];
        setSucursales(datos);
        setSucursalesError(
          datos.length === 0
            ? 'La administración debe configurar una sucursal antes de habilitar el registro.'
            : ''
        );
        setFormData((actual) => ({
          ...actual,
          sucursalId: actual.sucursalId || datos[0]?.id || '',
        }));
      })
      .catch(() => setSucursalesError('No se pudieron cargar las sucursales desde la API.'))
      .finally(() => setCargandoSucursales(false));
  }, []);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (sucursales.length === 0) return;
    setIsSubmitting(true);

    try {
      await authApi.registerSocio(formData);
      authStorage.clear();
      navigate('/login');
    } catch {
      setError('No se pudo completar el registro. Verifica los datos y que la API esté activa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070606] text-white flex flex-col lg:grid lg:grid-cols-2 overflow-x-hidden">
      {/* ====================================================================
          COLUMNA IZQUIERDA: Formulario de Registro ordenado y ergonómico
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
            Registro de Socios
          </span>
        </header>

        {/* Contenido Central del Formulario */}
        <div className="w-full max-w-lg mx-auto my-auto py-3">
          {/* Marca configurable del gimnasio */}
          <div className="flex flex-col items-center text-center mb-4">
            <Link to="/" className="group inline-block" aria-label={nombreGimnasio}>
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-3 rounded-full bg-red-600/20 blur-2xl opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                {mostrarLogoMarca ? (
                  <img src={logoMarca} alt={nombreGimnasio} width="180" height="90" className="relative h-20 sm:h-24 w-auto object-contain drop-shadow-[0_10px_25px_rgba(239,68,68,0.25)] transition-transform duration-300 group-hover:scale-105" />
                ) : <span className="relative max-w-[18rem] text-center text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">{nombreGimnasio}</span>}
              </div>
            </Link>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Crea tu cuenta<span>.</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              Únete hoy a {nombreGimnasio} y lleva tu entrenamiento al siguiente nivel
            </p>
          </div>

          {/* Selector Segmentado estilo iOS entre Iniciar sesión y Registrarse */}
          <div className="flex p-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl mb-4">
            <Link
              to="/login"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-full text-neutral-400 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <span className="flex-1 text-center py-2 text-xs font-bold rounded-full bg-white text-black shadow-lg">
              Crear cuenta
            </span>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Fila 1: Nombres y Apellidos */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CampoRegistro
                icon={User}
                label="Nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Tus nombres"
                required
              />
              <CampoRegistro
                icon={User}
                label="Apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Tus apellidos"
                required
              />
            </div>

            {/* Fila 2: Correo y Teléfono */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CampoRegistro
                icon={Mail}
                label="Correo electrónico"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu.correo@ejemplo.com"
                type="email"
                required
              />
              <CampoRegistro
                icon={Phone}
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+505 8888 8888"
                type="tel"
              />
            </div>

            {/* Fila 3: Contraseña y Sucursal */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CampoRegistro
                icon={Lock}
                label="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                type="password"
                minLength={8}
                required
              />

              {/* Selector de Sucursal */}
              <div>
                <label htmlFor="registro-sucursal" className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Sucursal
                </label>
                <div className="group relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500 transition-colors group-focus-within:text-white" />
                  <select
                    id="registro-sucursal"
                    name="sucursalId"
                    value={formData.sucursalId}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-[#121111] py-2.5 pl-11 pr-8 text-xs sm:text-sm text-white outline-none transition-all focus:border-white/30 focus:bg-[#181616] focus:ring-1 focus:ring-white/20"
                  >
                    <option value="">Selecciona tu sucursal</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-neutral-500">
                    <span className="text-[10px]">▼</span>
                  </div>
                </div>
                {sucursalesError && (
                  <p id="sucursal-status" role="status" className="mt-2 text-xs leading-relaxed text-neutral-400">
                    {sucursalesError}
                  </p>
                )}
                {cargandoSucursales && (
                  <p id="sucursal-status" role="status" className="mt-2 text-xs text-neutral-400">
                    Cargando sucursales…
                  </p>
                )}
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
              disabled={isSubmitting || cargandoSucursales || sucursales.length === 0}
              type="submit"
              aria-describedby={sucursalesError || cargandoSucursales ? 'sucursal-status' : undefined}
              className="w-full h-11 mt-1 rounded-2xl bg-black border border-white/25 text-white font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 hover:bg-neutral-900 hover:border-white/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/80 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando…</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {cargandoSucursales
                      ? 'Cargando sucursales…'
                      : sucursales.length === 0
                        ? 'Registro no disponible'
                        : 'Crear mi cuenta'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Pie de Enlace a Login */}
          <div className="mt-4 text-center text-xs text-neutral-500">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link to="/login" className="font-bold text-white hover:underline ml-1">
              Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* Footer simple */}
        <footer className="text-center text-[11px] text-neutral-600 mt-3">
          © {new Date().getFullYear()} {nombreGimnasio} • Todos los derechos reservados.
        </footer>
      </div>

      {/* ====================================================================
          COLUMNA DERECHA: Vitrina Cinematográfica Gymshark / YoungLA (50% pantalla)
          ==================================================================== */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between relative min-h-screen overflow-hidden bg-black p-10 xl:p-14">
        {/* Imagen de fondo de alta estética */}
        <img
          src={showcaseImage}
          alt="Comunidad entrenando en el gimnasio"
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
            <span>COMUNIDAD & PROGRESIÓN</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Comienza tu legado<span>.</span>
          </h2>

          <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
            Planes de entrenamiento a tu medida, acceso a todas las áreas de fuerza y una comunidad enfocada en resultados reales.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <Zap size={14} />
              <span>Sin Contratos Forzosos</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <ShieldCheck size={14} />
              <span>Acceso Integral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampoRegistro = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  minLength,
}) => {
  const [mostrar, setMostrar] = useState(false);
  const esPassword = type === 'password';
  const tipoInput = esPassword ? (mostrar ? 'text' : 'password') : type;

  return (
    <div>
      <label htmlFor={name} className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
        {label}
      </label>
      <div className="group relative">
        <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500 transition-colors group-focus-within:text-white" />
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          type={tipoInput}
          className={`w-full rounded-2xl border border-white/10 bg-[#121111] py-3 pl-11 ${
            esPassword ? 'pr-11' : 'pr-4'
          } text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-white/30 focus:bg-[#181616] focus:ring-1 focus:ring-white/20`}
          placeholder={placeholder}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute right-3.5 top-3.5 text-neutral-500 transition-colors hover:text-white"
            aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Registro;
