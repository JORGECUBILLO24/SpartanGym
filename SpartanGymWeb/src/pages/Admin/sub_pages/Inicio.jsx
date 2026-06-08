import React from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTACIÓN NUEVA
import { 
  BarChart3, ChevronRight, CreditCard, Package, UserRoundCog, 
  Users, DollarSign, Calendar, UserCheck,
  Building2, Dumbbell, Contact 
} from 'lucide-react';

import imgLaptop from "../../../assets/ComputadoraSpartan.png";
import imgMembresia from "../../../assets/MembresiaSpartan.png"; 
import imgEstadisticas from "../../../assets/EstadisticasSpartan.png"; 
import imgSuplementos from "../../../assets/SuplementosSpartan.png"; 

const Inicio = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 flex flex-col gap-6 sm:gap-8">
      
      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Socios activos" value="128" icon={Users} color="text-gray-400" />
        <StatCard title="Ingresos mes" value="$4,850" icon={DollarSign} color="text-green-500" />
        <StatCard title="Por vencer" value="17" icon={Calendar} color="text-red-500" />
        <StatCard title="Personal" value="12" icon={UserCheck} color="text-blue-500" />
      </div>

      {/* MÓDULOS PRINCIPALES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 flex-grow">
        
        {/* MÓDULOS ORIGINALES */}
        <ModuleCard 
          title="Gestión de usuarios" 
          desc="Administra socios, entrenadores y recepción" 
          btnText="Ver usuarios" 
          img={imgLaptop}
          icon={UserRoundCog}
          linkTo="/admin/usuarios" // <-- RUTA CONECTADA
        />
        <ModuleCard 
          title="Tipos de membresía" 
          desc="Configura planes diarios, quincenales, mensuales y anuales" 
          btnText="Configurar" 
          img={imgMembresia}
          icon={CreditCard}
          linkTo="/admin/membresias" // <-- RUTA CONECTADA
        />
        <ModuleCard 
          title="Reportes financieros" 
          desc="Consulta ingresos, pagos y movimientos recientes" 
          btnText="Ver reportes" 
          img={imgEstadisticas}
          icon={BarChart3}
          linkTo="/admin/finanzas" // <-- RUTA CONECTADA
        />
        <ModuleCard 
          title="Inventario" 
          desc="Controla productos, stock y alertas de bajo inventario" 
          btnText="Ver inventario" 
          img={imgSuplementos}
          icon={Package}
          linkTo="/admin/inventario" // <-- RUTA CONECTADA
        />

        {/* NUEVOS MÓDULOS AÑADIDOS */}
        <ModuleCard 
          title="Sucursales y Gimnasios" 
          desc="Registra nuevas sucursales, ubicaciones, horarios y capacidad" 
          btnText="Agregar gimnasio" 
          img={imgMembresia} 
          icon={Building2}
          linkTo="/admin/sucursales" // <-- RUTA CONECTADA (Debes crearla en App.jsx luego)
        />
        <ModuleCard 
          title="Personal de Entrenamiento" 
          desc="Añade entrenadores, asigna especialidades, horarios y rutinas" 
          btnText="Agregar entrenador" 
          img={imgSuplementos} 
          icon={Dumbbell}
          linkTo="/admin/usuarios" // <-- Te lleva a la pantalla de Staff que creamos
        />
        <ModuleCard 
          title="Área de Recepción" 
          desc="Administra recepcionistas, accesos al sistema y control de turnos" 
          btnText="Agregar recepcionista" 
          img={imgLaptop} 
          icon={Contact}
          linkTo="/admin/usuarios" // <-- Te lleva a la pantalla de Staff que creamos
        />

      </div>

      <footer className="flex justify-between items-center text-[10px] sm:text-xs text-gray-600 mt-2 border-t border-white/5 pt-4">
        <p>© 2024 Spartan Gym. Todos los derechos reservados.</p>
        <p>Versión 1.0.0</p>
      </footer>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#090909] border border-white/5 p-3 sm:p-4 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors">
    <div className="overflow-hidden">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1 truncate">{title}</p>
      <h2 className="text-xl sm:text-2xl font-bold">{value}</h2>
    </div>
    <div className={`p-1.5 sm:p-2 bg-white/5 rounded-lg shrink-0 ml-2 ${color}`}>
      <Icon size={18} className="sm:w-5 sm:h-5" />
    </div>
  </div>
);

// Agregamos `linkTo` a las props de ModuleCard
const ModuleCard = ({ title, desc, btnText, img, icon: Icon, linkTo }) => {
  const navigate = useNavigate(); // <-- INICIALIZAMOS EL HOOK DE NAVEGACIÓN

  return (
    <div className="group relative h-[160px] sm:h-[200px] overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-2xl transition-all duration-500 hover:border-red-600/40">
      <img
        src={img}
        alt={title}
        className="absolute inset-y-0 right-0 h-full w-[65%] sm:w-[70%] object-cover opacity-40 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-60 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/95 to-transparent" />
      <div className="absolute inset-y-0 right-[8%] w-[45%] rotate-[4deg] rounded-xl border border-white/5 bg-black/20 backdrop-blur-[1px]" />

      <div className="relative z-10 flex h-full max-w-[75%] sm:max-w-[60%] flex-col justify-between p-4 sm:p-6">
        <div>
          <div className="mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-600/10 rounded-lg">
              <Icon size={20} className="text-red-600 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{title}</h3>
          </div>
          <p className="text-[10px] sm:text-xs leading-4 sm:leading-5 text-gray-400 pr-2 line-clamp-2 sm:line-clamp-none">{desc}</p>
        </div>

        {/* Agregamos el evento onClick al botón para que use la ruta asignada */}
        <button 
          onClick={() => navigate(linkTo)}
          className="flex w-fit items-center gap-1 sm:gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase text-white transition-all hover:bg-red-600 hover:border-red-600 cursor-pointer z-20 relative"
        >
          {btnText} <ChevronRight size={12} className="sm:w-3 sm:h-3" />
        </button>
      </div>
    </div>
  );
};

export default Inicio;