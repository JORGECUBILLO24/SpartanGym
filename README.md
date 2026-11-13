# SaasGym

Sistema de gestión para gimnasios compuesto por una API REST, una aplicación web
para administración y recepción, y una aplicación Android para socios y
entrenadores.

## Componentes

| Componente | Ubicación | Tecnología |
| --- | --- | --- |
| API | `SaasGym` | Spring Boot 4, Java 17, PostgreSQL, JWT |
| Web | `SaasGym` | React 19, Vite, Tailwind CSS |
| Android | `SaasGym` | Kotlin, Jetpack Compose, Retrofit |

La API expone autenticación, socios, personal, membresías, pagos, asistencias,
rutinas, inventario, ventas, finanzas, reportes, sucursales y notificaciones.

## Requisitos

- Git
- Java 17 o superior para la API; Java 21 para el daemon de Gradle Android
- Node.js 22.13 o superior (se recomienda 24) y npm
- Android Studio con Android SDK para trabajar en la aplicación móvil
- PostgreSQL para ejecutar la API localmente

## Inicio rápido

### 1. Clonar y preparar la base de datos

```powershell
git clone https://github.com/JORGECUBILLO24/SaasGym.git
cd SaasGym
```

Crea una base de datos PostgreSQL llamada `spartangym_db` y ejecuta
`spartan_gym_schema.sql`. El esquema se administra mediante ese archivo porque
Hibernate está configurado con `ddl-auto=none`.

El esquema no crea cuentas administrativas ni precarga sucursales. Debes crear
la primera cuenta administrativa mediante un procedimiento controlado de
provisión y después crear al menos una sucursal en **Administración → Sucursales**;
el registro público de socios se habilita cuando existe una sucursal.

### 2. Configurar y ejecutar la API

Variables mínimas para desarrollo local:

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/spartangym_db"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "tu-clave-local"
$jwtBytes = New-Object byte[] 32
$jwtRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtRng.GetBytes($jwtBytes)
$jwtRng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
```

Desde `SpartanGymAPI`:

```powershell
.\mvnw.cmd spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

`JWT_SECRET` debe codificar al menos 32 bytes en Base64 estándar. Conserva la
misma clave entre reinicios para mantener válidas las sesiones existentes.
El perfil `local` tiene una clave de respaldo exclusivamente para desarrollo.

Para no repetir variables en cada terminal también puedes crear
`SpartanGymAPI/src/main/resources/application-local.properties`. Ese archivo
está excluido de Git y no debe contener credenciales que se quieran compartir.

### 3. Configurar y ejecutar el web

Desde `SpartanGymWeb`:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Para desarrollo local, usa esta URL en `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

El web queda disponible normalmente en `http://localhost:5173`.

Comandos de validación:

```powershell
npm run lint
npm run build
```

### 4. Configurar y ejecutar Android

Abre `SpartanGymApp` desde Android Studio y espera la sincronización de Gradle.
La configuración actual requiere Android SDK 36.1 y un daemon Gradle con Java 21
(ver `app/build.gradle.kts` y `gradle/gradle-daemon-jvm.properties`).
Si Gradle no encuentra el SDK, crea `SpartanGymApp/local.properties` con una ruta
local, por ejemplo:

