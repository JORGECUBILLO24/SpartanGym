# Plan incremental de React a React + TypeScript

React ya existe: no se sustituye, se incorporan archivos `.ts` y `.tsx` mientras coexisten con `.js` y `.jsx`.

Se añadió `tsconfig.json` con `allowJs=true`, `checkJs=false` y modelos iniciales en `src/types/domain.ts`. Esto **no** convierte todavía todas las pantallas ni activa una comprobación de tipos en CI. Próximo cambio: añadir `typescript` como devDependency con su lockfile actualizado y `npm run typecheck`, luego habilitarlo en CI cuando pase.

Orden sugerido: (1) clientes API y auth; (2) contexto de sucursal y configuración; (3) componentes compartidos; (4) pantallas críticas (pagos, ventas, asistencias); (5) layouts y demás páginas. Migrar por PR pequeño con pruebas; no renombrar en masa archivos que todavía produzcan errores de tipos.

No es necesario migrar Java/Spring Boot ni la aplicación Android para usar TypeScript en React.
