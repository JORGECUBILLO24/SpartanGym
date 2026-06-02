import { useState } from 'react';
import Login from './pages/Login';
import PantallaAdministrador from './pages/Pantallaadministrador';
import PantallaRecepcionista from './pages/Pantallarecepcionista';

function App() {
  const [activeScreen, setActiveScreen] = useState('login');

  const handleLoginSuccess = (role) => {
    setActiveScreen(role === 'administrador' ? 'admin' : 'recepcionista');
  };

  if (activeScreen === 'admin') {
    return <PantallaAdministrador />;
  }

  if (activeScreen === 'recepcionista') {
    return <PantallaRecepcionista />;
  }

  return (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;