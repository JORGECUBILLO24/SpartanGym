import { Info, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const Notificaciones = () => {
  const notificaciones = [
    { id: 1, tipo: 'info', titulo: 'Nuevo socio registrado', mensaje: 'Anthony Flores se ha unido al plan Gold.', tiempo: 'Hace 5 min' },
    { id: 2, tipo: 'alerta', titulo: 'Pago pendiente', mensaje: 'Cristofer Cuarezma tiene un pago de mensualidad vencido.', tiempo: 'Hace 1 hora' },
    { id: 3, tipo: 'exito', titulo: 'Check-in exitoso', mensaje: 'Ricardo Prado ingresó a SpartanGym Central.', tiempo: 'Hace 3 horas' },
  ];

  return (
    <div className="max-w-4xl p-6 pt-0 animate-in fade-in duration-500">
      {/* El título fue eliminado para iniciar directamente con la lista */}

      <div className="bg-[#0d0d0d] rounded-3xl border border-white/5 overflow-hidden">
        {notificaciones.length > 0 ? (
          notificaciones.map((notif) => (
            <div key={notif.id} className="flex items-start gap-4 p-6 border-b border-white/5 hover:bg-[#171717] transition-all">
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