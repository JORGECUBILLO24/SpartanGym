import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  Dumbbell,
  Flame,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import atleta from '../assets/gym-training-poster.webp';
import videoTecnica from '../assets/gym-training-loop.mp4';
import escenaAestheticEspacio from '../assets/gym-aesthetic-workout.webp';
import escenaAestheticPhysique from '../assets/gym-youngla-physique.webp';
import escenaAestheticFuerza from '../assets/gym-aesthetic-coach.webp';
import VideoSpartan from './VideoSpartan';
import BarraEnsamblada from './BarraEnsamblada';
import GaleriaSpartan from './GaleriaSpartan';
import { beneficiosInicio } from '../data/homeBenefits';
import { useLogosApp } from '../utils/logosApp';
import { obtenerNombreGimnasio, useConfiguracionApp } from '../utils/configuracionApp';
import { useMouseParallax, usePrefersReducedMotion } from '../utils/useParallax';
import './Home.css';

const secciones = [
  ['instalaciones', 'El espacio'],
  ['beneficios', 'La experiencia'],
  ['fuerza', 'Ingeniería'],
  ['membresias', 'Membresía'],
];

const escenas = [
  {
    src: escenaAestheticEspacio,
    alt: 'Instalaciones de alto rendimiento con mancuernas y atmósfera oscura premium',
    titulo: 'Espacio para superarte',
  },
  {
    src: escenaAestheticPhysique,
    alt: 'Atleta con físico estético entrenando con máxima intensidad y disciplina',
    titulo: 'Cada repetición cuenta',
  },
  {
    src: escenaAestheticFuerza,
    alt: 'Entrenamiento de fuerza y bombeo muscular con estética Gymshark / YoungLA',
    titulo: 'Fuerza en movimiento',
  },
];

function Marca({ src, footer = false, nombreGimnasio, mostrarLogo }) {
  const [logoFallido, setLogoFallido] = useState('');
  const mostrarImagen = mostrarLogo && src && logoFallido !== src;

  return (
    <a
      href="#inicio"
      className="sp-brand"
      aria-label={footer ? 'Volver al inicio' : `${nombreGimnasio}, inicio`}
    >
      {mostrarImagen ? (
        <img
          src={src}
          alt={nombreGimnasio}
          width="144"
          height="72"
          loading={footer ? 'lazy' : 'eager'}
          onError={() => setLogoFallido(src)}
        />
      ) : <span className="max-w-[18rem] text-xl font-black uppercase tracking-wide text-white">{nombreGimnasio}</span>}
    </a>
  );
}

