import { useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar si el usuario prefiere movimiento reducido en el sistema operativo.
 */
export function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reducedMotion;
}

/**
 * Hook de efecto de paralaje con el cursor del ratón (spatial 3D parallax).
 * Aplica interpolación suave (lerp) mediante requestAnimationFrame para 60/120 fps fluidos.
 */
export function useMouseParallax({ sensitivity = 20, maxTilt = 8 } = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const [coords, setCoords] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const targetCoords = useRef({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const currentCoords = useRef({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      setCoords({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
      return;
    }

    const handleMouseMove = (event) => {
      const { innerWidth, innerHeight } = window;
      // Normalizar coordenadas de -1 a 1 respecto al centro de la pantalla
      const normX = (event.clientX / innerWidth - 0.5) * 2;
      const normY = (event.clientY / innerHeight - 0.5) * 2;

      targetCoords.current = {
        x: normX * sensitivity,
        y: normY * sensitivity,
        tiltX: -normY * maxTilt,
        tiltY: normX * maxTilt,
      };
    };

    const animate = () => {
      // Lerp (Linear interpolation) factor = 0.08 para suavidad natural estilo iOS
      const factor = 0.08;
      const cur = currentCoords.current;
      const tgt = targetCoords.current;

      cur.x += (tgt.x - cur.x) * factor;
      cur.y += (tgt.y - cur.y) * factor;
      cur.tiltX += (tgt.tiltX - cur.tiltX) * factor;
      cur.tiltY += (tgt.tiltY - cur.tiltY) * factor;

      setCoords({
        x: Math.round(cur.x * 100) / 100,
        y: Math.round(cur.y * 100) / 100,
        tiltX: Math.round(cur.tiltX * 100) / 100,
        tiltY: Math.round(cur.tiltY * 100) / 100,
      });

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [reducedMotion, sensitivity, maxTilt]);

  return coords;
}

/**
 * Hook para calcular progreso y desplazamiento de paralaje por scroll en un elemento específico.
 */
export function useScrollParallax(elementRef, speed = 0.25) {
  const reducedMotion = usePrefersReducedMotion();
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setOffsetY(0);
      return;
    }

    let rafId = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!elementRef.current) return;
        const rect = elementRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Solo calcular si está cerca o dentro del viewport
        if (rect.bottom > -200 && rect.top < windowHeight + 200) {
          const relativePos = rect.top - windowHeight / 2;
          setOffsetY(Math.round(relativePos * speed));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [elementRef, speed, reducedMotion]);

  return offsetY;
}
