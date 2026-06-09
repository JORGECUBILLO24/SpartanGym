import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importaciones Globales
import Home from './pages/Home';
import Login from './pages/Login'; 
import Registro from './pages/Registro';
import DetalleBeneficio from './pages/DetalleBeneficio';

// Importaciones del Administrador
import AdminLayout from './pages/Admin/AdminLayout';
import AdminInicio from './pages/Admin/sub_pages/Inicio'; 
import Usuarios from './pages/Admin/sub_pages/Usuarios'; 
import Finanzas from './pages/Admin/sub_pages/Finanzas'; 
import Reportes from './pages/Admin/sub_pages/Reportes'; 
import Inventario from './pages/Admin/sub_pages/Inventario'; 
import Configuracion from './pages/Admin/sub_pages/Configuracion'; 
import Sucursales from './pages/Admin/sub_pages/Sucursales';
import Membresias from './pages/Admin/sub_pages/Membresias'; 
import SocioAdmin from './pages/Admin/sub_pages/Socioadm'; // Asegúrate de que el archivo se llame Socioadm.jsx

// Importaciones del Recepcionista
import RecepcionistaLayout from './pages/Recepcionista/RecepcionistaLayout';
import Inicio from './pages/Recepcionista/sub_pages/Inicio'; 
import CheckIn from './pages/Recepcionista/sub_pages/CheckIn'; 
import RegistrarSocioRecep from './pages/Recepcionista/sub_pages/RegistrarSocio'; 
import Pagos from './pages/Recepcionista/sub_pages/Pagos';
import Perfil from './pages/Recepcionista/sub_pages/Perfil'; 
import MembresiaRecep from './pages/Recepcionista/sub_pages/Membresia'; 
import Asistencias from './pages/Recepcionista/sub_pages/Asistencias'; 
import Notificaciones from './pages/Recepcionista/sub_pages/Notificaciones'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: Inicio */}
        <Route path="/" element={<Home />} />
        <Route path="/beneficios/:slug" element={<DetalleBeneficio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        {/* Rutas del Administrador */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminInicio />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="sucursales" element={<Sucursales />} />
          <Route path="membresias" element={<Membresias />} />
          <Route path="registrar-socio" element={<SocioAdmin />} />
        </Route>
        
        {/* Rutas del Recepcionista */}
        <Route path="/recepcion" element={<RecepcionistaLayout />}>
          <Route index element={<Inicio />} /> 
          <Route path="check-in" element={<CheckIn />} />
          <Route path="registrar-socio" element={<RegistrarSocioRecep />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="membresias" element={<MembresiaRecep />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="asistencias" element={<Asistencias />} />
          <Route path="notificaciones" element={<Notificaciones />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
