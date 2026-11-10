# Revisión de diseño web — 8 de noviembre de 2026

Se conservó la identidad negra/roja, las rutas y las operaciones existentes. La mejora cubre la base visual compartida, acceso, navegación de administración/recepción y componentes de métricas.

## Discrepancias corregidas

- **Importes cero invisibles:** Inicio de administración usaba condiciones truthy para `valorMonto` y `metricaMonto`; cero se descartaba y producía un encabezado vacío. Ahora cero se formatea como moneda.
- **Nueva venta:** el acceso rápido llevaba al inventario. Ahora abre `/admin/ventas`.
- **Recepción:** el buscador decorativo no ejecutaba ninguna búsqueda y la campana no tenía acción. Se sustituyó el buscador por el acceso real a registrar asistencia y se conectó la campana a notificaciones.
- **Entrada:** etiquetas asociadas a campos, autocompletado, botón de contraseña accesible mediante teclado, rol opcional explícito, mensajes anunciados y estado de envío comprensible. Se redujo el logo para dar prioridad al formulario y se aumentó la legibilidad de las etiquetas.
- **Navegación:** enlaces para saltar al contenido, estados de menú anunciados, menús cerrados invisibles al teclado en móvil y reinicio del scroll al cambiar de ruta.
- **Métricas compartidas:** estructura flexible que evita superposición del texto con el icono, números tabulares, títulos y detalles con tamaño legible.
- **Movimiento:** tokens de curva y duración, entradas de página de 240 ms, eliminación de animación en filas de tablas y entradas duplicadas del contenedor inmediato; barras mediante transform en lugar de width. Hover decorativo condicionado a puntero fino, imagen con transición interrumpible en lugar de respiración infinita. Se respeta movimiento reducido, incluido scroll y carga.
- **Estados globales:** indicador de carga con anuncio accesible, foco visible global, selección/caret del color del sistema, objetivos de navegación de 44 px y campos móviles de 16 px.

## Validación

- `npm run build`: correcto.
- `npm run lint`: correcto.
- Detector Impeccable: detectó borde lateral grueso en selección de recepción; corregido a fondo de selección consistente con administración.
- Inspección visual del coordinador: login funcional y administración con datos a ancho aproximado de 600 px. Sus hallazgos de importe cero y scroll fueron corregidos.

## Límites

La revisión visual no recorrió individualmente todos los formularios, modales y estados de cada módulo ni todos los tamaños de pantalla. Persisten estilos utilitarios antiguos de movimiento/contraste en páginas individuales que requieren una revisión de interacción por flujo. El alcance entregado no equivale a certificar accesibilidad completa del producto.

## Fotografías

- Portada: [Marvin Cors](https://unsplash.com/photos/a-woman-lifting-a-black-dumbbell-in-a-gym-O1iH3EmWvbM).
- Equipamiento: [Samuel Girven](https://unsplash.com/photos/gym-with-weightlifting-equipment-fqMu99l8sqo).

Ambas se sirven como archivos WebP locales y están disponibles bajo la [licencia de Unsplash](https://unsplash.com/license).

## Video de portada y galería

- [Levantamiento con barra de Ketut Subiyanto](https://www.pexels.com/video/man-lifting-the-barbell-up-4745811/)
- [Entrenamiento con barra de Tima Miroshnichenko](https://www.pexels.com/video/a-man-working-out-using-barbell-5319095/)

Los clips se sirven localmente con fotogramas WebP como portada.

## Galería simplificada y prueba adversarial — 9 de noviembre de 2026

Alcance: `GaleriaSpartan` y su frontera de props `escenas`. Hallazgos registrados antes de corregir; la solicitud del usuario incluye mejorar y reparar la interfaz.

| Campo | Origen | Tipo | Límite | Opcional |
| --- | --- | --- | --- | --- |
| `titulo` | `escenas[].titulo` | texto | sin límite en el componente; contenido editorial local | No |
| `src` | `escenas[].src` | ruta de imagen | sin límite | No |
| `alt` | `escenas[].alt` | texto | sin límite | Sí |
| `video` | `escenas[].video` | ruta de video | sin límite | Sí |
| posición y total | índice / `escenas.length` | enteros | número de escenas | No |
| colección | prop `escenas` | array | sin límite en el componente; 3 escenas en el inicio | No |
| estados | carga de imagen, video y selección | estado local | visible, error, vacío, una escena | — |

| # | Severidad | Campo / valor | Qué falla antes | Corrección prevista |
| --- | --- | --- | --- | --- |
| 1 | Fragile | `src` ausente o archivo retirado | Imagen rota sin sustitución | Mensaje discreto en el mismo marco, sin salto de layout |
| 2 | Fragile | `titulo` vacío o duplicado | Etiqueta sin nombre; keys duplicadas | Título de reserva y claves independientes del título |
| 3 | Ugly | título largo + 320 px + texto aumentado | Pie sobre imagen ocupa el contenido visual y puede recortarse | Título fuera del marco, wrap completo y controles en fila separada |
| 4 | Fragile | colección de 1.000 escenas | Un observador/video por escena aunque no esté visible | Cargar medios solo junto a la escena activa; contador formateado |

Lo que ya resistía: estado vacío explícito, `object-fit: cover`, controles de extremos deshabilitados, texto React escapado y vídeo pausado fuera de vista. La eliminación del scroll vertical interno evita competir con el desplazamiento de la página. Se conserva el avance manual por botones y se añade swipe horizontal nativo.

Decisiones aplicadas: los títulos envuelven completos; nunca se truncan nombres de escenas ni contadores. Los errores de medios conservan el área reservada. La galería no avanza automáticamente. Toggle de desarrollo en `/?galeria=normal#galeria`: Demo data, Worst case, Empty, One y 1,000. Casos y controles no se incluyen en producción.

La comprobación visual final queda a cargo del coordinador; estos hallazgos iniciales proceden de inspección de código, no de capturas.
