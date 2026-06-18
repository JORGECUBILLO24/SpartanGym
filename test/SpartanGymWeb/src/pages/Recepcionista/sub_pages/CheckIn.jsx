import { useState } from 'react';
import { 
  QrCode, CheckCircle2, User, Calendar, 
  CreditCard, Clock, XCircle 
} from 'lucide-react';

const CheckIn = () => {
  // 1. Iniciamos en 'false' para ver la pantalla de espera primero
  const [socioValidado, setSocioValidado] = useState(false);

  // Historial de la parte inferior
  const ultimosAccesos = [
    { id: 1, socio: 'Juan Pérez', membresia: 'Premium', hora: '09:05 AM', estado: 'Permitido' },
    { id: 2, socio: 'María Gómez', membresia: 'Básica', hora: '08:42 AM', estado: 'Permitido' },
    { id: 3, socio: 'Pedro Silva', membresia: 'Básica', hora: '08:30 AM', estado: 'Denegado' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* ========================================== */}
      {/* SECCIÓN SUPERIOR: ESCÁNER Y VALIDACIÓN (50/50) */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. IZQUIERDA: Escáner QR en grande */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-center min-h-100 relative overflow-hidden group shadow-lg">
          
          <div className="absolute top-6 left-6 flex items-center gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="font-bold text-sm tracking-wide">Cámara Activa</h3>
          </div>
          
          <div className="mt-4 relative flex flex-col items-center">
            {/* Animación del cuadro de escaneo */}
            <div className="w-56 h-56 border-2 border-red-600/30 rounded-2xl flex items-center justify-center relative overflow-hidden bg-red-500/5">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-600 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-600 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-600 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-600 rounded-br-lg"></div>
              
              <div className="absolute top-1/2 w-full h-h-0.5 bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.6)] animate-[ping_3s_ease-in-out_infinite]"></div>
              
              <QrCode size={100} className="text-white/10" strokeWidth={1} />
            </div>
            
            <p className="text-gray-400 text-sm mt-8 text-center max-w-xs">
              Pide al socio que acerque su código QR a la cámara para validar su entrada.
            </p>
          </div>

          {/* === NUEVO: BOTÓN DE VALIDAR ABAJO A LA DERECHA === */}
          <div className="absolute bottom-6 right-6">
            <button 
              onClick={() => setSocioValidado(!socioValidado)}
              className="bg-[#e50914] hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-colors text-sm shadow-lg shadow-red-900/20"
            >
              {socioValidado ? 'Reiniciar' : 'Validar'}
            </button>
          </div>

        </div>

        {/* 2. DERECHA: Resultado de la Validación */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-8 flex flex-col h-full relative overflow-hidden shadow-lg">
          
          <h3 className="font-bold text-sm text-gray-400 mb-6 uppercase tracking-wider">Información del Socio</h3>

          {socioValidado ? (
            // PANTALLA DE ACCESO PERMITIDO
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20"></div>
                <CheckCircle2 size={90} className="text-green-500 relative z-10 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2">¡Acceso Validado!</h2>
              <p className="text-green-500 font-medium bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 text-sm mb-8">
                Membresía Activa
              </p>

              <div className="w-full max-w-sm space-y-4 text-left">
                <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                  <div className="bg-[#2a0808] p-2.5 rounded-lg text-red-500"><User size={20} /></div>
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase font-bold">Nombre Completo</p>
                    <p className="text-white font-semibold text-lg">Carlos Andrés Ramírez</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                  <div className="bg-[#2a0808] p-2.5 rounded-lg text-red-500"><CreditCard size={20} /></div>
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase font-bold">Plan Actual</p>
                    <p className="text-white font-semibold text-lg">Plan Premium Anual</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                  <div className="bg-[#2a0808] p-2.5 rounded-lg text-red-500"><Calendar size={20} /></div>
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase font-bold">Fecha y Hora de Ingreso</p>
                    <p className="text-white font-semibold text-lg">Hoy, 09:09 AM</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // PANTALLA ESPERANDO LECTURA (Ahora con animación sutil)
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 animate-fade-in">
              <QrCode size={60} className="mb-4 opacity-30 animate-pulse" />
              <p className="text-lg font-medium">Esperando escaneo...</p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* SECCIÓN INFERIOR: HISTORIAL RÁPIDO           */}
      {/* ========================================== */}
      <div className="bg-[#111111] rounded-2xl border border-white/5 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-4 text-white">
          <div className="text-red-500"><Clock size={20} /></div>
          <h3 className="font-bold">Historial reciente</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="pb-3 font-medium pr-4">Socio</th>
                <th className="pb-3 font-medium pr-4">Membresía</th>
                <th className="pb-3 font-medium pr-4">Hora</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimosAccesos.map((acceso) => (
                <tr key={acceso.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-3 flex items-center gap-3 pr-4">
                    <div className="w-7 h-7 rounded-full bg-[#2a0808] text-red-500 flex items-center justify-center"><User size={12}/></div>
                    <span className="font-medium">{acceso.socio}</span>
                  </td>
                  <td className="py-3 text-gray-400 pr-4">{acceso.membresia}</td>
                  <td className="py-3 text-gray-400 pr-4">{acceso.hora}</td>
                  <td className="py-3">
                    {acceso.estado === 'Permitido' ? (
                      <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-medium border border-green-500/20">
                        <CheckCircle2 size={12} /> {acceso.estado}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-medium border border-red-500/20">
                        <XCircle size={12} /> {acceso.estado}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CheckIn;