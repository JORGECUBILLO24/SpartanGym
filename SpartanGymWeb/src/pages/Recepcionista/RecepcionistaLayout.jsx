import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, DollarSign, Search, Bell,
  UserPlus, Menu, X, QrCode, ClipboardList, User, LogOut, ShoppingCart
} from 'lucide-react';

import ControlSesion from '../../components/ControlSesion';
import { cerrarSesionActual } from '../../utils/cuentaActual';
import { useLogosApp } from '../../utils/logosApp';

const RecepcionistaLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacionActual = useLocation();
  const navigate = useNavigate();
  const logos = useLogosApp();

  const cerrarSesion = () => {
    cerrarSesionActual('manual');
    setMenuAbierto(false);
    navigate('/login', { replace: true });
  };

  const obtenerTituloPagina = () => {
    switch (ubicacionActual.pathname) {
      case '/recepcion': return 'Panel de inicio';
      case '/recepcion/check-in': return 'Check-in de Socios';
      case '/recepcion/registrar-socio': return 'Registrar Nuevo Socio';
      case '/recepcion/pagos': return 'Gestión de Pagos';
      case '/recepcion/ventas': return 'Venta de Productos';
      case '/recepcion/membresias': return 'Gestión de Membresías';
      case '/recepcion/asistencias': return 'Control de Asistencias';
      case '/recepcion/notificaciones': return 'Notificaciones';
      case '/recepcion/perfil': return 'Mi Perfil';
      default: return 'Panel de recepcionista';
    }
  };

  return (
    <div className="reception-theme flex min-h-dvh overflow-hidden bg-[#050505] font-sans text-white transition-colors duration-300">
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`reception-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1.25rem))] flex-col border-r border-white/5 bg-[#0a0a0a] shadow-2xl shadow-black/50 transition-transform duration-300 lg:static lg:w-72 lg:translate-x-0 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:py-5">
          <NavLink to="/recepcion" aria-label="Ir al inicio de recepcion" className="inline-flex max-w-full">
            <img
              src={logos.principal}
              alt="Logo Spartan Gym"
              width="320"
              height="213"
              decoding="async"
              className="h-auto w-44 max-w-full object-contain drop-shadow-[0_0_14px_rgba(220,38,38,0.45)] transition duration-300 hover:scale-[1.02]"
            />
          </NavLink>
          <button
            onClick={() => setMenuAbierto(false)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <nav
          className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-2"
          onClick={(event) => {
            if (event.target.closest('a')) setMenuAbierto(false);
          }}
        >
          <ElementoNavegacion to="/recepcion" icono={<LayoutDashboard size={18} />} etiqueta="Inicio" exact />
          <ElementoNavegacion to="/recepcion/check-in" icono={<QrCode size={18} />} etiqueta="Check-in" />
          <ElementoNavegacion to="/recepcion/registrar-socio" icono={<UserPlus size={18} />} etiqueta="Registrar socio" />
          <ElementoNavegacion to="/recepcion/pagos" icono={<DollarSign size={18} />} etiqueta="Pagos" />
          <ElementoNavegacion to="/recepcion/ventas" icono={<ShoppingCart size={18} />} etiqueta="Ventas" />
          <ElementoNavegacion to="/recepcion/membresias" icono={<CreditCard size={18} />} etiqueta="Membresías" />
          <ElementoNavegacion to="/recepcion/asistencias" icono={<ClipboardList size={18} />} etiqueta="Asistencias" />
          <ElementoNavegacion to="/recepcion/notificaciones" icono={<Bell size={18} />} etiqueta="Notificaciones" />
          <ElementoNavegacion to="/recepcion/perfil" icono={<User size={18} />} etiqueta="Perfil" />

          <div className="mt-4 border-t border-white/5 pt-4">
            <BotonCerrarSesion onClick={cerrarSesion} />
          </div>
        </nav>
      </aside>

      <main className="reception-main flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
        <header className="reception-header flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/5 bg-[#0a0a0a]/90 px-3 py-3 backdrop-blur-md sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMenuAbierto(true)}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            <h2 className="min-w-0 truncate text-[15px] font-semibold text-gray-200 sm:text-base">{obtenerTituloPagina()}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-48 rounded-full border border-white/10 bg-[#111111] py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-red-500/50 lg:w-64"
              />
            </div>

            <div className="relative cursor-pointer">
              <Bell size={20} className="text-gray-400 transition-colors hover:text-white" />
            </div>

            <NavLink to="/recepcion/perfil" className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90 lg:border-l lg:border-white/10 lg:pl-5">
              <div className="rounded-full bg-[#2a0808] p-2 text-red-500 transition duration-300 hover:scale-105">
                <User size={18} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">Recepcionista</p>
              </div>
            </NavLink>
          </div>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div key={ubicacionActual.pathname} className="page-transition-shell mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </div>
      </main>
      <ControlSesion />
    </div>
  );
};

const ElementoNavegacion = ({ icono, etiqueta, to, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex w-full items-center gap-3 rounded-lg p-2.5 text-sm transition-all duration-300 ${
        isActive
          ? 'border-l-4 border-red-600 bg-red-900/20 text-red-500 shadow-lg shadow-red-950/20'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`
    }
  >
    {icono} <span>{etiqueta}</span>
  </NavLink>
);

const BotonCerrarSesion = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-bold text-red-500 transition-all duration-300 hover:bg-red-500/10"
  >
    <span className="rounded-lg p-1.5 transition-colors group-hover:bg-red-500/10">
      <LogOut size={18} />
    </span>
    <span>Cerrar sesion</span>
  </button>
);

export default RecepcionistaLayout;
