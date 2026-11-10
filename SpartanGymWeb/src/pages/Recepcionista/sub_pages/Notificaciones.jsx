import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Info, Mail, Smartphone } from 'lucide-react';
import { operacionApi } from '../../../services/api';

const normalizarTipo = (tipo) => {
  const valor = String(tipo || 'info').toLowerCase();
  if (valor.includes('alert') || valor.includes('pago') || valor.includes('venc')) return 'alerta';
  if (valor.includes('exito') || valor.includes('éxito') || valor.includes('check')) return 'exito';
  if (valor.includes('global')) return 'global';
  return 'info';
};

const formatearTiempo = (fecha) => {
  if (!fecha) return 'Reciente';
  return new Date(fecha).toLocaleString('es-NI');
};

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [errorApi, setErrorApi] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    operacionApi.notificaciones()
      .then((items) => setNotificaciones(items.map((notif) => ({
        ...notif,
        tipo: normalizarTipo(notif.tipo),
        tiempo: formatearTiempo(notif.fechaCreacion),
        categoria: notif.tipo || 'Sistema',
        canales: ['app'],
      }))))
      .catch(() => setErrorApi('No se pudieron cargar las notificaciones desde la API.'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="workspace-page mx-auto w-full max-w-5xl pb-4">
      <div className="workspace-notification-list overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d]">
        {errorApi && (
          <div className="flex items-center gap-2 border-b border-red-500/10 bg-red-500/10 p-4 text-xs font-bold text-red-400">
            <AlertCircle size={15} />
            {errorApi}
          </div>
        )}
        {cargando ? (
          <div role="status" className="p-8 text-center text-sm text-gray-400">Cargando notificaciones…</div>
        ) : notificaciones.length > 0 ? (
          notificaciones.map((notif) => (
            <article key={notif.id} className={`flex min-w-0 flex-wrap items-start gap-3 border-b border-white/5 p-4 transition-colors hover:bg-[#171717] sm:gap-4 sm:p-5 ${notif.leida ? 'opacity-60' : ''}`}>
              <div className={`p-3 rounded-full ${notif.tipo === 'info' ? 'bg-blue-500/10 text-blue-500' : notif.tipo === 'alerta' ? 'bg-red-500/10 text-red-500' : notif.tipo === 'global' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {notif.tipo === 'info' && <Info size={20} />}
                {notif.tipo === 'alerta' && <AlertCircle size={20} />}
                {notif.tipo === 'global' && <Mail size={20} />}
                {notif.tipo === 'exito' && <CheckCircle2 size={20} />}
              </div>

              <div className="min-w-0 flex-1">
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
                        {canal === 'email' ? 'Correo' : 'App'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                <Clock size={12} />
                {notif.tiempo}
              </div>
            </article>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">
            {errorApi ? 'No se pudieron cargar las notificaciones. Actualiza la página para volver a intentarlo.' : 'No tienes notificaciones nuevas.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
