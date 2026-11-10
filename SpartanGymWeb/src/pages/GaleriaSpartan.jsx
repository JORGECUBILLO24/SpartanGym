import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import VideoSpartan from './VideoSpartan';
import { usePrefersReducedMotion } from '../utils/useParallax';
import './GaleriaSpartan.css';

const numero = new Intl.NumberFormat('es');
const tituloEscena = (escena) => escena?.titulo?.trim() || 'Escena de entrenamiento';

export default function GaleriaSpartan({ escenas = [] }) {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const navegar = useNavigate();
  const modo = import.meta.env.DEV ? params.get('galeria') : null;

  let muestra = escenas;
  if (import.meta.env.DEV) {
    if (modo === 'una') muestra = escenas.slice(0, 1);
    if (modo === 'vacia') muestra = [];
    if (modo === 'muchas') {
      muestra = Array.from({ length: 1000 }, (_, i) => ({
        ...escenas[i % escenas.length],
        titulo: `Entrenamiento ${numero.format(i + 1)}`,
      }));
    }
    if (modo === 'extrema') {
      muestra = escenas.map((escena, indice) => {
        if (indice === 0) {
          return {
            ...escena,
            titulo: 'Entrenamiento de fuerza y acondicionamiento físico con barra olímpica: técnica, control y progresión',
          };
        }
        if (indice === 1) {
          return {
            ...escena,
            src: null,
            video: null,
            titulo: 'Movilidad y recuperación — Đặng Thị Ngọc Hân',
          };
        }
        return { ...escena, titulo: '', alt: '' };
      });
    }
  }

  return (
    <div className="sp-gallery-container">
      <VisorGaleria key={modo ?? 'normal'} escenas={muestra} />
      {import.meta.env.DEV && modo !== null && (
        <div className="sp-gallery-debug" role="group" aria-label="Datos de prueba de la galería">
          {[
            ['normal', 'Demo data'],
            ['extrema', 'Worst case'],
            ['vacia', 'Empty'],
            ['una', 'One'],
            ['muchas', '1,000'],
          ].map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={modo === valor}
              onClick={() => {
                const siguiente = new URLSearchParams(params);
                siguiente.set('galeria', valor);
                navegar({ search: siguiente.toString(), hash }, { replace: true, preventScrollReset: true });
              }}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImagenEscena({ src, alt, parallaxOffset = 0 }) {
  const [fallo, setFallo] = useState(false);
  if (!src || fallo) return <p className="sp-gallery-unavailable">Imagen no disponible.</p>;

  return (
    <div className="sp-gallery-media-wrap">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="sp-gallery-img"
        style={parallaxOffset !== 0 ? { transform: `translate3d(${parallaxOffset}px, 0, 0) scale(1.08)` } : undefined}
        onError={() => setFallo(true)}
      />
    </div>
  );
}

function VisorGaleria({ escenas }) {
  const visor = useRef(null);
  const cardFrameRef = useRef(null);
  const [actual, setActual] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });
  const reducedMotion = usePrefersReducedMotion();

  const seleccion = Math.min(actual, Math.max(0, escenas.length - 1));

  // Observador de intersección para sincronizar índice activo
  useEffect(() => {
    const contenedor = visor.current;
    if (!contenedor) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setActual(Number(entrada.target.dataset.escena));
          }
        }
      },
      { root: contenedor, threshold: 0.65 }
    );

    for (const escena of contenedor.children) observador.observe(escena);
    return () => observador.disconnect();
  }, [escenas.length]);

  // Manejo de desplazamiento para efecto paralaje interior de las imágenes
  const manejarScroll = useCallback(() => {
    if (reducedMotion || !visor.current) return;
    const { scrollLeft, clientWidth } = visor.current;
    if (clientWidth > 0) {
      setScrollProgress(scrollLeft / clientWidth);
    }
  }, [reducedMotion]);

  // Interacción 3D Tilt estilo iOS / Apple TV al pasar el cursor sobre la tarjeta
  const manejarMouseMove = useCallback(
    (e) => {
      if (reducedMotion || !cardFrameRef.current) return;
      const rect = cardFrameRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Inclinación máxima sutil de ±4 grados
      setCardTilt({
        x: Math.round((y - 0.5) * -7 * 100) / 100,
        y: Math.round((x - 0.5) * 7 * 100) / 100,
        glowX: Math.round(x * 100),
        glowY: Math.round(y * 100),
      });
    },
    [reducedMotion]
  );

  const reiniciarTilt = useCallback(() => {
    setCardTilt({ x: 0, y: 0, glowX: 50, glowY: 50 });
  }, []);

  function irA(indice, instantaneo = false) {
    const contenedor = visor.current;
    const destino = contenedor?.children[indice];
    if (!destino) return;
    contenedor.scrollTo({
      left: destino.offsetLeft,
      behavior: reducedMotion || instantaneo ? 'instant' : 'smooth',
    });
  }

  if (escenas.length === 0) {
    return (
      <div className="sp-gallery-viewer">
        <div className="sp-gallery-empty" role="status">
          Aún no hay escenas disponibles.
        </div>
      </div>
    );
  }

  return (
    <div className="sp-gallery-viewer">
      {/* Selector Segmentado estilo iOS (Apple Segmented Control) */}
      {escenas.length > 1 && escenas.length <= 6 && (
        <nav className="sp-ios-segmented" role="tablist" aria-label="Escenas de la galería">
          <div
            className="sp-ios-segmented-pill"
            style={{
              width: `${100 / escenas.length}%`,
              transform: `translate3d(${seleccion * 100}%, 0, 0)`,
            }}
            aria-hidden="true"
          />
          {escenas.map((escena, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === seleccion}
              aria-controls="sp-reel"
              className={`sp-ios-segment ${idx === seleccion ? 'is-active' : ''}`}
              onClick={() => irA(idx)}
            >
              <span className="sp-ios-segment-num">{String(idx + 1).padStart(2, '0')}</span>
              <span className="sp-ios-segment-label">
                {escena.titulo ? escena.titulo.split('—')[0].trim() : `Escena ${idx + 1}`}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Tarjeta Principal con marco de vidrio esmerilado y efecto de inclinación 3D */}
      <div
        ref={cardFrameRef}
        className="sp-gallery-card-frame"
        onMouseMove={manejarMouseMove}
        onMouseLeave={reiniciarTilt}
        style={
          !reducedMotion && (cardTilt.x !== 0 || cardTilt.y !== 0)
            ? {
                transform: `perspective(1200px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
              }
            : undefined
        }
      >
        {/* Reflejo dinámico especular que sigue el cursor */}
        <div
          className="sp-gallery-sheen"
          style={{
            background: `radial-gradient(circle at ${cardTilt.glowX}% ${cardTilt.glowY}%, rgba(255, 255, 255, 0.14) 0%, transparent 60%)`,
          }}
          aria-hidden="true"
        />

        {/* Floating iOS Dynamic Pill Badge */}
        <div className="sp-ios-floating-pill" aria-hidden="true">
          <span className="sp-ios-live-indicator" />
          <span className="sp-ios-pill-text">
            {numero.format(seleccion + 1)} / {numero.format(escenas.length)} • SPARTAN
          </span>
        </div>

        {/* Riel horizontal con efecto Paralaje interior */}
        <div
          ref={visor}
          id="sp-reel"
          className="sp-gallery-track"
          tabIndex={0}
          role="region"
          aria-label="Galería de entrenamiento"
          aria-roledescription="carrusel"
          onScroll={manejarScroll}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const destinos = {
              ArrowLeft: seleccion - 1,
              ArrowRight: seleccion + 1,
              Home: 0,
              End: escenas.length - 1,
            };
            if (!(event.key in destinos)) return;
            event.preventDefault();
            irA(Math.min(escenas.length - 1, Math.max(0, destinos[event.key])), true);
          }}
        >
          {escenas.map((escena, indice) => {
            // Cálculo del desfase de paralaje para la imagen de esta escena
            const offsetDiff = (scrollProgress - indice) * 45;

            return (
              <figure
                className="sp-gallery-slide"
                key={indice}
                data-escena={indice}
                role="group"
                aria-roledescription="escena"
                aria-label={`${numero.format(indice + 1)} de ${numero.format(escenas.length)}: ${tituloEscena(escena)}`}
                inert={indice !== seleccion}
              >
                {Math.abs(indice - seleccion) <= 1 && (
                  <ImagenEscena
                    key={escena.src ?? 'missing'}
                    src={escena.src}
                    alt={escena.alt || tituloEscena(escena)}
                    parallaxOffset={offsetDiff}
                  />
                )}
                {escena.video && indice === seleccion && (
                  <VideoSpartan className="sp-gallery-video" src={escena.video} poster={escena.src} />
                )}
              </figure>
            );
          })}
        </div>

        {/* Overlay iOS con gradiente sutil y HUD de control inferior */}
        <div className="sp-gallery-glass-hud">
          <div className="sp-gallery-caption-content">
            <div className="sp-gallery-badge-row">
              <span className="sp-gallery-kicker">
                <Sparkles size={13} aria-hidden="true" />
                ÁREA SELECCIONADA
              </span>
            </div>
            <p className="sp-gallery-title" aria-live="polite" aria-atomic="true" dir="auto">
              {tituloEscena(escenas[seleccion])}
            </p>
          </div>

          <div className="sp-gallery-actions">
            <span
              className="sp-gallery-count"
              aria-label={`Escena ${numero.format(seleccion + 1)} de ${numero.format(escenas.length)}`}
            >
              {numero.format(seleccion + 1)} <span aria-hidden="true">/</span> {numero.format(escenas.length)}
            </span>
            {escenas.length > 1 && (
              <div className="sp-ios-btn-group">
                <button
                  type="button"
                  className="sp-ios-circle-btn"
                  aria-label="Escena anterior"
                  aria-controls="sp-reel"
                  disabled={seleccion === 0}
                  onClick={(event) => irA(seleccion - 1, event.detail === 0)}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="sp-ios-circle-btn"
                  aria-label="Escena siguiente"
                  aria-controls="sp-reel"
                  disabled={seleccion === escenas.length - 1}
                  onClick={(event) => irA(seleccion + 1, event.detail === 0)}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
