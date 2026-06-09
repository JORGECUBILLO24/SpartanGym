import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, ChevronRight, QrCode, User, 
  CalendarClock, CheckCircle2, MonitorSmartphone, UserPlus 
} from 'lucide-react';

const Inicio = () => {
  const navigate = useNavigate(); 

  // Datos de ejemplo para las tablas
  const pagosRecientes = [
    { id: 1, socio: 'Juan Pérez', membresia: 'Premium', monto: '$600', fecha: '12/05/2026', estado: 'Pagado' },
    { id: 2, socio: 'María Gómez', membresia: 'Básica', monto: '$450', fecha: '12/05/2026', estado: 'Pagado' },
    { id: 3, socio: 'Carlos Ramírez', membresia: 'Premium', monto: '$600', fecha: '11/05/2026', estado: 'Pagado' },
    { id: 4, socio: 'Ana Torres', membresia: 'Elite', monto: '$800', fecha: '11/05/2026', estado: 'Pagado' },
  ];

  const proximosVencimientos = [
    { id: 1, socio: 'Luis Hernández', membresia: 'Básica', vence: '18/05/2026', dias: '6 días' },
    { id: 2, socio: 'Fernanda López', membresia: 'Premium', vence: '20/05/2026', dias: '8 días' },
    { id: 3, socio: 'Roberto Silva', membresia: 'Elite', vence: '23/05/2026', dias: '11 días' },
    { id: 4, socio: 'Daniela Castro', membresia: 'Básica', vence: '25/05/2026', dias: '13 días' },
  ];

  return (
    <div className="flex flex-col gap-4 lg:gap-6 animate-fade-in">
      
      {/* Grid de Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-6">
        <StatCard icon={<QrCode size={20}/>} title="Check-ins" value="64" />
        
        {/* --- CONECTADO: Tarjeta de Pagos --- */}
        <StatCard 
          icon={<DollarSign size={20}/>} 
          title="Pagos" 
          value="$1,280" 
          onClick={() => navigate('/recepcion/pagos')}
        />
        
        {/* --- CONECTADO: Tarjeta de Vencimientos (Membresías) --- */}
        <StatCard 
          icon={<CalendarClock size={20}/>} 
          title="Vencimientos" 
          value="9" 
          onClick={() => navigate('/recepcion/membresias')}
        />
        
        <StatCard icon={<UserPlus size={20}/>} title="Socios nuevos" value="6" />
      </div>

      {/* Grid de Acciones Principales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <ActionCard 
          icon={<QrCode size={24} />}
          title="Control de acceso" 
          desc="Valida la membresía activa de los socios y registra su check-in para ingresar al gimnasio." 
          btnText="Registrar check-in"
          onClick={() => navigate('/recepcion/check-in')} 
          rightContent={
            <div className="h-full w-full bg-[#050505] rounded-lg border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-gray-500 text-xs mb-4">Escanear código QR</div>
                <div className="w-24 h-24 border-2 border-red-600/50 rounded-lg flex items-center justify-center relative">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
                  <QrCode size={48} className="text-white" />
                </div>
                <div className="flex items-center gap-2 mt-4 text-green-500 text-xs bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  <CheckCircle2 size={12} /> Membresía activa
                </div>
            </div>
          }
        />
        <ActionCard 
          icon={<UserPlus size={24} />}
          title="Registro de nuevos socios" 
          desc="Crea nuevos registros de clientes y asígnales el plan de membresía que mejor se adapte a sus objetivos." 
          btnText="Registrar socio"
          onClick={() => navigate('/recepcion/registrar-socio')} 
          rightContent={
            <div className="h-full w-full bg-[#050505] rounded-lg border border-white/5 p-4 flex items-center justify-center">
              <MonitorSmartphone size={80} className="text-white/10" strokeWidth={1} />
            </div>
          }
        />
      </div>

      {/* Grid de Tablas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        
        {/* Tabla Pagos */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-5 flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 text-white">
            <div className="text-red-500"><DollarSign size={20} /></div>
            <h3 className="font-bold">Pagos recientes</h3>
          </div>
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium pr-4">Socio</th>
                  <th className="pb-3 font-medium pr-4">Membresía</th>
                  <th className="pb-3 font-medium pr-4">Monto</th>
                  <th className="pb-3 font-medium pr-4">Fecha</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecientes.map((pago) => (
                  <tr key={pago.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-3 flex items-center gap-2 pr-4">
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px]"><User size={12}/></div>
                      {pago.socio}
                    </td>
                    <td className="py-3 text-gray-400 pr-4">{pago.membresia}</td>
                    <td className="py-3 pr-4">{pago.monto}</td>
                    <td className="py-3 text-gray-400 pr-4">{pago.fecha}</td>
                    <td className="py-3">
                      <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-medium border border-green-500/20">{pago.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* --- CONECTADO: Botón inferior "Ver todos los pagos" --- */}
          <button 
            onClick={() => navigate('/recepcion/pagos')}
            className="text-red-500 text-sm font-medium mt-auto pt-4 flex items-center gap-1 hover:text-red-400 transition-colors w-fit cursor-pointer"
          >
            Ver todos los pagos <ChevronRight size={16} />
          </button>
        </div>

        {/* Tabla Vencimientos */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-5 flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 text-white">
            <div className="text-red-500"><CalendarClock size={20} /></div>
            <h3 className="font-bold">Próximos vencimientos</h3>
          </div>
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium pr-4">Socio</th>
                  <th className="pb-3 font-medium pr-4">Membresía</th>
                  <th className="pb-3 font-medium pr-4">Vence el</th>
                  <th className="pb-3 font-medium text-right">Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {proximosVencimientos.map((vencimiento) => (
                  <tr key={vencimiento.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-3 flex items-center gap-2 pr-4">
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px]"><User size={12}/></div>
                      {vencimiento.socio}
                    </td>
                    <td className="py-3 text-gray-400 pr-4">{vencimiento.membresia}</td>
                    <td className="py-3 text-gray-400 pr-4">{vencimiento.vence}</td>
                    <td className="py-3 text-right text-orange-400 font-medium">{vencimiento.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* --- CONECTADO: Botón inferior "Ver todos los vencimientos" --- */}
          <button 
            onClick={() => navigate('/recepcion/membresias')}
            className="text-red-500 text-sm font-medium mt-auto pt-4 flex items-center gap-1 hover:text-red-400 transition-colors w-fit cursor-pointer"
          >
            Ver todos los vencimientos <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

// --- MODIFICADO: Agregamos la propiedad 'onClick' para que la tarjeta sea clickeable ---
const StatCard = ({ icon, title, value, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-[#111111] p-3 sm:p-4 lg:p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-white/20 transition-colors cursor-pointer group"
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
      <div className="text-red-500 p-2 sm:p-3 bg-[#2a0808] rounded-xl group-hover:bg-red-900/40 transition-colors">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 text-[11px] sm:text-[13px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{title}</span>
        <span className="text-xl sm:text-2xl font-bold">{value}</span>
      </div>
    </div>
    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors hidden sm:block" />
  </div>
);

const ActionCard = ({ icon, title, desc, btnText, rightContent, onClick }) => (
  <div className="bg-[#111111] p-5 lg:p-8 rounded-2xl border border-white/5 flex items-stretch hover:border-white/20 transition-all h-full relative overflow-hidden group">
    <div className="relative z-10 flex flex-col justify-between w-full lg:w-[60%]">
      <div>
        <div className="flex items-center gap-3 mb-3 text-white">
            <div className="text-red-500">{icon}</div>
            <h3 className="font-bold text-[17px]">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-sm">{desc}</p>
      </div>
      <button 
        onClick={onClick} 
        className="bg-[#e50914] w-fit px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer"
      >
        {btnText} <ChevronRight size={16} />
      </button>
    </div>
    <div className="hidden lg:block absolute right-6 top-6 bottom-6 w-[35%] opacity-80 group-hover:opacity-100 transition-opacity">
        {rightContent}
    </div>
  </div>
);

export default Inicio;