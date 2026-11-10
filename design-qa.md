# Design QA · Galería & Experiencia Spartan Gym

final result: passed

## Resumen de Mejoras Aplicadas (Diseño iOS, Monocromo Obsidian & Paralaje)

Se implementaron habilidades avanzadas de diseño de interfaz inspiradas en los estándares de **Apple Human Interface Guidelines (iOS)**, estética **Obsidian Space Black** (eliminación de rojos en favor de negro premium, platino y cristal) y técnicas de **diseño con paralaje cinematográfico y animación física reactiva (Apple Product Showcase)** sobre la portada pública, la galería de entrenamiento (`GaleriaSpartan`), la sección de ingeniería biomecánica (`BarraEnsamblada`), el encabezado flotante y el Bento Grid de beneficios.

---

## Evidencia de Implementación & Criterios iOS

### 1. Paleta Monocromática Obsidian & Glassmorphism
- **Botones Principales en Negro Puro (Space Black):**
  - Los botones de acción principal («Empieza a entrenar», «Iniciar sesión», «Registrarme») cambiaron de rojo vivo a negro obsidiana profundo (`#000000` / `#141416`), complementados con un borde perimetral de vidrio platino (`rgba(255, 255, 255, 0.22)`), bisel interior especular y microinteracción háptica al presionar (`active:scale-[0.96]`).
- **Eliminación Total de Acentos Rojos:**
  - Puntos de cierre tipográficos (`.`) ajustados a blanco platino con resplandor sutil.
  - Indicadores pulsantes, tarjetas flotantes y sellos de características unificados bajo la paleta monocromática de lujo Apple.
- **Selector Segmentado Flotante (Apple Segmented Control):**
  - Control táctil tipo cápsula con indicador deslizante animado mediante curvas de muelle (`cubic-bezier(0.16, 1, 0.3, 1)`), soporte táctil y selección instantánea de escenas.
- **HUD Flotante & Geometría Squircle Continua:**
  - Bordes suavizados continuos de 28px/36px con bisel interior especular y sombras multicapa obsidianas.

### 2. Animación de Ensamble y Física de la Barra Olímpica (`BarraEnsamblada.jsx`)
- **Animación de Carga Progresiva Multi-navegador:**
  - Se implementó un observador `IntersectionObserver` que detecta la entrada de la sección y activa el deslizamiento secuencial de los 3 pares de discos desde los extremos hacia el centro con curvas de muelle elásticas (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Contador Dinámico de Peso en Tiempo Real:**
  - HUD interactivo estilo Apple Health/Fitness que muestra el peso olímpico acumulado en vivo: parte de `20 KG` (barra base), avanza a `60 KG`, `100 KG` y culmina en `140 KG` con el bloqueo de los discos de uretano CNC.
- **Botón de Rebobinado Interactivo:**
  - Control «Ver ensamble» que permite al usuario repetir la animación física de carga en cualquier momento con rotación suave del icono.
- **Compatibilidad Híbrida Scroll-Driven:**
  - Respeta `view-timeline: --sp-load` en navegadores compatibles y mantiene fallback activo e inmediato en todos los entornos.

### 3. Apple Bento Grid & Profundidad Espacial (Parallax Design)
- **Fotografía de Alto Impacto Estético (Gymshark / YoungLA Aesthetic):**
  - Se sustituyeron las fotografías anteriores y la imagen del entrenador por tomas atléticas de alta definición:
    - **Galería (Escena 1 - Espacio):** Gimnasio oscuro de lujo con mancuernas e iluminación cinematográfica.
    - **Galería (Escena 2 - Cada repetición cuenta):** Atleta con físico estético y vascularizado en plena ejecución, eliminando el plano corto genérico de antebrazo.
    - **Galería (Escena 3 - Fuerza en movimiento):** Entrenamiento de fuerza de alto rendimiento.
    - **Bento Grid (Entrenamiento Acompañado):** Entrenador joven y atlético con estética moderna Gymshark/YoungLA en sustitución de la fotografía previa.
- **Paralaje 3D Espacial con Cursor (Desktop):**
  - Inclinación de tarjeta con perspectiva tridimensional interactiva (`rotateX` / `rotateY`) e iluminación especular dinámica.
- **Contradesfase de Imagen en Riel (Interior Parallax):**
  - Desfase visual contra-scroll de la imagen interior en la galería (`translate3d(offset, 0, 0) scale(1.08)`).
- **Textura Cinematográfica (Film Grain):**
  - Capa de ruido fractal sutil a nivel de pantalla (`sp-grain`) para eliminar el efecto digital plano y otorgar profundidad orgánica de película.

---

## Verificación de Calidad Técnica

- **Build de producción:** `npm run build` ejecutado exitosamente con Vite v8 en 719 ms.
- **Linter:** `npm run lint` ejecutado con **0 errores y 0 advertencias**.
- **Movimiento reducido:** `prefers-reduced-motion: reduce` verificado: desactiva transiciones 3D, animación de discos y fijación inmediata a carga completa de 140 KG sin saltos visuales.
