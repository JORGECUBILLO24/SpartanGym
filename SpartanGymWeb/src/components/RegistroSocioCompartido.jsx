import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Save,
  Send,
  User,
  KeyRound,
  X,
} from 'lucide-react';
import { membresiasApi, pagosApi, sociosApi, sucursalesApi, usuariosApi } from '../services/api';

const formularioInicial = {
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  password: '',
  sucursalId: '',
  tipoMembresiaId: '',
  metodoPago: 'Efectivo',
};

const RegistroSocioCompartido = ({
  subtitulo = 'Registro de socios',
  titulo = 'Datos del Nuevo Socio',
  descripcion = 'Ingresa la informacion personal y selecciona el plan para completar el registro.',
}) => {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [planesMembresia, setPlanesMembresia] = useState([]);
  const [socios, setSocios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState(null);
  const [socioPassword, setSocioPassword] = useState(null);
  const [passwordTemporal, setPasswordTemporal] = useState('');

  const cargarDatos = async () => {
    const [planes, sociosApiData, sucursalesApiData] = await Promise.all([
      membresiasApi.tipos(),
      sociosApi.listar(),
      sucursalesApi.listar(),
    ]);
    setPlanesMembresia(planes);
    setSocios(sociosApiData);
    setSucursales(sucursalesApiData);
    setFormulario((actual) => ({
      ...actual,
      sucursalId: actual.sucursalId || sucursalesApiData[0]?.id || '',
    }));
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch((error) => {
        const mensaje = error?.message || '';
        if (mensaje.includes('403') || mensaje.includes('401')) {
          setErrorRegistro('Sesion expirada. Cierra sesion e inicia nuevamente.');
        } else {
          setErrorRegistro('No se pudieron cargar socios o membresias desde la API. Verifica que el servidor este activo.');
        }
      });
  }, []);

  const actualizarCampo = (evento) => {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
    setErrorRegistro('');
  };

  const guardarRegistro = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setGuardado(false);
    setErrorRegistro('');

    try {
      const datosEnvio = { ...formulario };
      if (!datosEnvio.sucursalId) datosEnvio.sucursalId = null;
      if (!datosEnvio.tipoMembresiaId) datosEnvio.tipoMembresiaId = null;

      const socioCreado = await sociosApi.registrar(datosEnvio);

      if (datosEnvio.tipoMembresiaId) {
        try {
          await pagosApi.renovar({
            idSocio: socioCreado.id,
            idTipoMembresia: Number(formulario.tipoMembresiaId),
            metodoPago: formulario.metodoPago,
          });
        } catch (errorMembresia) {
          const msg = errorMembresia?.message || '';
          if (msg.includes('403') || msg.includes('401')) {
            setErrorRegistro('Socio registrado, pero no se pudo asignar la membresia porque la sesion expiro. Inicia sesion de nuevo y asigna la membresia manualmente.');
          } else {
            setErrorRegistro('Socio registrado, pero fallo la asignacion de membresia. Asignala manualmente desde Pagos.');
          }
          await cargarDatos();
          setFormulario((actual) => ({
            ...formularioInicial,
            sucursalId: actual.sucursalId,
          }));
          return;
        }
      }

      await cargarDatos();
      setFormulario((actual) => ({
        ...formularioInicial,
        sucursalId: actual.sucursalId,
      }));
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2600);
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('403') || msg.includes('401')) {
        setErrorRegistro('Sesion expirada. Cierra sesion e inicia nuevamente para registrar socios.');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setErrorRegistro('Error de conexion. Verifica que el servidor API este activo.');
      } else {
        setErrorRegistro(msg || 'No se pudo registrar el socio. Verifica email unico y sesion activa.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const nombreSocio = (socio) => [socio.nombres, socio.apellidos].filter(Boolean).join(' ').trim() || socio.email || 'Socio';

  const enviarEnlacePassword = async (socio) => {
    try {
      await usuariosApi.enviarEnlacePassword(socio.usuarioId || socio.id);
      setMensajeGestion({
        tipo: 'exito',
        texto: `Enlace de restablecimiento enviado a ${socio.email}.`,
      });
    } catch (error) {
      setMensajeGestion({
        tipo: 'error',
        texto: error.message || 'No se pudo enviar el enlace de restablecimiento.',
      });
    }
  };

  const cambiarPasswordSocio = async (evento) => {
    evento.preventDefault();
    if (!socioPassword) return;

    try {
      await usuariosApi.cambiarPassword(socioPassword.usuarioId || socioPassword.id, passwordTemporal);
      setMensajeGestion({
        tipo: 'exito',
        texto: `Contraseña actualizada para ${nombreSocio(socioPassword)}.`,
      });
      setSocioPassword(null);
      setPasswordTemporal('');
    } catch (error) {
      setMensajeGestion({
        tipo: 'error',
        texto: error.message || 'No se pudo cambiar la contraseña.',
      });
    }
  };

  return (
    <div className="pagina-stack flex flex-col gap-6">
      <section className="tarjeta-sistema relative overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">{subtitulo}</p>
          <h2 className="mt-1 text-xl font-black text-white">{titulo}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{descripcion}</p>
        </div>

        <form onSubmit={guardarRegistro} className="relative z-10 space-y-6">
          {errorRegistro && (
            <Mensaje tipo="error" texto={errorRegistro} />
          )}
          {guardado && (
            <Mensaje tipo="exito" texto="Socio registrado y membresia sincronizada con la base de datos." />
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <CampoRegistro icono={User} etiqueta="Nombres" nombre="nombres" valor={formulario.nombres} placeholder="Ej. Juan Carlos" onChange={actualizarCampo} requerido />
            <CampoRegistro icono={User} etiqueta="Apellidos" nombre="apellidos" valor={formulario.apellidos} placeholder="Ej. Perez Silva" onChange={actualizarCampo} requerido />
            <CampoRegistro icono={Mail} etiqueta="Correo electronico" nombre="email" type="email" valor={formulario.email} placeholder="correo@ejemplo.com" onChange={actualizarCampo} requerido />
            <CampoRegistro icono={Phone} etiqueta="Telefono" nombre="telefono" type="tel" valor={formulario.telefono} placeholder="+505 0000 0000" onChange={actualizarCampo} />
            <CampoRegistro icono={Lock} etiqueta="Contraseña inicial" nombre="password" type="text" valor={formulario.password} placeholder="Mínimo 6 caracteres" onChange={actualizarCampo} requerido />
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Sucursal</span>
              <select
                name="sucursalId"
                required
                value={formulario.sucursalId}
                onChange={actualizarCampo}
                className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-white/5 pt-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Plan de membresia</span>
              <span className="relative block">
                <CreditCard className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <select
                  name="tipoMembresiaId"
                  required
                  value={formulario.tipoMembresiaId}
                  onChange={actualizarCampo}
                  className="campo-sistema w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#050505] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
                >
                  <option value="" disabled>Selecciona un plan...</option>
                  {planesMembresia.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${Number(plan.precio || 0).toFixed(2)} / {plan.duracionDias} dias
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Metodo de pago</span>
              <select
                name="metodoPago"
                value={formulario.metodoPago}
                onChange={actualizarCampo}
                className="campo-sistema w-full cursor-pointer rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </label>
          </div>

          <div className="flex justify-stretch pt-2 sm:justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="boton-primario inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {enviando ? 'Guardando...' : <><Save size={18} /> Completar registro</>}
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Base de datos</p>
            <h3 className="text-lg font-black text-white">Socios registrados</h3>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">
            {socios.length} socios
          </span>
        </div>

        <div className="overflow-x-auto">
          {mensajeGestion && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
              mensajeGestion.tipo === 'exito'
                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                : 'border-red-500/20 bg-red-500/10 text-red-400'
            }`}>
              {mensajeGestion.tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {mensajeGestion.texto}
            </div>
          )}

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4 font-bold">Socio</th>
                <th className="pb-3 pr-4 font-bold">Membresia</th>
                <th className="pb-3 pr-4 font-bold">Sucursal</th>
                <th className="pb-3 pr-4 font-bold">Vencimiento</th>
                <th className="pb-3 font-bold">Estado</th>
                <th className="pb-3 font-bold">Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {socios.map((socio) => (
                <tr key={socio.id} className="hover:bg-white/[0.03]">
                  <td className="py-3 pr-4">
                    <p className="font-black text-white">{socio.nombres} {socio.apellidos}</p>
                    <p className="text-[10px] text-gray-500">{socio.email || socio.telefono || 'Sin contacto'}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{socio.tipoMembresia}</td>
                  <td className="py-3 pr-4 text-gray-400">{socio.sucursal || 'Sin sucursal'}</td>
                  <td className="py-3 pr-4 text-gray-400">{socio.fechaVencimiento || 'N/A'}</td>
                  <td className="py-3">
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase text-green-500">
                      {socio.estadoAcceso}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => enviarEnlacePassword(socio)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase text-blue-300 transition-all hover:bg-blue-600 hover:text-white"
                      >
                        <Send size={13} />
                        Enlace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSocioPassword(socio);
                          setPasswordTemporal('');
                          setMensajeGestion(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase text-amber-300 transition-all hover:bg-amber-500 hover:text-black"
                      >
                        <KeyRound size={13} />
                        Cambiar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {socioPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <form
            onSubmit={cambiarPasswordSocio}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0c] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Cuenta de socio</p>
                <h3 className="mt-1 text-lg font-black text-white">Cambiar contraseña</h3>
                <p className="mt-1 text-xs text-gray-500">{nombreSocio(socioPassword)} - {socioPassword.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSocioPassword(null)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Nueva contraseña</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                <input
                  type="text"
                  minLength={6}
                  required
                  value={passwordTemporal}
                  onChange={(e) => setPasswordTemporal(e.target.value)}
                  className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-amber-400"
                  placeholder="Minimo 6 caracteres"
                />
              </span>
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPasswordTemporal(Math.random().toString(36).slice(-8) + 'Gym!')}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-300 transition-colors hover:bg-white/10"
              >
                Generar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-black transition-colors hover:bg-amber-300"
              >
                Guardar contraseña
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const Mensaje = ({ tipo, texto }) => (
  <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
    tipo === 'exito'
      ? 'border-green-500/20 bg-green-500/10 text-green-400'
      : 'border-red-500/20 bg-red-500/10 text-red-400'
  }`}>
    {tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
    {texto}
  </div>
);

const CampoRegistro = ({
  icono: Icono,
  etiqueta,
  nombre,
  valor,
  placeholder,
  onChange,
  type = 'text',
  requerido = false,
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
    <span className="relative block">
      <Icono className="absolute left-4 top-3.5 text-gray-500" size={18} />
      <input
        type={type}
        name={nombre}
        required={requerido}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
        className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
      />
    </span>
  </label>
);

export default RegistroSocioCompartido;
