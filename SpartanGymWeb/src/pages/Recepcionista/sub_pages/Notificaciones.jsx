import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Info, Mail, Smartphone } from 'lucide-react';
import {
  EVENTO_MENSAJES_GLOBALES,
  formatearHoraMensaje,
  leerMensajesGlobales,
} from '../../../utils/mensajesGlobales';

const notificacionesBase = [
  { id: 1, tipo: 'info', titulo: 'Nuevo socio registrado', mensaje: 'Anthony Flores se ha unido al plan Gold.', tiempo: 'Hace 5 min' },
  { id: 2, tipo: 'alerta', titulo: 'Pago pendiente', mensaje: 'Cristofer Cuarezma tiene un pago de mensualidad vencido.', tiempo: 'Hace 1 hora' },
  { id: 3, tipo: 'exito', titulo: 'Check-in exitoso', mensaje: 'Ricardo Prado ingreso a SpartanGym Central.', tiempo: 'Hace 3 horas' },
];

const Notificaciones = () => {
  const [mensajesGlobales, setMensajesGlobales] = useState(() => leerMensajesGlobales());

  useEffect(() => {
    const actualizarMensajes = () => setMensajesGlobales(leerMensajesGlobales());

    window.addEventListener('storage', actualizarMensajes);
    window.addEventListener(EVENTO_MENSAJES_GLOBALES, actualizarMensajes);

    return () => {
      window.removeEventListener('storage', actualizarMensajes);
      window.removeEventListener(EVENTO_MENSAJES_GLOBALES, actualizarMensajes);
    };
  }, []);

  const notificaciones = [
    ...mensajesGlobales.map((mensaje) => ({
      id: mensaje.id,
      tipo: 'global',
      titulo: mensaje.titulo,
      mensaje: mensaje.mensaje,
      tiempo: formatearHoraMensaje(mensaje.creadoEn),
      categoria: mensaje.categoria,
      canales: mensaje.canales,
    })),
    ...notificacionesBase,
  ];

  return (
    <div className="max-w-4xl p-6 pt-0 animate-in fade-in duration-500">
      <div className="bg-[#0d0d0d] rounded-3xl border border-white/5 overflow-hidden">
        {notificaciones.length > 0 ? (
          notificaciones.map((notif) => (
            <div key={notif.id} className="flex items-start gap-4 p-6 border-b border-white/5 hover:bg-[#171717] transition-all">
              <div className={`p-3 rounded-full ${notif.tipo === 'info' ? 'bg-blue-500/10 text-blue-500' : notif.tipo === 'alerta' ? 'bg-red-500/10 text-red-500' : notif.tipo === 'global' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {notif.tipo === 'info' && <Info size={20} />}
                {notif.tipo === 'alerta' && <AlertCircle size={20} />}
                {notif.tipo === 'global' && <Mail size={20} />}
                {notif.tipo === 'exito' && <CheckCircle2 size={20} />}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{notif.titulo}</h4>
                  {notif.tipo === 'global' && (
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-red-500">
                      {notif.categoria}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{notif.mensaje}</p>
                {notif.tipo === 'global' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notif.canales.map((canal) => (
                      <span key={canal} className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-gray-500">
                        {canal === 'email' ? <Mail size={10} /> : <Smartphone size={10} />}
                        {canal === 'email' ? 'Correo' : 'SMS'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold uppercase">
                <Clock size={12} />
                {notif.tiempo}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No tienes notificaciones nuevas.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