export default function Home() {
  const logos = useLogosApp();
  const configuracion = useConfiguracionApp();
  const nombreGimnasio = obtenerNombreGimnasio(configuracion);
  const mostrarLogo = Boolean(logos.principal);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenu = useRef(null);
  const heroRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  // Paralaje 3D espacial con el cursor del ratón (Spatial Mouse Parallax)
  const mouse = useMouseParallax({ sensitivity: 18, maxTilt: 6 });

  return (
    <div className="spartan-editorial" id="inicio">
      {/* Film grain overlay — textura cinematográfica sutil */}
      <div className="sp-grain" aria-hidden="true" />

      <a className="sp-skip" href="#contenido-portada">
        Saltar al contenido
      </a>

      {/* Floating Dynamic Island / Apple Navigation Header */}
      <header
        className="sp-header-wrapper"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMenuAbierto(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuAbierto) {
            setMenuAbierto(false);
            botonMenu.current?.focus();
          }
        }}
      >
        <div className="sp-header-capsule">
          <Marca src={logos.principal} nombreGimnasio={nombreGimnasio} mostrarLogo={mostrarLogo} />

          <nav
            id="sp-navegacion"
            className="sp-nav"
            data-open={menuAbierto}
            aria-label="Navegación principal"
          >
            {secciones.map(([id, nombre]) => (
              <a
                key={id}
                href={'#' + id}
                className="sp-nav-link"
                onClick={() => setMenuAbierto(false)}
              >
                {nombre}
              </a>
            ))}
          </nav>

          <div className="sp-header-actions">
            <Link className="sp-access-btn" to="/login">
              <span>Iniciar sesión</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>

            <button
              ref={botonMenu}
              className="sp-menu"
              type="button"
              aria-controls="sp-navegacion"
              aria-expanded={menuAbierto}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main id="contenido-portada" tabIndex={-1}>
        {/* ==================================================================
            HERO: Experiencia Cinematográfica con Paralaje Multicapa
            ================================================================== */}
        <section ref={heroRef} className="sp-hero-section" aria-labelledby="sp-titulo">
          {/* Capa 0: Atmósfera de luz y partículas ambientales */}
          <div
            className="sp-hero-ambient"
            style={
              !reducedMotion
                ? {
                    transform: `translate3d(${mouse.x * -0.5}px, ${mouse.y * -0.5}px, 0)`,
                  }
                : undefined
            }
            aria-hidden="true"
          />

          {/* Capa 1: Fondo de video e imagen con profundidad */}
          <div className="sp-hero-media-layer">
            <img
              className="sp-hero-image"
              src={atleta}
                alt="Atleta entrenando con barra"
              fetchPriority="high"
              decoding="async"
              width="720"
              height="1280"
            />
            <VideoSpartan className="sp-hero-image" src={videoTecnica} poster={atleta} automatico />
            <div className="sp-hero-vignette" aria-hidden="true" />
          </div>

          {/* Capa 2: Contenido Hero (Titular, CTA, chips de estado) */}
          <div className="sp-wrap sp-hero-inner">
            <div className="sp-hero-copy sp-stagger-reveal">
              <div className="sp-ios-pill-kicker mb-4 inline-flex items-center gap-2">
                <span className="sp-ios-dot" />
                <span>{nombreGimnasio.toUpperCase()} • EDICIÓN PRO</span>
              </div>

              <h1 id="sp-titulo" className="sp-hero-heading">
                Hazte<br />
                más fuerte<span>.</span>
              </h1>

              <p className="sp-description">
                Entrena con intención y rigor. Espacio, tecnología y comunidad diseñados para elevar tu potencial físico a otro nivel.
              </p>

              <div className="sp-hero-cta-group">
                <Link className="sp-ios-btn-primary" to="/registro">
                  <span>Empieza a entrenar</span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>

                <a className="sp-ios-btn-secondary" href="#instalaciones">
                  <ArrowDown size={16} aria-hidden="true" />
                  <span>Descubre {nombreGimnasio}</span>
                </a>
              </div>
            </div>

            {/* Capa 3: Badges Flotantes 3D estilo iOS con Paralaje Espacial */}
            <div
              className="sp-hero-floating-elements"
              style={
                !reducedMotion
                  ? {
                      transform: `translate3d(${mouse.x * 1.2}px, ${mouse.y * 1.2}px, 0)`,
                    }
                  : undefined
              }
              aria-hidden="true"
            >
              <div
                className="sp-ios-floating-card sp-float-card-1"
                style={
                  !reducedMotion
                    ? {
                        transform: `translate3d(${mouse.x * 0.8}px, ${mouse.y * 0.8}px, 0) rotateX(${mouse.tiltX * 0.5}deg) rotateY(${mouse.tiltY * 0.5}deg)`,
                      }
                    : undefined
                }
              >
                <div className="sp-float-icon-box">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="sp-float-title">+100 Estaciones Pro</div>
                  <div className="sp-float-sub">Equipamiento Olímpico y Biomecánico</div>
                </div>
              </div>

              <div
                className="sp-ios-floating-card sp-float-card-2"
                style={
                  !reducedMotion
                    ? {
                        transform: `translate3d(${mouse.x * -0.7}px, ${mouse.y * -0.7}px, 0) rotateX(${mouse.tiltX * 0.4}deg) rotateY(${mouse.tiltY * 0.4}deg)`,
                      }
                    : undefined
                }
              >
                <div className="sp-float-icon-box">
                  <Flame size={18} />
                </div>
                <div>
                  <div className="sp-float-title">Técnica & Disciplina</div>
                  <div className="sp-float-sub">Acompañamiento en cada sesión</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            EL ESPACIO: Galería Interactiva iOS con Paralaje
            ================================================================== */}
        <section
          id="instalaciones"
          className="sp-wrap sp-experience-section"
          aria-labelledby="sp-experience-title"
        >
          <div id="quienes-somos" className="sp-section-heading sp-reveal">
            <div className="sp-ios-kicker-pill inline-flex items-center gap-1.5 mb-2">
              <Sparkles size={13} aria-hidden="true" />
              <span>EL ESPACIO</span>
            </div>
            <h2 id="sp-experience-title">
              Tu espacio.<br />
              Tu mejor versión<span>.</span>
            </h2>
            <p className="sp-description">
              Técnica, equipo de competición y una atmósfera que te impulsa a volver. Todo empieza con tu próximo levantamiento.
            </p>
          </div>

          {/* Galería Spartan con Controles Segmentados iOS y Paralaje */}
          <div id="galeria" className="sp-reveal">
            <GaleriaSpartan escenas={escenas} />
          </div>

          {/* ================================================================
              LA EXPERIENCIA: Bento Grid estilo Apple con Reflejos y Vidrio
              ================================================================ */}
          <div id="beneficios" className="sp-bento-section">
            <div className="sp-bento-header sp-reveal">
              <div className="sp-ios-kicker-pill inline-flex items-center gap-1.5 mb-2">
                <Dumbbell size={13} aria-hidden="true" />
                <span>LA EXPERIENCIA</span>
              </div>
              <h3 className="sp-bento-title">Diseñado para el alto rendimiento.</h3>
              <p className="sp-description">
                Descubre los pilares que hacen de {nombreGimnasio} un centro de entrenamiento integral.
              </p>
            </div>

            <div className="sp-bento-grid">
              {beneficiosInicio.map((beneficio, idx) => {
                const Icono = beneficio.icono;
                const esPrincipal = idx === 0;

                return (
                  <Link
                    key={beneficio.ruta}
                    to={'/beneficios/' + beneficio.ruta}
                    className={`sp-bento-card ${esPrincipal ? 'sp-bento-card-featured' : ''}`}
                    aria-label={`Conoce más sobre ${beneficio.titulo}`}
                  >
                    {/* Imagen de fondo en la tarjeta destacada */}
                    {esPrincipal && (
                      <div className="sp-bento-bg-media">
                        <img
                          src={beneficio.imagen}
                          alt={beneficio.imagenAlt || beneficio.titulo}
                          loading="lazy"
                          className="sp-bento-img"
                        />
                        <div className="sp-bento-overlay" />
                      </div>
                    )}

                    <div className="sp-bento-content">
                      <div className="sp-bento-top-row">
                        <div className="sp-bento-icon-capsule">
                          <Icono size={22} className="text-white" aria-hidden="true" />
                        </div>
                        <span className="sp-bento-badge">{beneficio.etiqueta}</span>
                      </div>

                      <div className="sp-bento-body">
                        <h4 className="sp-bento-card-title">{beneficio.titulo}</h4>
                        <p className="sp-bento-card-desc">{beneficio.resumen}</p>

                        {/* Bullets estilo iOS */}
                        {beneficio.puntos && (
                          <ul className="sp-bento-bullets" role="list">
                            {beneficio.puntos.slice(0, 2).map((punto, pIdx) => (
                              <li key={pIdx} className="sp-bento-bullet-item">
                                <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
                                <span>{punto}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="sp-bento-footer">
                        <span className="sp-bento-link-text">Explorar beneficio</span>
                        <div className="sp-bento-arrow-circle">
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================
            INGENIERÍA: Barra Ensamblada con Scroll-Driven Animation
            ================================================================== */}
        <BarraEnsamblada />

        {/* ==================================================================
            MEMBRESÍA: Tarjeta Premium estilo iOS Glass
            ================================================================== */}
        <section
          id="membresias"
          className="sp-wrap sp-membership-section"
          aria-labelledby="sp-membership-title"
        >
          <div className="sp-membership-glass-card sp-reveal">
            <div className="sp-membership-glow" aria-hidden="true" />
            <div className="sp-membership-content">
              <div className="sp-ios-kicker-pill inline-flex items-center gap-1.5 mb-3">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>MEMBRESÍAS {nombreGimnasio.toUpperCase()}</span>
              </div>
              <h2 id="sp-membership-title" className="sp-membership-heading">
                El siguiente paso<br />
                es tuyo<span>.</span>
              </h2>
              <p className="sp-description">
                Únete a la comunidad de {nombreGimnasio}. Acceso completo a máquinas de fuerza, zonas de peso libre, entrenadores certificados y seguimiento continuo.
              </p>

              <div className="sp-membership-perks">
                <div className="sp-perk-pill">
                  <CheckCircle2 size={16} />
                  <span>Sin matrícula oculta</span>
                </div>
                <div className="sp-perk-pill">
                  <CheckCircle2 size={16} />
                  <span>Acceso ilimitado</span>
                </div>
                <div className="sp-perk-pill">
                  <Users size={16} />
                  <span>Comunidad activa</span>
                </div>
              </div>
            </div>

            <div className="sp-membership-action">
              <Link className="sp-ios-btn-primary sp-btn-large" to="/registro">
                <span>Crear mi cuenta</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
              <span className="sp-membership-note">
                Consulta en recepción las opciones mensuales y anuales.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ==================================================================
          FOOTER: Estilo Minimalista Apple
          ================================================================== */}
      <footer className="sp-wrap sp-footer-modern">
        <div className="sp-footer-inner">
          <Marca src={logos.principal} footer nombreGimnasio={nombreGimnasio} mostrarLogo={mostrarLogo} />
          <p className="sp-footer-tagline">Fuerza. Disciplina. Comunidad.</p>
          <a className="sp-footer-back-top" href="#inicio">
            <span>Volver arriba</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div className="sp-footer-bottom">
          <p>© {new Date().getFullYear()} {nombreGimnasio}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
