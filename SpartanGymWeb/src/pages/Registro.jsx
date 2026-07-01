import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import { useLogosApp } from '../utils/logosApp';
import { authApi, authStorage, sucursalesApi } from '../services/api';

const Registro = () => {
  const navigate = useNavigate();
  const logos = useLogosApp();
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    sucursalId: '',
  });
  const [sucursales, setSucursales] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sucursalesApi.listar()
      .then((datos) => {
        setSucursales(datos);
        setFormData((actual) => ({
          ...actual,
          sucursalId: actual.sucursalId || datos[0]?.id || '',
        }));
      })
      .catch(() => setError('No se pudieron cargar las sucursales desde la API.'));
  }, []);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.registerSocio(formData);
      authStorage.clear();
      navigate('/login');
    } catch {
      setError('No se pudo completar el registro. Verifica los datos y que la API este activa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${logos.fondoLogin})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black" />

      <Link to="/" className="relative z-10 mb-8" aria-label="Volver al inicio">
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

      <div className="tarjeta-sistema relative z-10 w-full max-w-md rounded-3xl border border-red-900/30 bg-[#0c0c0d] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-red-500">Crea tu cuenta</p>
          <h1 className="mt-2 text-2xl font-extrabold text-white">Registrate en Spartan Gym</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <CampoRegistro
              icon={User}
              label="Nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Nombres"
              required
            />
            <CampoRegistro
              icon={User}
              label="Apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Apellidos"
              required
            />
          </div>

          <CampoRegistro
            icon={Mail}
            label="Correo electronico"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ingresa tu correo"
            type="email"
            required
          />

          <CampoRegistro
            icon={Phone}
            label="Telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ingresa tu telefono"
            type="tel"
          />

          <CampoRegistro
            icon={Lock}
            label="Contraseña"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Crea una contraseña"
            type="password"
            minLength={6}
            required
          />

          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Sucursal</label>
            <div className="group relative mt-2">
              <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
              <select
                name="sucursalId"
                value={formData.sucursalId}
                onChange={handleChange}
                required
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            disabled={isSubmitting}
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-red-900"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-red-500 hover:text-red-400">
            Inicia sesion
          </Link>
        </p>
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
      <label className="text-xs font-bold uppercase text-gray-500">{label}</label>
      <div className="group relative mt-2">
        <Icon className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
        <input
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          type={tipoInput}
          className={`w-full rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 ${esPassword ? 'pr-11' : ''} text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]`}
          placeholder={placeholder}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute right-3 top-3.5 text-gray-500 transition-colors hover:text-red-500"
            aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Registro;
