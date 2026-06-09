import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 👇 Importamos el componente Home
import Home from "./pages/Home.jsx"; 
import Login from "./pages/Login.jsx";
import Recepcionista from "./pages/Recepcionista/RecepcionistaLayout.jsx";
import Admin from "./pages/Admin/AdminLayout.jsx";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans">
        <Routes>
          {/* 👇 Ruta por defecto: Ahora muestra la pantalla Home */}
          <Route path="/" element={<Home />} />
          
          {/* 👇 Le damos al Login su propia ruta */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas de los paneles */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/recepcion" element={<Recepcionista />} />
          
          {/* Redirección para rutas no existentes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;