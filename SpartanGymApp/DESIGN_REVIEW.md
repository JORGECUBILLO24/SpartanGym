# Revisión de diseño Android

## Cambios aplicados
- Inicio de sesión: márgenes de sistema y teclado, logo acotado para pantallas pequeñas, contraste de campos mejorado, descripción accesible del control de contraseña y errores persistentes.
- Recuperación: fundido de 150 ms al abrir y 100 ms al cerrar, conservando controles nativos y escala de animación del sistema.
- Navegación entre sesiones: Crossfade de 150 ms; Material/Compose respeta la escala de animación Android.
- Tema: paleta Material oscura consistente con superficies oscuras existentes; colores de contorno y texto secundario definidos, jerarquía tipográfica común.
- Entrenador: etiquetas de navegación a 12sp, indicador de selección visible, contraste de texto secundario mejorado y feedback de estado de 150 ms.
- Socio: iconos de navegación de tamaño estable y etiquetas legibles a 12sp.
- Roles: administración y recepción reciben instrucción de usar el panel web; ya no se envían por defecto a pantallas de socio.
- Base de datos: scrips.txt obsoleto remite ahora al esquema raíz vigente.

## Ejecución y validación
- assembleDebug correcto, APK instalado y actividad iniciada en Pixel_10a (emulator-5554).
- Inspección visual de login mediante captura del emulador: formulario y acción principal visibles, imagen y marca conservadas.
- Pantallas autenticadas revisadas en código. No se validaron visualmente socio/entrenador porque la base local solo tiene la cuenta inicial de administración.
- Persisten avisos preexistentes de APIs de cámara/deprecaciones Compose; no impiden compilar.

## Alcance pendiente
La revisión mejora los fundamentos compartidos y superficies principales. No equivale a una validación de cada flujo con datos reales ni a un rediseño exhaustivo de todos los formularios internos. Se requieren cuentas de socio y entrenador y sus datos para esa comprobación.
