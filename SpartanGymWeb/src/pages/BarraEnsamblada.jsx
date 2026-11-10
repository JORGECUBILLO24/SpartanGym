import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Shield, Sparkles, Weight, Zap } from 'lucide-react';
import equipo from '../assets/barra-discos.png';
import { usePrefersReducedMotion } from '../utils/useParallax';

// Los 3 pares de discos calibrados (de interior a exterior):
// Par 0 (distancia 296): interiores (los primeros que se colocan contra el manguito)
// Par 1 (distancia 326): intermedios
// Par 2 (distancia 352): exteriores
const pares = [
  { distancia: 296, altura: 166, peso: 40, label: 'Par 20kg x 2' },
  { distancia: 326, altura: 146, peso: 40, label: 'Par 20kg x 2' },
  { distancia: 352, altura: 126, peso: 40, label: 'Par 20kg x 2' },
];

export default function BarraEnsamblada() {
  const seccionRef = useRef(null);
  const [paso, setPaso] = useState(0); // 0: vacía (20kg), 1: 1er par (60kg), 2: 2do par (100kg), 3: 3er par (140kg)
  const [animando, setAnimando] = useState(false);
  const timersRef = useRef([]);
  const reducedMotion = usePrefersReducedMotion();

  // Limpiar temporizadores en desmontaje
  const limpiarTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return limpiarTimers;
  }, [limpiarTimers]);

  // Secuencia de ensamble olímpico (disco a disco)
  const ejecutarEnsamble = useCallback(() => {
    limpiarTimers();
    setPaso(0);
    setAnimando(true);

    // 1er par entra a los 350ms
    const t1 = setTimeout(() => {
      setPaso(1);
    }, 350);

    // 2do par entra a los 750ms
    const t2 = setTimeout(() => {
      setPaso(2);
    }, 750);

    // 3er par entra a los 1150ms y culmina
    const t3 = setTimeout(() => {
      setPaso(3);
      setAnimando(false);
    }, 1150);

    timersRef.current = [t1, t2, t3];
  }, [limpiarTimers]);

  useEffect(() => {
    if (reducedMotion) {
      setPaso(3);
      setAnimando(false);
      return;
    }

    const elemento = seccionRef.current;
    if (!elemento) return;

    let ejecutado = false;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting && !ejecutado) {
          ejecutado = true;
          ejecutarEnsamble();
        }
      },
      { threshold: 0.25 }
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, [reducedMotion, ejecutarEnsamble]);

  // Cálculo del peso actual acumulado
  const pesoActual = paso === 0 ? 20 : paso === 1 ? 60 : paso === 2 ? 100 : 140;

  return (
    <section ref={seccionRef} id="fuerza" className="sp-load" aria-labelledby="sp-lift-title">
      <div className="sp-load-ambient-glow" aria-hidden="true" />
      <div className="sp-wrap sp-load-frame">
        <div className="sp-load-header text-center">
          <div className="sp-ios-kicker-pill inline-flex items-center gap-1.5 mx-auto mb-3">
            <Sparkles size={13} aria-hidden="true" />
            <span>INGENIERÍA & DISCIPLINA</span>
          </div>
          <h2 id="sp-lift-title" className="sp-load-title">
            Disco a disco<span className="sp-dot-neutral">.</span>
          </h2>
          <p className="sp-description mx-auto text-center max-w-xl">
            Cada kilogramo cuenta. Carga la barra con precisión biomecánica y supera tus propios límites en cada levantamiento.
          </p>

          {/* Dynamic Weight Badge estilo Apple Health / Fitness HUD */}
          <div className="sp-load-weight-hud" aria-live="polite">
            <div className="sp-weight-display">
              <Weight size={18} className="text-white opacity-80" aria-hidden="true" />
              <span className="sp-weight-number">{pesoActual}</span>
              <span className="sp-weight-unit">KG</span>
            </div>
            <span className="sp-weight-status">
              {paso === 0
                ? 'Barra olímpica base (20 kg)'
                : paso === 1
                ? 'Primer par ensamblado (60 kg)'
                : paso === 2
                ? 'Segundo par ensamblado (100 kg)'
                : 'Carga olímpica completa (140 kg)'}
            </span>
            <button
              type="button"
              className="sp-ios-replay-btn"
              onClick={ejecutarEnsamble}
              disabled={animando}
              aria-label="Ver animación de ensamble de la barra olímpica de nuevo"
            >
              <RotateCcw size={14} className={animando ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Ver ensamble</span>
            </button>
          </div>
        </div>

        {/* Arte vectorial de la barra y discos con recorte estricto anti-desbordamiento */}
        <div className="sp-load-stage">
          <svg
            className="sp-load-art"
            viewBox="0 0 1040 240"
            role="img"
            aria-label={`Barra olímpica de acero con carga actual de ${pesoActual} kg`}
          >
            <defs>
              {/* Máscara de recorte estricta: corta EXACTAMENTE la barra olímpica (y=97 a 195).
                  Esto elimina por completo cualquier disco que esté debajo en el archivo png original. */}
              <clipPath id="sp-bar-crop">
                <rect x="0" y="97" width="1774" height="98" />
              </clipPath>

              <image id="sp-equipo" href={equipo} width="1774" height="887" />

              <symbol id="sp-plate" viewBox="777 245 221 611">
                <use href="#sp-equipo" />
              </symbol>
            </defs>

            {/* Barra olímpica central: recortada al milímetro para que ningún elemento inferior sobresalga */}
            <svg
              x="105"
              y="97"
              width="830"
              height="46"
              viewBox="0 97 1774 98"
              className="sp-olympic-bar"
              overflow="hidden"
              style={{ overflow: 'hidden' }}
            >
              <use href="#sp-equipo" clipPath="url(#sp-bar-crop)" />
            </svg>

            {/* Pares de discos: se ensamblan secuencialmente desde los extremos hacia el collar */}
            {pares.map(({ distancia, altura }, indice) => {
              // El par está ensamblado si el paso actual es mayor que su índice
              const estaCargado = paso > indice || reducedMotion;

              // Distancia de desplazamiento cuando está fuera de la barra
              const offsetFuera = 220 + (2 - indice) * 50;

              return (
                <g key={distancia} data-par={indice} className="sp-load-pair">
                  {/* Disco izquierdo */}
                  <g
                    className="sp-load-disc sp-load-left"
                    style={{
                      transform: estaCargado ? 'translate3d(0, 0, 0)' : `translate3d(${-offsetFuera}px, 0, 0)`,
                      opacity: estaCargado ? 1 : 0,
                      transition: reducedMotion
                        ? 'none'
                        : 'transform 420ms cubic-bezier(0.18, 0.9, 0.32, 1.15), opacity 300ms ease',
                    }}
                  >
                    <use
                      href="#sp-plate"
                      x={520 - distancia - altura * 0.1}
                      y={120 - altura * 0.49}
                      width={altura * 0.36}
                      height={altura}
                    />
                  </g>

                  {/* Disco derecho */}
                  <g
                    className="sp-load-disc sp-load-right"
                    style={{
                      transform: estaCargado ? 'translate3d(0, 0, 0)' : `translate3d(${offsetFuera}px, 0, 0)`,
                      opacity: estaCargado ? 1 : 0,
                      transition: reducedMotion
                        ? 'none'
                        : 'transform 420ms cubic-bezier(0.18, 0.9, 0.32, 1.15), opacity 300ms ease',
                    }}
                  >
                    <g transform="translate(1040 0) scale(-1 1)">
                      <use
                        href="#sp-plate"
                        x={520 - distancia - altura * 0.1}
                        y={120 - altura * 0.49}
                        width={altura * 0.36}
                        height={altura}
                      />
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Ficha técnica estilo Apple / iOS Specs en tono negro obsidian */}
        <div className="sp-load-specs" role="list" aria-label="Especificaciones del equipamiento olímpico">
          <div className="sp-ios-spec-card" role="listitem">
            <Zap size={16} aria-hidden="true" />
            <div className="sp-ios-spec-content">
              <span className="sp-ios-spec-val">20 KG • BARRA DE ACERO</span>
              <span className="sp-ios-spec-desc">Calibración Olímpica Oficial</span>
            </div>
          </div>
          <div className="sp-ios-spec-card" role="listitem">
            <Shield size={16} aria-hidden="true" />
            <div className="sp-ios-spec-content">
              <span className="sp-ios-spec-val">190.000 PSI HIGH-TENSILE</span>
              <span className="sp-ios-spec-desc">Resistencia y elasticidad óptima</span>
            </div>
          </div>
          <div className="sp-ios-spec-card" role="listitem">
            <Sparkles size={16} aria-hidden="true" />
            <div className="sp-ios-spec-content">
              <span className="sp-ios-spec-val">DISCOS DE URETANO CNC</span>
              <span className="sp-ios-spec-desc">Tolerancia mínima de rebote</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
