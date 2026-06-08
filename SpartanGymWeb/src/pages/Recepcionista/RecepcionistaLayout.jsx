import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, DollarSign, Search, Bell, 
  UserPlus, Menu, X, QrCode, ClipboardList, User
} from 'lucide-react';

import LogoWeb from '../../assets/Logo Web.png'; 

const RecepcionistaLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/recepcion': return 'Panel de inicio';
      case '/recepcion/check-in': return 'Check-in de Socios';
      case '/recepcion/registrar-socio': return 'Registrar Nuevo Socio';
      case '/recepcion/pagos': return 'Gestión de Pagos';
      case '/recepcion/membresias': return 'Gestión de Membresías';
      case '/recepcion/asistencias': return 'Control de Asistencias';
      case '/recepcion/notificaciones': return 'Notificaciones';
      case '/recepcion/perfil': return 'Mi Perfil';
      default: return 'Panel de recepcionista';
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Overlay para móvil */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <img src={LogoWeb} alt="Logo Spartan Gym" className="h-45 w-auto object-contain" />
          <button onClick={() => setIsMenuOpen(false)} className="lg:hidden p-2 text-white"><X size={24}/></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <NavItem to="/recepcion" icon={<LayoutDashboard size={18}/>} label="Inicio" exact={true} />
          <NavItem to="/recepcion/check-in" icon={<QrCode size={18}/>} label="Check-in" />
          <NavItem to="/recepcion/registrar-socio" icon={<UserPlus size={18}/>} label="Registrar socio" />
          <NavItem to="/recepcion/pagos" icon={<DollarSign size={18}/>} label="Pagos" />
          <NavItem to="/recepcion/membresias" icon={<CreditCard size={18}/>} label="Membresías" />
          <NavItem to="/recepcion/asistencias" icon={<ClipboardList size={18}/>} label="Asistencias" />
          <NavItem to="/recepcion/notificaciones" icon={<Bell size={18}/>} label="Notificaciones" />
          <NavItem to="/recepcion/perfil" icon={<User size={18}/>} label="Perfil" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0a0a0a]">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 -ml-2"><Menu size={24}/></button>
            <h2 className="font-medium text-gray-300 hidden md:block">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input type="text" placeholder="Buscar..." className="bg-[#111111] rounded-full pl-9 pr-4 py-2 text-sm outline-none border border-white/10 w-48 lg:w-64 focus:border-red-500/50 transition-colors" />
            </div>
            
            <div className="relative cursor-pointer">
              <Bell size={20} className="text-gray-400 hover:text-white transition-colors" />
            </div>

            <div className="flex items-center gap-3 lg:pl-5 lg:border-l lg:border-white/10 cursor-pointer">
              <div className="bg-[#2a0808] p-2 rounded-full text-red-500"><User size={18} /></div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">Recepcionista</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, to, exact }) => (
  <NavLink 
    to={to} 
    end={exact}
    className={({ isActive }) => 
      `flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors text-sm ${
        isActive 
        ? 'bg-red-900/20 text-red-500 border-l-4 border-red-600' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`
    }
  >
    {icon} <span>{label}</span>
  </NavLink>
);

export default RecepcionistaLayout;