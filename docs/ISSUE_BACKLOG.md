# Backlog listo para GitHub Issues

**Bloqueo:** el repositorio devuelve HTTP 410 “Issues has been disabled in this repository”. Habilitar *Settings → General → Features → Issues* y trasladar cada entrada como issue independiente. No se crearon issues reales.

## P0 — Seguridad y negocio
1. **[security] Autorizar cada operación por organización/sucursal y dueño del recurso.** Probar dos gimnasios y negar lectura de asistencia/pagos/socios ajenos.
2. **[security] Exigir ATTENDANCE_QR_SECRET fuerte en producción.** Eliminar fallback fijo, rotar secreto y probar expiración/replay.
3. **[payments] Confirmar cobro antes de activar membresías.** Estados pendiente/confirmado/rechazado, pruebas de concurrencia e idempotencia.

## P1 — Plataforma
4. **[inventory] Proteger stock concurrente.** Lock o UPDATE condicional; tests paralelos y aislamiento por sucursal.
5. **[backend] Reportes SQL optimizados.** Reemplazar findAll+stream por COUNT/SUM WHERE tenant, índices y paginación.
6. **[redis] Validar Redis QR en staging.** Testcontainers, expiración, caída Redis, comportamiento multi-réplica, fail-closed y rollback.
7. **[devops] Validar GitHub Actions.** Resolver fallos en API/PostgreSQL, npm y Android; exigir checks en main.
8. **[frontend] Migración React + TypeScript.** Instalar TypeScript con lockfile, scripts typecheck/CI, migrar API/auth/contextos/componentes y pantallas progresivamente.
9. **[uiux] Auditoría visual y accesibilidad.** WCAG 2.2 AA, responsive, focus, labels y estados de error/vacío/espera.
10. **[saas] White-label por organización.** Logo, colores, mensajes, correos, moneda y organización en almacenamiento.
11. **[security] Fortalecer sesiones y rate limits.** JWT en navegador, política CSP, HTTP Android release, backups y límites de login.
12. **[jobs] Idempotencia de scheduler y entrega de correos.** Lock único, retries/outbox y zonas horarias.

## P2 — Calidad
13. **[docs] Migraciones, documentación API y limpieza.** Flyway/Liquibase; OpenAPI; ADR; eliminar .idea/.gradle; actualizar manual al definir marca.

## Criterios generales
Cada issue debe incluir alcance y pruebas de aceptación, responsable, evidencia de ejecución y clasificación de seguridad. No declarar resuelta una alerta hasta tener pruebas automatizadas y una revisión de código.
