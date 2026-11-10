import { useEffect, useEffectEvent, useRef, useState } from 'react';

let cargaGoogle;

function cargarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!cargaGoogle) {
    cargaGoogle = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        if (window.google?.accounts?.id) resolve(window.google.accounts.id);
        else reject(new Error('Google Identity Services no está disponible.'));
      };
      script.onerror = () => {
        cargaGoogle = undefined;
        script.remove();
        reject(new Error('No se pudo cargar Google Identity Services.'));
      };
      document.head.append(script);
    });
  }
  return cargaGoogle;
}

export default function AccesoGoogle({ cliente, recibirCredencial, ocupado }) {
  const contenedor = useRef(null);
  const [estado, setEstado] = useState('cargando');
  const recibir = useEffectEvent((respuesta) => {
    if (!ocupado && respuesta.credential) recibirCredencial(respuesta.credential);
  });

  useEffect(() => {
    const destino = contenedor.current;
    let vigente = true;
    cargarGoogle().then((google) => {
      if (!vigente) return;
      google.initialize({
        client_id: cliente,
        callback: (respuesta) => { if (vigente) recibir(respuesta); },
      });
      google.renderButton(destino, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'es',
      });
      setEstado('listo');
    }).catch(() => { if (vigente) setEstado('error'); });
    return () => {
      vigente = false;
      destino.replaceChildren();
    };
  }, [cliente]);

  return (
    <div className="mt-4 flex flex-col items-center gap-2" aria-busy={ocupado || estado === 'cargando'}>
      <div ref={contenedor} inert={ocupado} />
      {estado === 'cargando' && <p className="text-sm text-gray-400" role="status">Cargando acceso con Google…</p>}
      {estado === 'error' && <p className="text-sm text-gray-400" role="status">Google no está disponible en este momento.</p>}
    </div>
  );
}
