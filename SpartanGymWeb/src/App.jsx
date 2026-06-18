import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Registro = lazy(() => import('./pages/Registro.jsx'));
const DetalleBeneficio = lazy(() => import('./pages/DetalleBeneficio.jsx'));

const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout.jsx'));
const InicioAdmin = lazy(() => import('./pages/Admin/sub_pages/Inicio.jsx'));
const Usuarios = lazy(() => import('./pages/Admin/sub_pages/Usuarios.jsx'));
const Finanzas = lazy(() => import('./pages/Admin/sub_pages/Finanzas.jsx'));
const Inventario = lazy(() => import('./pages/Admin/sub_pages/Inventario.jsx'));
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
const MembresiasRecepcion = lazy(() => import('./pages/Recepcionista/sub_pages/Membresia.jsx'));
const Asistencias = lazy(() => import('./pages/Recepcionista/sub_pages/Asistencias.jsx'));
const Notificaciones = lazy(() => import('./pages/Recepcionista/sub_pages/Notificaciones.jsx'));
const Perfil = lazy(() => import('./pages/Recepcionista/sub_pages/Perfil.jsx'));

const PantallaCarga = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-red-500">
    Cargando Spartan Gym
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-theme min-h-screen bg-[#050505] font-sans text-white transition-colors duration-300">
        <Suspense fallback={<PantallaCarga />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/beneficios/:slug" element={<DetalleBeneficio />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<InicioAdmin />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="finanzas" element={<Finanzas />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="sucursales" element={<Sucursales />} />
              <Route path="membresias" element={<MembresiasAdmin />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="registrar-socio" element={<SocioAdm />} />
              <Route path="mensajes" element={<MensajesGlobales />} />
              <Route path="perfil" element={<PerfilAdmin />} />
            </Route>

            <Route path="/recepcion" element={<RecepcionistaLayout />}>
              <Route index element={<InicioRecepcion />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="registrar-socio" element={<RegistrarSocio />} />
              <Route path="pagos" element={<Pagos />} />
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
