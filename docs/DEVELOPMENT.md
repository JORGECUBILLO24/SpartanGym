# Desarrollo, pruebas y CI

## Ejecutar localmente
Requisitos sugeridos: Java 21, Maven Wrapper incluido, Node.js 22, PostgreSQL y Android SDK para la app.
- API: configurar `SPRING_DATASOURCE_URL`, usuario, contraseña, JWT_SECRET (fuera de local); inicializar `spartan_gym_schema.sql`. `cd SpartanGymAPI && ./mvnw spring-boot:run`
- Web: `cd SpartanGymWeb && npm ci && npm run dev`, con `VITE_API_BASE_URL`.
- Android: abrir `SpartanGymApp` con Android Studio o ejecutar `./gradlew testDebugUnitTest assembleDebug`.
- Redis opcional: configurar `APP_QR_SESSION_STORE=redis` y `SPRING_DATA_REDIS_URL` para compartir sesiones QR. Por defecto queda `memory`.

## CI
`.github/workflows/ci.yml` ejecuta build/test API con PostgreSQL temporal, npm lint/build y pruebas Android. El workflow usa únicamente secretos ficticios de pruebas. Después de publicar cambios, comprobar los logs de Actions y corregir fallos hasta obtener verde; esta propuesta no afirma que el pipeline ya haya pasado.

## Reglas del repositorio
No subir claves ni archivos `.env`, `.idea`, `.gradle`, `node_modules` o salidas de compilación. Abrir PR para revisiones, proteger main y no fusionar CI rojo. Versionar migraciones de BD y documentar los cambios irreversibles. 
