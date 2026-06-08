import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, DollarSign, Box, 
  BarChart3, Settings, Search, Bell, UserPlus, 
  ShoppingCart, Key, Sliders, Menu, X, ChevronDown, Building2 
} from 'lucide-react';

import LogoWeb from "../../assets/Logo Web.png";

const AdminLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/admin': return 'Panel de administrador';
      case '/admin/usuarios': return 'Gestión de Usuarios';
      case '/admin/finanzas': return 'Reportes Financieros';
      case '/admin/inventario': return 'Control de Inventario';
      case '/admin/reportes': return 'Reportes Estadísticos';
      case '/admin/configuracion': return 'Ajustes del Sistema';
      case '/admin/sucursales': return 'Gestión de Sucursales';
      case '/admin/membresias': return 'Gestión de Membresías';
      case '/admin/registrar-socio': return 'Registro de Socio';
      default: return 'Administración';
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] border-r border-white/5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <img src={LogoWeb} alt="Spartan Gym" className="h-14 w-auto object-contain" />
          <button onClick={() => setIsMenuOpen(false)} className="lg:hidden text-white"><X size={24}/></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          <NavItem to="/admin" icon={<LayoutDashboard size={18}/>} label="Inicio" exact />
          <NavItem to="/admin/usuarios" icon={<Users size={18}/>} label="Usuarios" />
          <NavItem to="/admin/finanzas" icon={<DollarSign size={18}/>} label="Finanzas" />
          <NavItem to="/admin/inventario" icon={<Box size={18}/>} label="Inventario" />
          <NavItem to="/admin/reportes" icon={<BarChart3 size={18}/>} label="Reportes" />
          <NavItem to="/admin/sucursales" icon={<Building2 size={18}/>} label="Sucursales" />
          <NavItem to="/admin/membresias" icon={<CreditCard size={18}/>} label="Membresías" />
          <NavItem to="/admin/configuracion" icon={<Settings size={18}/>} label="Configuración" />

          <div className="mt-8 mb-2 px-3">
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Accesos rápidos</p>
          </div>
          <QuickLink to="/admin/registrar-socio" icon={<UserPlus size={18}/>} label="Registrar socio" />
          <QuickLink to="/admin/inventario" icon={<ShoppingCart size={18}/>} label="Nueva venta" />
          <QuickLink to="/admin/membresias" icon={<Key size={18}/>} label="Crear membresía" />
          <QuickLink to="/admin/configuracion" icon={<Sliders size={18}/>} label="Ajustes del sistema" />
        </nav>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 sm:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#050505]/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden text-white"><Menu size={22} /></button>
            <div className="hidden sm:block w-1 h-6 bg-red-600 rounded-full"></div>
            <h2 className="font-bold text-[15px] sm:text-lg tracking-tight">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-gray-400 cursor-pointer hover:text-white" />
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-sm shadow-lg">AD</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#050505]">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, to, exact }) => (
  <NavLink 
    to={to} 
    end={exact} 
    className={({ isActive }) => `flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon} <span>{label}</span>
  </NavLink>
);

const QuickLink = ({ icon, label, to }) => (
  <NavLink 
    to={to}
    className="flex items-center gap-3 w-full p-2.5 sm:p-3 text-gray-500 hover:text-white transition-colors text-sm group"
  >
    <span className="p-1.5 rounded-lg group-hover:bg-white/5 transition-colors">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default AdminLayout;