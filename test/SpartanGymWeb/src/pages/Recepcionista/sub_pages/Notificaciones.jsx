import { useEffect, useState } from 'react';
import { Info, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { operacionApi } from '../../../services/api';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    operacionApi.notificaciones()
      .then(setNotificaciones)
      .catch(() => setError('No se pudieron cargar las notificaciones desde la base de datos.'));
  }, []);

  const marcarLeida = async (id) => {
    try {
      const actualizada = await operacionApi.marcarNotificacionLeida(id);
      setNotificaciones(notificaciones.map((notif) => notif.id === id ? actualizada : notif));
    } catch {
      setError('No se pudo marcar la notificación como leída.');
    }
  };

  return (
    <div className="max-w-4xl p-6 pt-0 animate-in fade-in duration-500">
      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}

      <div className="bg-[#0d0d0d] rounded-3xl border border-white/5 overflow-hidden">
        {notificaciones.length > 0 ? (
          notificaciones.map((notif) => (
            <button key={notif.id} type="button" onClick={() => marcarLeida(notif.id)} className={`flex w-full items-start gap-4 p-6 text-left border-b border-white/5 hover:bg-[#171717] transition-all ${notif.leida ? 'opacity-60' : ''}`}>
              <div className={`p-3 rounded-full ${notif.tipo === 'info' ? 'bg-blue-500/10 text-blue-500' : notif.tipo === 'alerta' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {notif.tipo === 'info' && <Info size={20} />}
                {notif.tipo === 'alerta' && <AlertCircle size={20} />}
                {notif.tipo === 'exito' && <CheckCircle2 size={20} />}
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">{notif.titulo}</h4>
                <p className="text-xs text-gray-400 mt-1">{notif.mensaje}</p>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold uppercase">
                <Clock size={12} />
                {new Date(notif.fechaCreacion).toLocaleString()}
              </div>
            </button>
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
