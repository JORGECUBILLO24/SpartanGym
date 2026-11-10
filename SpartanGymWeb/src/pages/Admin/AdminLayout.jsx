import { useEffect, useState } from 'react';
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, DollarSign, Box,
  BarChart3, Settings, Bell, UserPlus, ShoppingCart,
  Key, Sliders, Menu, X, Building2, UserCircle, LogOut, Dumbbell,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

import ControlSesion from '../../components/ControlSesion';
import Avatar from '../../components/Avatar';
import {
  cerrarSesionActual,
  EVENTO_CUENTA_ACTUAL,
  guardarCuentaActual,
  leerCuentaActual,
} from '../../utils/cuentaActual';
import { useLogosApp } from '../../utils/logosApp';
import { SucursalProvider } from '../../context/SucursalContext';
import { operacionApi } from '../../services/api';
import { obtenerNombreGimnasio, useConfiguracionApp } from '../../utils/configuracionApp';

const AdminLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [cuentaActual, setCuentaActual] = useState(() => leerCuentaActual());
  const ubicacionActual = useLocation();
  const navigate = useNavigate();
  const logos = useLogosApp();
  const configuracion = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracion);
  const mostrarLogoPrincipal = Boolean(logos.principal);

  useEffect(() => {
    const actualizarCuenta = () => setCuentaActual(leerCuentaActual());

    window.addEventListener('storage', actualizarCuenta);
    window.addEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);

    return () => {
      window.removeEventListener('storage', actualizarCuenta);
      window.removeEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);
    };
  }, []);

  useEffect(() => {
    operacionApi.perfil()
      .then((datos) => {
        const remota = datos.fotoUrl || '';
        const cuenta = leerCuentaActual();
        if ((cuenta.fotoUrl || '') !== remota) {
          guardarCuentaActual({ ...cuenta, fotoUrl: remota });
        }
      })
      .catch(() => { /* sin sesion API valida: se queda con el valor local */ });
  }, []);

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
      case '/admin/rutinas': return 'Gestión de Rutinas';
      case '/admin/ventas': return 'Venta de Productos';
      default: return 'Administración';
    }
  };

  return (
    <SucursalProvider>
      <div className="admin-theme flex min-h-dvh overflow-hidden bg-[#050505] font-sans text-white transition-colors duration-300">
      <a href="#contenido-admin" className="skip-navigation">Saltar al contenido</a>
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside id="menu-admin" className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1.25rem))] flex-col border-r border-white/5 bg-[#050505] shadow-2xl shadow-black/50 transition-[width,transform] duration-300 lg:static lg:flex-none lg:translate-x-0 ${menuCompacto ? 'lg:w-20' : 'lg:w-72'} ${menuAbierto ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
        <div className={`flex shrink-0 items-center px-5 py-4 sm:py-5 ${menuCompacto ? 'justify-center lg:px-2' : 'justify-between'}`}>
          <Link to="/admin" aria-label="Ir al inicio de administrador" className="inline-flex max-w-full">
            {mostrarLogoPrincipal ? (
              <img src={logos.principal} alt={nombreGimnasio} width="320" height="213" decoding="async" className={`h-auto w-44 max-w-full object-contain drop-shadow-[0_0_14px_rgba(220,38,38,0.45)] transition duration-300 hover:scale-[1.02] ${menuCompacto ? 'lg:hidden' : ''}`} />
            ) : <span className={`max-w-44 text-center text-base font-black uppercase tracking-wide text-white ${menuCompacto ? 'lg:hidden' : ''}`}>{nombreGimnasio}</span>}
          </Link>
          <button
            type="button"
            onClick={() => setMenuCompacto((compacto) => !compacto)}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={menuCompacto ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            aria-expanded={!menuCompacto}
            aria-controls="menu-admin"
            title={menuCompacto ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          >
            {menuCompacto ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button
            onClick={() => setMenuAbierto(false)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <nav
          className={`custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-2 ${menuCompacto ? 'lg:px-2' : ''}`}
          onClick={(event) => {
            if (event.target.closest('a')) setMenuAbierto(false);
          }}
        >
          <ElementoNavegacion compacto={menuCompacto} to="/admin" icono={<LayoutDashboard size={18} />} etiqueta="Inicio" exact />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/usuarios" icono={<Users size={18} />} etiqueta="Usuarios" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/rutinas" icono={<Dumbbell size={18} />} etiqueta="Rutinas" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/finanzas" icono={<DollarSign size={18} />} etiqueta="Finanzas" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/inventario" icono={<Box size={18} />} etiqueta="Inventario" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/ventas" icono={<ShoppingCart size={18} />} etiqueta="Ventas" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/reportes" icono={<BarChart3 size={18} />} etiqueta="Reportes" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/sucursales" icono={<Building2 size={18} />} etiqueta="Sucursales" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/membresias" icono={<CreditCard size={18} />} etiqueta="Membresías" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/mensajes" icono={<Bell size={18} />} etiqueta="Mensajes" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/perfil" icono={<UserCircle size={18} />} etiqueta="Mi perfil" />
          <ElementoNavegacion compacto={menuCompacto} to="/admin/configuracion" icono={<Settings size={18} />} etiqueta="Configuración" />

          <div className={`mb-2 mt-8 px-3 ${menuCompacto ? 'lg:hidden' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Accesos rápidos</p>
          </div>
          <AccesoRapido compacto={menuCompacto} to="/admin/registrar-socio" icono={<UserPlus size={18} />} etiqueta="Registrar socio" />
          <AccesoRapido compacto={menuCompacto} to="/admin/ventas" icono={<ShoppingCart size={18} />} etiqueta="Nueva venta" />
          <AccesoRapido compacto={menuCompacto} to="/admin/membresias" icono={<Key size={18} />} etiqueta="Crear membresía" />
          <AccesoRapido compacto={menuCompacto} to="/admin/mensajes" icono={<Bell size={18} />} etiqueta="Mensaje global" />
          <AccesoRapido compacto={menuCompacto} to="/admin/configuracion" icono={<Sliders size={18} />} etiqueta="Ajustes del sistema" />
          <div className="mt-4 border-t border-white/5 pt-4">
            <BotonCerrarSesion compacto={menuCompacto} onClick={cerrarSesion} />
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
              aria-expanded={menuAbierto}
              aria-controls="menu-admin"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition duration-300 hover:-translate-y-0.5 hover:scale-105"
              title={cuentaActual.name || cuentaActual.username || 'Perfil administrador'}
              aria-label="Editar perfil de administrador"
            >
              <Avatar
                fotoUrl={cuentaActual.fotoUrl}
                nombre={cuentaActual.name || cuentaActual.username}
                email={cuentaActual.email}
                tamano={36}
                respaldo="AD"
              />
            </Link>
          </div>
        </header>

        <main id="contenido-admin" tabIndex={-1} className="admin-main min-w-0 flex-1 overflow-y-auto bg-[#050505]">
          <div key={ubicacionActual.pathname} className="page-transition-shell sp-workspace-content">
            <Outlet />
          </div>
        </main>
      </div>
      <ControlSesion />
      </div>
    </SucursalProvider>
  );
};

const ElementoNavegacion = ({ icono, etiqueta, to, exact, compacto }) => (
  <NavLink
    to={to}
    end={exact}
    aria-label={etiqueta}
    title={compacto ? etiqueta : undefined}
    className={({ isActive }) => `flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors duration-150 ${compacto ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    {icono} <span className={compacto ? 'lg:sr-only' : ''}>{etiqueta}</span>
  </NavLink>
);

const AccesoRapido = ({ icono, etiqueta, to, compacto }) => (
  <NavLink
    to={to}
    aria-label={etiqueta}
    title={compacto ? etiqueta : undefined}
    className={`group flex w-full items-center gap-3 rounded-lg p-2.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-white/[0.03] hover:text-white sm:p-3 ${compacto ? 'lg:justify-center lg:px-0' : ''}`}
  >
    <span className="rounded-lg p-1.5 transition-colors group-hover:bg-white/5">{icono}</span>
    <span className={compacto ? 'lg:sr-only' : ''}>{etiqueta}</span>
  </NavLink>
);

const BotonCerrarSesion = ({ onClick, compacto }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Cerrar sesión"
    title={compacto ? 'Cerrar sesión' : undefined}
    className={`group flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-bold text-red-500 transition-colors duration-150 hover:bg-red-500/10 sm:p-3 ${compacto ? 'lg:justify-center lg:px-0' : ''}`}
  >
    <span className="rounded-lg p-1.5 transition-colors group-hover:bg-red-500/10">
      <LogOut size={18} />
    </span>
    <span className={compacto ? 'lg:sr-only' : ''}>Cerrar sesión</span>
  </button>
);

export default AdminLayout;
