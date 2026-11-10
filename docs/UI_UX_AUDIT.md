# Auditoría de UI/UX (medida, 15-oct-2026)

Referencia: WCAG 2.2 AA. Método: `axe-core` 4.14 ejecutado en el navegador sobre la web local
(sin backend y sin datos productivos; las pantallas de administración se abrieron con una sesión
ficticia solo en `localStorage`), más un escaneo estático del código. No se revisaron las pantallas
de recepción ni Android, ni el tema claro del panel de administración.

## Resultados

| Problema | Dónde | Severidad |
| --- | --- | --- |
| `<select>` sin nombre accesible (`select-name`) | Login, Registro y 7 de 14 pantallas de admin | Crítica |
| Inputs sin etiqueta (`label`, x4) | Admin > Configuración | Crítica |
| Contraste insuficiente (`color-contrast`): `text-gray-500` (#6a7282) sobre fondos casi negros da 3,99–4,21:1 (mínimo 4,5:1); `text-red-500` sobre rojo translúcido da ~4,0:1 | 14 de 14 pantallas de admin (2 a 21 nodos) y Home | Seria |
| Texto ≤ 11 px: 207 usos (161 de 10 px, 28 de 9 px, 2 de 8 px, 16 de 11 px); entre 4 y 30 nodos por pantalla | Todo el panel | Seria |
| Ninguna de las 63 `<label>` usa `htmlFor`; la asociación depende de anidarlas o del `placeholder` | Formularios | Alta |
| Sin `<h1>` | 10 de 14 pantallas de admin | Moderada |
| Sin landmark `<main>` | Home, Login, Registro, Restablecer contraseña | Moderada |
| Enlace del pie del menú: el nombre accesible no contiene el texto visible (`label-content-name-mismatch`) | Todas las pantallas de admin | Seria |
| `<aside>` sin nombre único; tabla con scroll no accesible por teclado (`scrollable-region-focusable`) | Admin (perfil, inventario, mensajes) | Moderada |
| Botón "Mostrar contraseña" siempre dice "Mostrar" en Restablecer contraseña (en Login sí alterna) | Restablecer contraseña | Baja |
| Tarjetas de métricas con etiquetas truncadas a ~800 px | Admin > Inicio | Baja |

Ya existe y funciona bien: `lang="es"`, tema claro/oscuro/sistema, colores de acento y logos
configurables (base de la personalización por gimnasio), botones de icono con `aria-label`.

## Correcciones propuestas (no aplicadas todavía)

1. Subir `text-gray-500` a `text-gray-400` sobre fondos oscuros y `text-red-500` a `text-red-400` en
   texto pequeño (una sola sustitución global cubre la mayoría de los fallos de contraste).
2. Mínimo de 12 px (0,75 rem, unidades relativas) para texto secundario; 14 px para cuerpo.
3. Asociar etiquetas con `htmlFor`/`id` (o `aria-label`) en todos los `<select>` e inputs.
4. Un `<h1>` por pantalla y `<main id="contenido">` en las rutas públicas.
5. Estados de carga/error consistentes (hoy cada pantalla improvisa el suyo).
6. Tras corregir, agregar `vitest-axe` a las pruebas de componentes para que no se reintroduzcan.
