import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de Layouts Principales
import Home from "./pages/Home.jsx"; 
import Login from "./pages/Login.jsx";
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import RecepcionistaLayout from "./pages/Recepcionista/RecepcionistaLayout.jsx";

// ✅ NUEVA IMPORTACIÓN: Tu pantalla de detalles del beneficio
// Nota: Ajusta "./pages/DetalleBeneficio.jsx" si guardaste el archivo en otra carpeta como "./components/..."
import DetalleBeneficio from "./pages/DetalleBeneficio.jsx"; 

// Importación de sub-páginas de Admin
import InicioAdmin from "./pages/Admin/sub_pages/Inicio.jsx";
import Usuarios from "./pages/Admin/sub_pages/Usuarios.jsx";
import Finanzas from "./pages/Admin/sub_pages/Finanzas.jsx";
import Inventario from "./pages/Admin/sub_pages/Inventario.jsx";
import Reportes from "./pages/Admin/sub_pages/Reportes.jsx";
import Sucursales from "./pages/Admin/sub_pages/Sucursales.jsx";
import MembresiasAdmin from "./pages/Admin/sub_pages/Membresias.jsx";
import Configuracion from "./pages/Admin/sub_pages/Configuracion.jsx";
import SocioAdm from "./pages/Admin/sub_pages/Socioadm.jsx";

// Importación de sub-páginas de Recepcionista
import InicioRecepcion from "./pages/Recepcionista/sub_pages/Inicio.jsx";
import CheckIn from "./pages/Recepcionista/sub_pages/CheckIn.jsx";
import RegistrarSocio from "./pages/Recepcionista/sub_pages/RegistrarSocio.jsx";
import Pagos from "./pages/Recepcionista/sub_pages/Pagos.jsx";
import MembresiasRecepcion from "./pages/Recepcionista/sub_pages/Membresia.jsx";
import Asistencias from "./pages/Recepcionista/sub_pages/Asistencias.jsx";
import Notificaciones from "./pages/Recepcionista/sub_pages/Notificaciones.jsx";
import Perfil from "./pages/Recepcionista/sub_pages/Perfil.jsx";


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* ✅ NUEVA RUTA DINÁMICA: Atrapa cualquier clic a /beneficios/... */}
          <Route path="/beneficios/:slug" element={<DetalleBeneficio />} />
          
          {/* Rutas de Administrador */}
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
          </Route>
          
          {/* Rutas de Recepcionista */}
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
          
          {/* Redirección para rutas no existentes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;