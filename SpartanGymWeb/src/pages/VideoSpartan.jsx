import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export default function VideoSpartan({ src, poster, className, automatico = false }) {
  const video = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reducido, setReducido] = useState(true);
  const [preferencia, setPreferencia] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [error, setError] = useState(false);
  const habilitado = preferencia ?? (automatico && !reducido);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sincronizar = () => setReducido(media.matches);
    sincronizar();
    media.addEventListener('change', sincronizar);
    const observador = new IntersectionObserver(([entrada]) => {
      setVisible(entrada.isIntersecting);
    }, { threshold: 0.65 });
    observador.observe(video.current);
    return () => {
      media.removeEventListener('change', sincronizar);
      observador.disconnect();
    };
  }, []);

  useEffect(() => {
    const elemento = video.current;
    if (visible && habilitado && !error) {
      elemento.play().catch(() => {});
    } else {
      elemento.pause();
    }
  }, [visible, habilitado, error]);

  function alternar() {
    const elemento = video.current;
    if (!elemento.paused) {
      setPreferencia(false);
      elemento.pause();
    } else {
      setPreferencia(true);
      elemento.play().catch(() => setPreferencia(false));
    }
  }

  return (
    <>
      <video ref={video} className={className} src={src} poster={poster}
        muted loop playsInline preload="none" aria-hidden="true"
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onError={() => { setError(true); setReproduciendo(false); }} />
      {!error && (
        <button type="button" className="sp-film-toggle" onClick={alternar}
          aria-label={reproduciendo ? 'Pausar video' : 'Reproducir video'}>
          {reproduciendo ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
        </button>
      )}
    </>
  );
}
