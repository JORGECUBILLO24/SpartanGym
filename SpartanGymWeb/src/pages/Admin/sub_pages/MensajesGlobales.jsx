import { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  Send,
  Smartphone,
  Tag,
  Users,
} from 'lucide-react';
import {
  formatearHoraMensaje,
  guardarMensajeGlobal,
  leerMensajesGlobales,
} from '../../../utils/mensajesGlobales';
import { obtenerEtiquetaCuentaActual } from '../../../utils/cuentaActual';

const canalesDisponibles = [
  { id: 'email', label: 'Correo', icon: Mail, detalle: 'Bandeja principal' },
  { id: 'sms', label: 'SMS', icon: Smartphone, detalle: 'Mensaje corto' },
];

const categoriasMensaje = ['General', 'Promocion', 'Pagos', 'Membresias', 'Emergencia'];

const mensajeVacio = {
  asunto: '',
  mensaje: '',
  categoria: 'General',
  canales: ['email'],
};

const obtenerCuentaActual = () => {
  return obtenerEtiquetaCuentaActual();
};

const crearResumenEntrega = (canales) => ({
  email: canales.includes('email') ? '1,248 correos' : 'No incluido',
  sms: canales.includes('sms') ? '1,032 SMS' : 'No incluido',
});

const MensajesGlobales = () => {
  const [formulario, setFormulario] = useState(mensajeVacio);
  const [historial, setHistorial] = useState(() => leerMensajesGlobales());
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const categoriasResumen = useMemo(() => {
    return categoriasMensaje.map((categoria) => ({
      categoria,
      total: historial.filter((mensaje) => mensaje.categoria === categoria).length,
    }));
  }, [historial]);

  const alternarCanal = (canal) => {
    setFormulario((actual) => {
      const canales = actual.canales.includes(canal)
        ? actual.canales.filter((item) => item !== canal)
        : [...actual.canales, canal];

      return {
        ...actual,
        canales: canales.length ? canales : [canal],
      };
    });
  };

  const enviarMensaje = (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setEnviado(false);

    setTimeout(() => {
      const nuevoMensaje = {
        id: `MSG-${Date.now()}`,
        titulo: formulario.asunto.trim(),
        mensaje: formulario.mensaje.trim(),
        categoria: formulario.categoria,
        canales: formulario.canales,
        audiencia: 'Todos los usuarios',
        estado: 'Enviado',
        creadoPor: obtenerCuentaActual(),
        creadoEn: new Date().toISOString(),
        entregas: crearResumenEntrega(formulario.canales),
      };

      const mensajesActualizados = guardarMensajeGlobal(nuevoMensaje);
      setHistorial(mensajesActualizados);
      setFormulario(mensajeVacio);
      setEnviando(false);
      setEnviado(true);
      setTimeout(() => setEnviado(false), 2600);
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 pb-10 text-white">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResumenCard icon={Users} title="Audiencia" value="Todos" detail="Usuarios activos" />
        <ResumenCard icon={Mail} title="Correo" value="1,248" detail="Contactos disponibles" />
        <ResumenCard icon={Smartphone} title="SMS" value="1,032" detail="Telefonos disponibles" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          onSubmit={enviarMensaje}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:p-8"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60" />

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Comunicaciones</p>
              <h2 className="mt-1 text-xl font-black text-white">Mensaje global</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-green-500">
              <CheckCircle2 size={12} />
              {enviado ? 'Enviado' : 'Listo'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Asunto</label>
              <input
                required
                value={formulario.asunto}
                onChange={(evento) => setFormulario({ ...formulario, asunto: evento.target.value })}
                placeholder="Ej. Horario especial de esta semana"
                className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-3 top-3.5 text-gray-600" size={16} />
                <select
                  value={formulario.categoria}
                  onChange={(evento) => setFormulario({ ...formulario, categoria: evento.target.value })}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
                >
                  {categoriasMensaje.map((categoria) => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Mensaje</label>
            <textarea
              required
              rows={6}
              maxLength={280}
              value={formulario.mensaje}
              onChange={(evento) => setFormulario({ ...formulario, mensaje: evento.target.value })}
              placeholder="Escribe el mensaje que recibiran los usuarios."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm leading-6 text-white outline-none transition-all focus:border-red-600"
            />
            <div className="mt-2 flex justify-end text-[10px] font-bold text-gray-600">
              {formulario.mensaje.length}/280
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Canales de entrega</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {canalesDisponibles.map(({ id, label, icon: Icon, detalle }) => {
                const activo = formulario.canales.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => alternarCanal(id)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-300 ${
                      activo
                        ? 'border-red-500/60 bg-red-600/10 text-white shadow-lg shadow-red-950/20'
                        : 'border-white/10 bg-[#111] text-gray-400 hover:-translate-y-0.5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`rounded-lg p-2 ${activo ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-sm font-black">{label}</span>
                        <span className="block text-[10px] font-medium text-gray-500">{detalle}</span>
                      </span>
                    </span>
                    {activo && <CheckCircle2 size={16} className="text-red-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Bell size={14} />
              <span>Destino: todos los usuarios registrados</span>
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? (
                'Enviando...'
              ) : (
                <>
                  <Send size={16} />
                  Enviar global
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Mensajes por categoria</h3>
            <div className="space-y-3">
              {categoriasResumen.map(({ categoria, total }) => (
                <div key={categoria} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#111]/60 px-3 py-2.5">
                  <span className="text-xs font-bold text-white">{categoria}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-black text-gray-400">{total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Historial</h3>
              <span className="text-[10px] font-bold text-gray-600">{historial.length} envios</span>
            </div>

            <div className="custom-scrollbar max-h-[470px] space-y-3 overflow-y-auto pr-1">
              {historial.length ? (
                historial.map((mensaje) => (
                  <div key={mensaje.id} className="rounded-xl border border-white/5 bg-[#111]/60 p-4 transition-all hover:border-white/10">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white" title={mensaje.titulo}>{mensaje.titulo}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-500">{mensaje.categoria}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-gray-600">
                        <Clock size={11} />
                        {formatearHoraMensaje(mensaje.creadoEn)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-5 text-gray-400">{mensaje.mensaje}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mensaje.canales.map((canal) => (
                        <span key={canal} className="rounded-full border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                          {canal === 'email' ? 'Correo' : 'SMS'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/5 bg-[#111]/60 p-8 text-center text-xs font-medium text-gray-500">
                  Aun no hay mensajes enviados.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ResumenCard = ({ icon: Icon, title, value, detail }) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <h3 className="mt-1 text-2xl font-black text-white">{value}</h3>
      <p className="mt-1 text-[10px] font-bold text-gray-500">{detail}</p>
    </div>
    <div className="rounded-xl border border-red-500/10 bg-red-600/10 p-3 text-red-500">
      <Icon size={22} />
    </div>
  </div>
);

export default MensajesGlobales;
