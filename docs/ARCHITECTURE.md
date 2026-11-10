# Arquitectura y ruta SaaS — SpartanGym

Estado: propuesta de evolución, no arquitectura multiempresa ya implementada.

## Componentes actuales
- `SpartanGymWeb`: React 19, Vite, Tailwind; admin y recepción.
- `SpartanGymApp`: Android Kotlin/Compose para socios y entrenadores.
- `SpartanGymAPI`: Spring Boot 4, Java, seguridad JWT y lógica de negocio.
- PostgreSQL: fuente de verdad para usuarios, membresías, pagos, inventario y asistencias.

## Redis opcional para el flujo QR web
La API ofrece `QrWebSessionStore` con backend `memory` (valor predeterminado compatible con la instalación actual) y `redis` (sesiones compartidas entre réplicas).
Configurar `APP_QR_SESSION_STORE=redis` y `SPRING_DATA_REDIS_URL=redis://...` o `rediss://...` cuando haya una instancia Redis disponible. Nunca guardar credenciales en el repositorio. Las sesiones se mantienen hasta diez minutos tras la expiración del QR para permitir consultar estados. Las asistencias definitivas y la prevención de reutilización permanecen en PostgreSQL. No se debe usar almacenamiento en memoria con múltiples réplicas.

Este primer cambio no incorpora cache general de reportes, rate limiting ni colas: requieren pruebas y decisiones independientes.

## Prioridades de seguridad
1. Revisar autorización por propietario de recursos, organización y sucursal. No confiar en `X-Sucursal-Id` enviado por el cliente.
2. Configurar `ATTENDANCE_QR_SECRET` fuerte y obligatorio en producción; eliminar fallback estático.
3. Separar pago solicitado/pendiente de pago confirmado por pasarela o recepción.
4. Corregir condiciones de carrera de stock y proteger operaciones financieras.
5. Formalizar esquema multi-tenant antes de compartir infraestructura entre empresas.

## Multitenancy propuesta
`organizaciones` → `sucursales`, `organizacion_usuario` → permisos por tenant, configuración visual y planes por organización. Añadir consultas siempre filtradas por tenant y pruebas cruzadas entre gimnasios. El superadmin global se distingue del administrador de una organización. Evitar introducir esta migración de esquema sin plan reversible y datos de prueba.

## Escala
Primero optimizar consultas SQL (`ReporteService` carga tablas completas), añadir índices/observabilidad y medir. Procesos programados deben coordinarse y ser idempotentes en varias réplicas. Redis no sustituye PostgreSQL ni corrige consultas ineficientes.
