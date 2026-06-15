import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogIn } from 'lucide-react';
import { cerrarSesionActual } from '../utils/cuentaActual';

const TIEMPO_INACTIVIDAD_MS = 60 * 60 * 1000;
const eventosActividad = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

const ControlSesion = () => {
  const navigate = useNavigate();
  const temporizadorRef = useRef(null);
  const [motivoCierre, setMotivoCierre] = useState('');

  const cerrarPorInactividad = useCallback(() => {
    cerrarSesionActual('inactividad');
    setMotivoCierre('Tu sesion se cerro porque no hubo actividad durante 1 hora.');
  }, []);

  const reiniciarTemporizador = useCallback(() => {
    if (motivoCierre) return;
    if (temporizadorRef.current) window.clearTimeout(temporizadorRef.current);
    temporizadorRef.current = window.setTimeout(cerrarPorInactividad, TIEMPO_INACTIVIDAD_MS);
  }, [cerrarPorInactividad, motivoCierre]);

  useEffect(() => {
    reiniciarTemporizador();

    eventosActividad.forEach((evento) => {
      window.addEventListener(evento, reiniciarTemporizador, { passive: true });
    });

    return () => {
      if (temporizadorRef.current) window.clearTimeout(temporizadorRef.current);
      eventosActividad.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador));
    };
  }, [reiniciarTemporizador]);

  const irALogin = () => {
    navigate('/login', { replace: true });
  };

  if (!motivoCierre) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="modal-sesion w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0e] p-6 text-center shadow-2xl shadow-black/70">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
          <AlertTriangle size={26} />
        </div>
        <h2 className="mt-5 text-xl font-black text-white">Sesion cerrada</h2>
        <p className="mt-3 text-sm leading-6 text-gray-400">{motivoCierre}</p>
        <button
          type="button"
          onClick={irALogin}
          className="boton-primario mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 hover:bg-red-700"
        >
          <LogIn size={18} />
          Logearse
        </button>
      </div>
    </div>
  );
};

export default ControlSesion;
