import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de las pantallas (Asegúrate de que las rutas coincidan con tus carpetas)
import Login from './pages/Login';
import Recepcionista from './pages/Recepcionista';

// Componente placeholder para el Admin (hasta que lo creemos o si ya lo tienes)
const Admin = () => (
  <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
    <h1 className="text-3xl font-bold mb-4">Panel de Administrador</h1>
    <p className="text-gray-400">Próximamente...</p>
    <a href="/" className="mt-4 text-red-500 hover:text-red-400">Volver al Login</a>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans">
        <Routes>
          {/* Ruta por defecto: Pantalla de Login */}
          <Route path="/" element={<Login />} />
          
          {/* Rutas de los paneles */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/recepcion" element={<Recepcionista />} />
          
          {/* Si el usuario ingresa una ruta que no existe, lo regresamos al Login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;