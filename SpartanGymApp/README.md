# SpartanGym App (Android)

## Configuracion de API por ambiente

La app define la URL base de la API mediante `BuildConfig.API_BASE_URL`:

- **debug**: `http://10.0.2.2:8080/` (emulador Android hacia localhost del host)
- **release**: `https://spartangym-api.onrender.com/`

Si pruebas en dispositivo fisico, ajusta temporalmente `debug` en `app/build.gradle.kts` hacia la IP local del backend.
