import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import { authStorage } from './services/api';
import { obtenerNombreGimnasio, sincronizarConfiguracionRemota, useConfiguracionApp } from './utils/configuracionApp';

const Login = lazy(() => import('./pages/Login.jsx'));
const Registro = lazy(() => import('./pages/Registro.jsx'));
const RestablecerContrasena = lazy(() => import('./pages/RestablecerContrasena.jsx'));
const DetalleBeneficio = lazy(() => import('./pages/DetalleBeneficio.jsx'));

const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout.jsx'));
const InicioAdmin = lazy(() => import('./pages/Admin/sub_pages/Inicio.jsx'));
const Usuarios = lazy(() => import('./pages/Admin/sub_pages/Usuarios.jsx'));
const Rutinas = lazy(() => import('./pages/Admin/sub_pages/Rutinas.jsx'));
const Finanzas = lazy(() => import('./pages/Admin/sub_pages/Finanzas.jsx'));
const Inventario = lazy(() => import('./pages/Admin/sub_pages/Inventario.jsx'));
const VentaProductosAdmin = lazy(() => import('./pages/Admin/sub_pages/VentaProductos.jsx'));
const Reportes = lazy(() => import('./pages/Admin/sub_pages/Reportes.jsx'));
const Sucursales = lazy(() => import('./pages/Admin/sub_pages/Sucursales.jsx'));
const MembresiasAdmin = lazy(() => import('./pages/Admin/sub_pages/Membresias.jsx'));
const Configuracion = lazy(() => import('./pages/Admin/sub_pages/Configuracion.jsx'));
const SocioAdm = lazy(() => import('./pages/Admin/sub_pages/Socioadm.jsx'));
const MensajesGlobales = lazy(() => import('./pages/Admin/sub_pages/MensajesGlobales.jsx'));
const PerfilAdmin = lazy(() => import('./pages/Admin/sub_pages/PerfilAdmin.jsx'));

const RecepcionistaLayout = lazy(() => import('./pages/Recepcionista/RecepcionistaLayout.jsx'));
const InicioRecepcion = lazy(() => import('./pages/Recepcionista/sub_pages/Inicio.jsx'));
const CheckIn = lazy(() => import('./pages/Recepcionista/sub_pages/CheckIn.jsx'));
const RegistrarSocio = lazy(() => import('./pages/Recepcionista/sub_pages/RegistrarSocio.jsx'));
const Pagos = lazy(() => import('./pages/Recepcionista/sub_pages/Pagos.jsx'));
const VentaProductosRecepcion = lazy(() => import('./pages/Recepcionista/sub_pages/VentaProductos.jsx'));
const MembresiasRecepcion = lazy(() => import('./pages/Recepcionista/sub_pages/Membresia.jsx'));
const Asistencias = lazy(() => import('./pages/Recepcionista/sub_pages/Asistencias.jsx'));
const Notificaciones = lazy(() => import('./pages/Recepcionista/sub_pages/Notificaciones.jsx'));
const Perfil = lazy(() => import('./pages/Recepcionista/sub_pages/Perfil.jsx'));

const PantallaCarga = () => {
  const configuracion = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracion);

  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050505] px-4 text-center text-gray-300">
      <span aria-hidden="true" className="loading-indicator" />
      <p className="text-sm font-medium">Cargando {nombreGimnasio}…</p>
    </div>
  );
};

const roleMatches = (actualRole, allowedRoles) => {
  if (!allowedRoles?.length) return true;
  return allowedRoles.includes(actualRole);
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = authStorage.getToken();
  const user = authStorage.getUser();
  const role = user?.rol?.toUpperCase();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roleMatches(role, allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function RestablecerScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const configuracion = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracion);

  useEffect(() => {
    void sincronizarConfiguracionRemota();
  }, []);

  useEffect(() => {
    document.title = nombreGimnasio;
  }, [nombreGimnasio]);

  return (
    <Router>
      <RestablecerScroll />
      <div className="app-theme min-h-screen bg-[#050505] font-sans text-white transition-colors duration-300">
        <Suspense fallback={<PantallaCarga />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
            <Route path="/beneficios/:slug" element={<DetalleBeneficio />} />

            <Route
              path="/admin"
              element={(
                <ProtectedRoute allowedRoles={['ROLE_SUPERADMIN', 'ROLE_ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              )}
            >
              <Route index element={<InicioAdmin />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="rutinas" element={<Rutinas />} />
              <Route path="finanzas" element={<Finanzas />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="ventas" element={<VentaProductosAdmin />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="sucursales" element={<Sucursales />} />
              <Route path="membresias" element={<MembresiasAdmin />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="registrar-socio" element={<SocioAdm />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="mensajes" element={<MensajesGlobales />} />
              <Route path="perfil" element={<PerfilAdmin />} />
            </Route>

            <Route
              path="/recepcion"
              element={(
                <ProtectedRoute allowedRoles={['ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_RECEPCIONISTA']}>
                  <RecepcionistaLayout />
                </ProtectedRoute>
              )}
            >
              <Route index element={<InicioRecepcion />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="registrar-socio" element={<RegistrarSocio />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="ventas" element={<VentaProductosRecepcion />} />
              <Route path="membresias" element={<MembresiasRecepcion />} />
              <Route path="asistencias" element={<Asistencias />} />
              <Route path="notificaciones" element={<Notificaciones />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
