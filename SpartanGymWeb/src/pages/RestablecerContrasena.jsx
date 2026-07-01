import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { useLogosApp } from '../utils/logosApp';

const RestablecerContrasena = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const logos = useLogosApp();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje('');
    setError('');

    if (!token) {
      setError('El enlace no contiene un token valido.');
      return;
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.restablecerPassword({ token, password });
      setMensaje(response?.mensaje || 'Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (errorApi) {
      setError(errorApi.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

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
          className="h-auto w-64 object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]"
        />
      </Link>

      <section className="tarjeta-sistema relative z-10 w-full max-w-sm rounded-3xl border border-red-900/30 bg-[#0c0c0d] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">Acceso seguro</p>
          <h1 className="mt-2 text-2xl font-black text-white">Restablecer contraseña</h1>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <CampoPassword
            label="Nueva contraseña"
            value={password}
            onChange={setPassword}
            placeholder="Minimo 6 caracteres"
          />
          <CampoPassword
            label="Confirmar contraseña"
            value={confirmacion}
            onChange={setConfirmacion}
            placeholder="Repite la nueva contraseña"
          />

          {mensaje && (
            <div className="flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{mensaje}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-wait disabled:bg-red-900"
          >
            <KeyRound size={17} />
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
};

const CampoPassword = ({ label, value, onChange, placeholder }) => {
  const [mostrar, setMostrar] = useState(false);

  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-gray-500">{label}</span>
      <span className="group relative mt-2 block">
        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-600 transition-colors group-focus-within:text-red-500" />
        <input
          type={mostrar ? 'text' : 'password'}
          minLength={6}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/5 bg-[#171717] py-3 pl-10 pr-11 text-white outline-none transition-colors focus:border-red-600 focus:bg-[#1a1a1a]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          className="absolute right-3 top-3.5 text-gray-500 transition-colors hover:text-red-500"
          aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
        >
          {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
};

export default RestablecerContrasena;
