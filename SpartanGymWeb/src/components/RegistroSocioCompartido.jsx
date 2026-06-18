import { useEffect, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  EVENTO_MEMBRESIAS,
  leerMembresiasCompartidas,
  obtenerEtiquetaMembresia,
} from '../utils/membresiasCompartidas';
import {
  agregarSocioCompartido,
  EVENTO_SOCIOS,
  leerSociosCompartidos,
  obtenerNombreSocio,
} from '../utils/sociosCompartidos';
import {
  leerGimnasiosDisponibles,
  obtenerGimnasioPredeterminado,
} from '../utils/gimnasiosCompartidos';
import { useConfiguracionApp } from '../utils/configuracionApp';

const formularioInicial = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  membresia: '',
  sucursal: obtenerGimnasioPredeterminado(),
};

const RegistroSocioCompartido = ({
  subtitulo = 'Registro de socios',
  titulo = 'Datos del Nuevo Socio',
  descripcion = 'Ingresa la informacion personal y selecciona el plan para completar el registro.',
}) => {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [planesMembresia, setPlanesMembresia] = useState(() => leerMembresiasCompartidas());
  const [sociosCompartidos, setSociosCompartidos] = useState(() => leerSociosCompartidos());
  const gimnasios = leerGimnasiosDisponibles();
  useConfiguracionApp();

  useEffect(() => {
    const actualizarPlanes = () => setPlanesMembresia(leerMembresiasCompartidas());

    window.addEventListener('storage', actualizarPlanes);
    window.addEventListener(EVENTO_MEMBRESIAS, actualizarPlanes);

    return () => {
      window.removeEventListener('storage', actualizarPlanes);
      window.removeEventListener(EVENTO_MEMBRESIAS, actualizarPlanes);
    };
  }, []);

  useEffect(() => {
    const actualizarSocios = () => setSociosCompartidos(leerSociosCompartidos());

    window.addEventListener('storage', actualizarSocios);
    window.addEventListener(EVENTO_SOCIOS, actualizarSocios);

    return () => {
      window.removeEventListener('storage', actualizarSocios);
      window.removeEventListener(EVENTO_SOCIOS, actualizarSocios);
    };
  }, []);

  const actualizarCampo = (evento) => {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
    setErrorRegistro('');
  };

  const guardarRegistro = (evento) => {
    evento.preventDefault();
    setEnviando(true);

    setTimeout(() => {
      const resultado = agregarSocioCompartido(formulario);

      if (!resultado.ok) {
        setEnviando(false);
        setGuardado(false);
        setErrorRegistro(resultado.mensaje);
        setSociosCompartidos(resultado.socios);
        return;
      }

      setSociosCompartidos(resultado.socios);
      setEnviando(false);
      setGuardado(true);
      setErrorRegistro('');

      setTimeout(() => {
        setFormulario(formularioInicial);
        setGuardado(false);
      }, 2600);
    }, 1100);
  };

  const nombreCompleto = [formulario.nombre, formulario.apellido].filter(Boolean).join(' ');

  return (
    <div className="pagina-stack flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="tarjeta-sistema relative overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">{subtitulo}</p>
            <h2 className="mt-1 text-xl font-black text-white">{titulo}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{descripcion}</p>
          </div>

          <form onSubmit={guardarRegistro} className="relative z-10 space-y-6">
            {errorRegistro && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                <AlertCircle size={15} />
                {errorRegistro}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <CampoRegistro
                icono={User}
                etiqueta="Nombres"
                nombre="nombre"
                valor={formulario.nombre}
                placeholder="Ej. Juan Carlos"
                onChange={actualizarCampo}
                requerido
              />
              <CampoRegistro
                icono={User}
                etiqueta="Apellidos"
                nombre="apellido"
                valor={formulario.apellido}
                placeholder="Ej. Perez Silva"
                onChange={actualizarCampo}
                requerido
              />
              <CampoRegistro
                icono={Mail}
                etiqueta="Correo electronico"
                nombre="correo"
                type="email"
                valor={formulario.correo}
                placeholder="correo@ejemplo.com"
                onChange={actualizarCampo}
              />
              <CampoRegistro
                icono={Phone}
                etiqueta="Telefono"
                nombre="telefono"
                type="tel"
                valor={formulario.telefono}
                placeholder="+505 0000 0000"
                onChange={actualizarCampo}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 border-t border-white/5 pt-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Plan de membresia</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <select
                    name="membresia"
                    required
                    value={formulario.membresia}
                    onChange={actualizarCampo}
                    className="campo-sistema w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#050505] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
                  >
                    <option value="" disabled>Selecciona un plan...</option>
                    {planesMembresia.map((plan) => (
                      <option key={plan.id} value={plan.nombrePlan}>{obtenerEtiquetaMembresia(plan)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Gimnasio asignado</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <select
                    name="sucursal"
                    required
                    value={formulario.sucursal}
                    onChange={actualizarCampo}
                    className="campo-sistema w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#050505] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
                  >
                    {gimnasios.map((gimnasio) => (
                      <option key={gimnasio.id} value={gimnasio.nombre}>{gimnasio.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-stretch pt-2 sm:justify-end">
              <button
                type="submit"
                disabled={enviando || guardado}
                className={`boton-primario inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-black text-white shadow-lg transition-all sm:w-auto ${
                  guardado ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20 hover:bg-red-700'
                } ${enviando ? 'cursor-wait opacity-70' : ''}`}
              >
                {enviando ? 'Guardando...' : guardado ? <><CheckCircle2 size={18} /> Socio guardado</> : <><Save size={18} /> Completar registro</>}
              </button>
            </div>
          </form>
        </section>

        <aside className="tarjeta-sistema tarjeta-preview-socio rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 xl:sticky xl:top-6">
          <h3 className="mb-6 w-full text-center text-xs font-black uppercase tracking-widest text-gray-500">
            Vista previa del perfil
          </h3>

          <div className="relative mx-auto flex w-full max-w-sm flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#050505] p-5 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
            <div className="mt-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/5 bg-[#0a0a0a] text-gray-600 transition-all duration-300 hover:rotate-0 hover:border-red-500/50 sm:rotate-3">
              <User size={40} />
              <div className="absolute hidden flex-col items-center text-red-500">
                <Camera size={24} />
                <span className="mt-1 text-[10px] font-bold">ANADIR</span>
              </div>
            </div>

            <h4 className="mt-4 w-full break-words px-2 text-center text-lg font-black text-white">
              {nombreCompleto || 'Nombre del Socio'}
            </h4>
            <p className="mt-1 mb-4 w-full break-all px-2 text-center text-xs text-gray-500">
              {formulario.correo || 'correo@gym.com'}
            </p>

            <div className="w-full rounded-xl border border-white/5 bg-[#0a0a0a] p-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Membresia activa</p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={formulario.membresia ? 'text-red-500' : 'text-gray-600'} />
                <p className={`min-w-0 break-words text-sm font-bold ${formulario.membresia ? 'text-white' : 'text-gray-600'}`}>
                  {formulario.membresia || 'Sin plan asignado'}
                </p>
              </div>
            </div>

            <div className="mt-3 w-full rounded-xl border border-white/5 bg-[#0a0a0a] p-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Gimnasio asignado</p>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-red-500" />
                <p className="min-w-0 break-words text-sm font-bold text-white">
                  {formulario.sucursal}
                </p>
              </div>
            </div>

            <div className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-white/5">
              <p className="text-[8px] font-black tracking-[0.3em] text-gray-500">ID PENDIENTE</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Base global</p>
            <h3 className="text-lg font-black text-white">Socios sincronizados</h3>
            <p className="mt-1 text-xs text-gray-500">Creados desde admin o recepcion, visibles para ambos perfiles.</p>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">
            {sociosCompartidos.length} socios
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4 font-bold">Socio</th>
                <th className="pb-3 pr-4 font-bold">Membresia</th>
                <th className="pb-3 pr-4 font-bold">Sucursal</th>
                <th className="pb-3 pr-4 font-bold">Creado por</th>
                <th className="pb-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sociosCompartidos.slice(0, 8).map((socio) => (
                <tr key={socio.id} className="hover:bg-white/[0.03]">
                  <td className="py-3 pr-4">
                    <p className="font-black text-white">{obtenerNombreSocio(socio)}</p>
                    <p className="text-[10px] text-gray-500">{socio.correo || socio.telefono || 'Sin contacto'}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{socio.membresia}</td>
                  <td className="py-3 pr-4 text-gray-400">{socio.sucursal}</td>
                  <td className="py-3 pr-4 text-gray-400">{socio.creadoPorRol}</td>
                  <td className="py-3">
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-black uppercase text-green-500">
                      {socio.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

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
