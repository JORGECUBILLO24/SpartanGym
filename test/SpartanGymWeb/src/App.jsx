import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import DetalleBeneficio from './pages/DetalleBeneficio.jsx';
import Recepcionista from './pages/Recepcionista/RecepcionistaLayout.jsx';
import Admin from './pages/Admin/AdminLayout.jsx';

import AdminInicio from './pages/Admin/sub_pages/Inicio.jsx';
import Usuarios from './pages/Admin/sub_pages/Usuarios.jsx';
import Finanzas from './pages/Admin/sub_pages/Finanzas.jsx';
import Inventario from './pages/Admin/sub_pages/Inventario.jsx';
import Reportes from './pages/Admin/sub_pages/Reportes.jsx';
import Sucursales from './pages/Admin/sub_pages/Sucursales.jsx';
import AdminMembresias from './pages/Admin/sub_pages/Membresias.jsx';
import Configuracion from './pages/Admin/sub_pages/Configuracion.jsx';
import RegistrarSocioAdmin from './pages/Admin/sub_pages/Socioadm.jsx';

import RecepcionInicio from './pages/Recepcionista/sub_pages/Inicio.jsx';
import CheckIn from './pages/Recepcionista/sub_pages/CheckIn.jsx';
import RegistrarSocio from './pages/Recepcionista/sub_pages/RegistrarSocio.jsx';
import Pagos from './pages/Recepcionista/sub_pages/Pagos.jsx';
import RecepcionMembresias from './pages/Recepcionista/sub_pages/Membresia.jsx';
import Asistencias from './pages/Recepcionista/sub_pages/Asistencias.jsx';
import Notificaciones from './pages/Recepcionista/sub_pages/Notificaciones.jsx';
import Perfil from './pages/Recepcionista/sub_pages/Perfil.jsx';

import { authStorage } from './services/api';

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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/beneficios/:slug" element={<DetalleBeneficio />} />

          <Route
            path="/admin"
            element={(
              <ProtectedRoute allowedRoles={["ROLE_SUPERADMIN", "ROLE_ADMIN"]}>
                <Admin />
              </ProtectedRoute>
            )}
          >
            <Route index element={<AdminInicio />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="finanzas" element={<Finanzas />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="sucursales" element={<Sucursales />} />
            <Route path="membresias" element={<AdminMembresias />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="registrar-socio" element={<RegistrarSocioAdmin />} />
          </Route>

          <Route
            path="/recepcion"
            element={(
              <ProtectedRoute allowedRoles={["ROLE_SUPERADMIN", "ROLE_ADMIN", "ROLE_RECEPCIONISTA"]}>
                <Recepcionista />
              </ProtectedRoute>
            )}
          >
            <Route index element={<RecepcionInicio />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="registrar-socio" element={<RegistrarSocio />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="membresias" element={<RecepcionMembresias />} />
            <Route path="asistencias" element={<Asistencias />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
