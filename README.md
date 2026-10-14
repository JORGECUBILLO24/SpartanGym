# SpartanGym

Sistema de gestión para gimnasios compuesto por una API REST, una aplicación web
para administración y recepción, y una aplicación Android para socios y
entrenadores.

## Componentes

| Componente | Ubicación | Tecnología |
| --- | --- | --- |
| API | `SpartanGymAPI` | Spring Boot 4, Java 17, PostgreSQL, JWT |
| Web | `SpartanGymWeb` | React 19, Vite, Tailwind CSS |
| Android | `SpartanGymApp` | Kotlin, Jetpack Compose, Retrofit |

La API expone autenticación, socios, personal, membresías, pagos, asistencias,
rutinas, inventario, ventas, finanzas, reportes, sucursales y notificaciones.

## Requisitos

- Git
- Java 17 o superior
- Node.js LTS y npm
- Android Studio con Android SDK para trabajar en la aplicación móvil
- PostgreSQL para ejecutar la API localmente

## Inicio rápido

### 1. Clonar y preparar la base de datos

```powershell
git clone https://github.com/JORGECUBILLO24/SpartanGym.git
cd SpartanGym
```

Crea una base de datos PostgreSQL llamada `spartangym_db` y ejecuta
`spartan_gym_schema.sql`. El esquema se administra mediante ese archivo porque
Hibernate está configurado con `ddl-auto=none`.

### 2. Configurar y ejecutar la API

Variables mínimas para desarrollo local:

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/spartangym_db"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "tu-clave-local"
$env:JWT_SECRET = "una-clave-local-larga-y-segura"
```

Desde `SpartanGymAPI`:

```powershell
.\mvnw.cmd spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

Para no repetir variables en cada terminal también puedes crear
`SpartanGymAPI/src/main/resources/application-local.properties`. Ese archivo
está excluido de Git y no debe contener credenciales que se quieran compartir.

### 3. Configurar y ejecutar el web

Desde `SpartanGymWeb`:

```powershell
npm install
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
| `MAIL_USERNAME` y `MAIL_PASSWORD` | Correo SMTP opcional |

## Pruebas

API:

```powershell
cd SpartanGymAPI
.\mvnw.cmd test
```

Web:

```powershell
cd SpartanGymWeb
npm install
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
- La API devuelve errores estructurados y responde `401` o `403` según
  corresponda.
