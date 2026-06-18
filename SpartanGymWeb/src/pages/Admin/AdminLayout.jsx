import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, DollarSign, Box,
  BarChart3, Settings, Bell, UserPlus, ShoppingCart,
  Key, Sliders, Menu, X, Building2, UserCircle, LogOut
} from 'lucide-react';

import LogoWeb from '../../assets/Logo Web.webp';
import ControlSesion from '../../components/ControlSesion';
import {
  cerrarSesionActual,
  EVENTO_CUENTA_ACTUAL,
  leerCuentaActual,
  obtenerInicialesCuenta,
} from '../../utils/cuentaActual';

const AdminLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cuentaActual, setCuentaActual] = useState(() => leerCuentaActual());
  const ubicacionActual = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const actualizarCuenta = () => setCuentaActual(leerCuentaActual());

    window.addEventListener('storage', actualizarCuenta);
    window.addEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);

    return () => {
      window.removeEventListener('storage', actualizarCuenta);
      window.removeEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);
    };
  }, []);

  const inicialesCuenta = useMemo(() => obtenerInicialesCuenta(cuentaActual), [cuentaActual]);

  const cerrarSesion = () => {
    cerrarSesionActual('manual');
    setMenuAbierto(false);
    navigate('/login', { replace: true });
  };

  const obtenerTituloPagina = () => {
    switch (ubicacionActual.pathname) {
      case '/admin': return 'Panel de administrador';
      case '/admin/usuarios': return 'Gestión de Usuarios';
      case '/admin/finanzas': return 'Reportes Financieros';
      case '/admin/inventario': return 'Control de Inventario';
      case '/admin/reportes': return 'Reportes Estadísticos';
      case '/admin/configuracion': return 'Ajustes del Sistema';
      case '/admin/sucursales': return 'Gestión de Sucursales';
      case '/admin/membresias': return 'Gestión de Membresías';
      case '/admin/registrar-socio': return 'Registro de Socio';
      case '/admin/mensajes': return 'Mensajes Globales';
      case '/admin/perfil': return 'Perfil del Administrador';
      default: return 'Administración';
    }
  };

  return (
    <div className="admin-theme flex min-h-dvh overflow-hidden bg-[#050505] font-sans text-white transition-colors duration-300">
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1.25rem))] flex-col border-r border-white/5 bg-[#050505] shadow-2xl shadow-black/50 transition-transform duration-300 lg:static lg:w-72 lg:translate-x-0 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:py-5">
          <Link to="/admin" aria-label="Ir al inicio de administrador" className="inline-flex max-w-full">
            <img
              src={LogoWeb}
              alt="Spartan Gym"
              width="320"
              height="213"
              decoding="async"
              className="h-auto w-44 max-w-full object-contain drop-shadow-[0_0_14px_rgba(220,38,38,0.45)] transition duration-300 hover:scale-[1.02]"
            />
          </Link>
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
          <ElementoNavegacion to="/admin" icono={<LayoutDashboard size={18} />} etiqueta="Inicio" exact />
          <ElementoNavegacion to="/admin/usuarios" icono={<Users size={18} />} etiqueta="Usuarios" />
          <ElementoNavegacion to="/admin/finanzas" icono={<DollarSign size={18} />} etiqueta="Finanzas" />
          <ElementoNavegacion to="/admin/inventario" icono={<Box size={18} />} etiqueta="Inventario" />
          <ElementoNavegacion to="/admin/reportes" icono={<BarChart3 size={18} />} etiqueta="Reportes" />
          <ElementoNavegacion to="/admin/sucursales" icono={<Building2 size={18} />} etiqueta="Sucursales" />
          <ElementoNavegacion to="/admin/membresias" icono={<CreditCard size={18} />} etiqueta="Membresías" />
          <ElementoNavegacion to="/admin/mensajes" icono={<Bell size={18} />} etiqueta="Mensajes" />
          <ElementoNavegacion to="/admin/perfil" icono={<UserCircle size={18} />} etiqueta="Mi perfil" />
          <ElementoNavegacion to="/admin/configuracion" icono={<Settings size={18} />} etiqueta="Configuración" />

          <div className="mb-2 mt-8 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Accesos rápidos</p>
          </div>
          <AccesoRapido to="/admin/registrar-socio" icono={<UserPlus size={18} />} etiqueta="Registrar socio" />
          <AccesoRapido to="/admin/inventario" icono={<ShoppingCart size={18} />} etiqueta="Nueva venta" />
          <AccesoRapido to="/admin/membresias" icono={<Key size={18} />} etiqueta="Crear membresía" />
          <AccesoRapido to="/admin/mensajes" icono={<Bell size={18} />} etiqueta="Mensaje global" />
          <AccesoRapido to="/admin/configuracion" icono={<Sliders size={18} />} etiqueta="Ajustes del sistema" />
          <div className="mt-4 border-t border-white/5 pt-4">
            <BotonCerrarSesion onClick={cerrarSesion} />
          </div>
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <header className="admin-header z-30 flex min-h-16 items-center justify-between gap-3 border-b border-white/5 bg-[#050505]/80 px-3 py-3 backdrop-blur-md sm:min-h-20 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMenuAbierto(true)}
              className="shrink-0 rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="hidden h-6 w-1 rounded-full bg-red-600 sm:block" />
            <h2 className="min-w-0 truncate text-[15px] font-bold tracking-tight sm:text-lg">{obtenerTituloPagina()}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link to="/admin/mensajes" aria-label="Ver mensajes" className="rounded-lg p-2 text-gray-400 transition-all hover:bg-white/5 hover:text-white">
              <Bell size={20} />
            </Link>
            <Link
              to="/admin/perfil"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:scale-105"
              title={cuentaActual.name || cuentaActual.username || 'Perfil administrador'}
              aria-label="Editar perfil de administrador"
            >
              {inicialesCuenta}
            </Link>
          </div>
        </header>

        <main className="admin-main min-w-0 flex-1 overflow-y-auto bg-[#050505]">
          <div key={ubicacionActual.pathname} className="page-transition-shell mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ControlSesion />
    </div>
  );
};

const ElementoNavegacion = ({ icono, etiqueta, to, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-300 ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    {icono} <span>{etiqueta}</span>
  </NavLink>
);

const AccesoRapido = ({ icono, etiqueta, to }) => (
  <NavLink
    to={to}
    className="group flex w-full items-center gap-3 rounded-lg p-2.5 text-sm text-gray-500 transition-all duration-300 hover:bg-white/[0.03] hover:text-white sm:p-3"
  >
    <span className="rounded-lg p-1.5 transition-colors group-hover:bg-white/5">{icono}</span>
    <span>{etiqueta}</span>
  </NavLink>
);

const BotonCerrarSesion = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-bold text-red-500 transition-all duration-300 hover:bg-red-500/10 sm:p-3"
  >
    <span className="rounded-lg p-1.5 transition-colors group-hover:bg-red-500/10">
      <LogOut size={18} />
    </span>
    <span>Cerrar sesion</span>
  </button>
);

export default AdminLayout;