```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

La URL de la API se configura mediante propiedades de Gradle:

```powershell
.\gradlew.bat test
.\gradlew.bat assembleDebug -PSPARTANGYM_API_BASE_URL_DEBUG=http://10.0.2.2:8080/
```

`10.0.2.2` apunta al equipo anfitrión cuando se usa el emulador Android. En un
dispositivo físico debe usarse la IP accesible del equipo que ejecuta la API.

## Despliegue

- `render.yaml` contiene la definición del servicio de API para Render.
- `SpartanGymWeb/.env.example` documenta la URL pública de la API para Vercel u
  otro hosting estático.
- Las variables de producción deben configurarse en el proveedor de despliegue;
  nunca deben incluirse en Git.

Variables importantes de producción:

| Variable | Uso |
| --- | --- |
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | Usuario de PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de PostgreSQL |
| `JWT_SECRET` | Clave de firma de tokens |
| `APP_CORS_ORIGINS` | Orígenes web permitidos, separados por coma |
| `APP_WEB_RESET_PASSWORD_URL` | URL web para restablecer contraseñas |
| `ATTENDANCE_QR_SECRET` | Secreto HMAC obligatorio para los QR fuera de local |
| `MAIL_USERNAME` y `MAIL_PASSWORD` | Credenciales SMTP/Brevo para correo |

### Correo con Brevo

La API usa SMTP. Para Brevo configura en Render las variables `MAIL_USERNAME`
con el correo remitente verificado y `MAIL_PASSWORD` con la clave SMTP de
Brevo. Mantén `spring.mail.host=smtp-relay.brevo.com`, puerto `587` y TLS
habilitado; no guardes esas credenciales en Git.

## Pruebas

API:

```powershell
cd SpartanGymAPI
.\mvnw.cmd test
```

Web:

```powershell
cd SpartanGymWeb
npm ci
npm run lint
npm run build
```

Android:

```powershell
cd SpartanGymApp
.\gradlew.bat test
```

El workflow de GitHub Actions en `.github/workflows/ci.yml` ejecuta estas
validaciones automáticamente para los cambios enviados al repositorio.

## Seguridad y configuración

- No subas `.env`, `application-local.properties`, `local.properties`, claves,
  keystores ni archivos generados por Android Studio.
- En producción usa un `JWT_SECRET` fuerte y exclusivo.
- `VITE_*` se incorpora al bundle público del navegador; nunca pongas secretos
  en esas variables.
- Para recibir errores estructurados, envía `Accept: application/problem+json`;
  sin ese encabezado la API conserva mensajes de texto para clientes antiguos.
  Las rutas protegidas responden `401` sin sesión y `403` sin permiso. Las
  credenciales incorrectas en el login responden `400` por contrato del cliente.

## Revisión de documentación y contratos

Consulta `docs/REVISION_DISCREPANCIAS.md` para la revisión de las nueve secciones
del documento Postman, las diferencias con la API actual y los casos pendientes.

### Probar el QR de asistencia en un celular físico

Genera un **QR de validación web** en recepción y escanéalo desde la pestaña
**QR** de Android con una cuenta de socio con membresía activa. Los códigos de
socio y de validación web cumplen funciones distintas. Mantén el código
completo, incluido su borde blanco, dentro del visor.

La web y Android deben usar la misma instancia de la API. La dirección
`10.0.2.2` funciona desde el emulador. Para un celular físico conectado a la
misma red que el equipo, usa la IP de red del equipo en el APK de depuración:

```powershell
cd SpartanGymApp
.\gradlew.bat assembleDebug "-PSPARTANGYM_API_BASE_URL_DEBUG=http://IP_DEL_EQUIPO:8080/"
```

Comprueba desde el celular que la API responde en esa dirección antes de probar
el QR. Si el código expira, genera uno nuevo en recepción.

### Acceso web con Google

Crea un cliente OAuth de tipo aplicación web en Google Cloud y autoriza
`http://localhost:5173` como origen JavaScript para desarrollo. En producción,
autoriza el origen HTTPS real del frontend.

- API: configura `GOOGLE_CLIENT_ID` con el ID público del cliente.
- Web: configura `VITE_GOOGLE_CLIENT_ID` con el mismo ID en `SpartanGymWeb/.env`.
- API: configura `GOOGLE_ACCOUNT_LINKS` con las vinculaciones autorizadas en formato
  `sub=correo,sub=correo`. Cada correo debe corresponder a una cuenta activa de
  SpartanGym y al correo verificado del token. Usa el identificador estable
  `sub` de Google, obtenido mediante un flujo verificado y revisado por el
  administrador. Reinicia la API y el servidor web tras cambiar la configuración.

El botón aparece al configurar el frontend. La API valida el token de Google y
emite la sesión habitual de SpartanGym para la cuenta vinculada, con su rol
existente. El ID de cliente es público. Este flujo no requiere un secreto OAuth.

[Configurar el cliente web en Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
