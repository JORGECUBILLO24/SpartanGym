# Foto de perfil (socio y personal) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cada usuario (socio y personal) suba su propia foto de perfil, persistida como data URL webp en `usuarios.foto_url`, y mostrarla en las superficies acordadas (perfil propio, nav web de admin, "Mis Clientes" del entrenador y la tabla de socios registrados).

**Architecture:** El cliente (web y app) redimensiona la imagen a webp base64 antes de enviarla; un único endpoint autenticado `PUT /api/operacion/me/foto` la valida y guarda solo en el usuario resuelto por el token. Las lecturas existentes (`GET /operacion/me`, `/operacion/entrenador/clientes`, `GET /api/socios`) exponen `fotoUrl`. Sin storage externo: la columna `foto_url TEXT` sigue el mismo patrón que `productos_inventario.imagen_url`.

**Tech Stack:** Spring Boot + JPA (API), React + Vite (web), Kotlin + Jetpack Compose + Retrofit (app). Tests: JUnit 5 + Mockito (API), JUnit4 (app, funciones puras). Web sin runner de tests → verificación manual.

## Global Constraints

Estas reglas aplican a **todas** las tareas. Valores copiados verbatim del spec `docs/superpowers/specs/2026-07-17-foto-perfil-design.md`.

- **Modelo de datos:** data URL base64 directo en columna `foto_url TEXT` de `usuarios`. Sin S3/Cloudinary/storage nuevo.
- **Endpoint único:** `PUT /api/operacion/me/foto`, sin `@PreAuthorize` de rol, solo afecta a `usuarioAutenticado(auth)`. Nunca recibe ni toca un `usuarioId` por parámetro. Nadie edita la foto de otro usuario.
- **Validación servidor (`FotoPerfilValidator.validar`):** `null`/blank → `null` (borra la foto); si no empieza con `data:image/` → `RuntimeException("La foto debe ser una imagen válida.")`; si `length() > 700_000` → `RuntimeException("La imagen es demasiado grande.")`; si pasa, devuelve el valor sin transformar.
- **Errores de negocio = `RuntimeException` plano** (no `IllegalArgumentException`). `GlobalExceptionHandler` ya tiene `@ExceptionHandler(RuntimeException.class)` que lo traduce a `400` con el mensaje tal cual — no se agrega nada nuevo ahí.
- **`PersonalResponse` NO se toca** (lista de staff gestionando staff, fuera del núcleo).
- **Web resize foto de perfil:** `{ maxLado: 512, calidad: 0.8, maxBytesEntrada: 5 * 1024 * 1024 }`. `Inventario.jsx` conserva sus valores actuales `{ maxLado: 720, calidad: 0.86, maxBytesEntrada: 3 * 1024 * 1024 }` — su comportamiento no cambia.
- **App Android resize:** `ladoMaximo = 512`, `Bitmap.CompressFormat.WEBP` (deprecada pero válida; **no** `WEBP_LOSSY`, que es API 30+ y `minSdk = 24`), calidad `80`.
- **`spring.jpa.hibernate.ddl-auto=none`:** el `ALTER TABLE` se aplica a mano en Neon; además se agrega la columna al `CREATE TABLE usuarios` y un `ALTER ... IF NOT EXISTS` en `spartan_gym_schema.sql`, igual que se hizo con `imagen_url`.
- **Web sin infraestructura de tests JS** (`package.json` solo `vite`/`eslint`): la verificación de web es **manual** (`npm run dev`, `npm run build`, `npm run lint`).
- **Comandos de build por subsistema** (desde el directorio del subsistema; en PowerShell usar el wrapper `.cmd`/`.bat`):
  - API: `cd SpartanGymAPI` → `./mvnw ...` (PowerShell: `.\mvnw.cmd ...`)
  - Web: `cd SpartanGymWeb` → `npm run ...`
  - App: `cd SpartanGymApp` → `./gradlew ...` (PowerShell: `.\gradlew.bat ...`)
- **Higiene de commits:** no incluir trailer `Co-Authored-By: Claude` (política del repo). Verificar cada mensaje al confirmar.
- **Binarios de Gradle rastreados:** `SpartanGymApp/.gradle/**/*.bin` cambian en cada build; descartarlos siempre antes de commitear (`git checkout -- SpartanGymApp/.gradle`), nunca incluirlos en un commit de feature.

## Estructura de archivos

**API (`SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/`):**
- `models/Usuario.java` — (modificar) campo `fotoUrl`.
- `util/FotoPerfilValidator.java` — (crear) validación pura y estática, testeable sin web/DB.
- `dto/ActualizarFotoRequest.java` — (crear) cuerpo del PUT.
- `controllers/OperacionController.java` — (modificar) endpoint `actualizarFoto` + `fotoUrl` en `usuarioBase()` y `socioMap()`.
- `dto/SocioResponse.java` + `services/SocioService.java` — (modificar) campo `fotoUrl` en la respuesta de `GET /api/socios`.
- Tests: `util/FotoPerfilValidatorTest.java`, `controllers/OperacionControllerFotoTest.java`.

**Web (`SpartanGymWeb/src/`):**
- `utils/imagen.js` — (crear) `prepararImagen(archivo, opciones)` extraído de `Inventario.jsx`.
- `components/Avatar.jsx` — (crear) `<Avatar fotoUrl nombre email tamano respaldo />`.
- `services/api.js` — (modificar) `operacionApi.actualizarFoto`.
- `pages/Admin/sub_pages/Inventario.jsx` — (modificar) usa `prepararImagen`.
- `pages/Admin/sub_pages/PerfilAdmin.jsx` + `pages/Admin/AdminLayout.jsx` — (modificar) subida admin + avatar del nav.
- `pages/Recepcionista/sub_pages/Perfil.jsx` — (modificar) subida recepción.
- `components/RegistroSocioCompartido.jsx` — (modificar) avatar en la tabla de socios.

**App (`SpartanGymApp/app/src/main/java/com/example/spartangymapp/`):**
- `network/AuthModels.kt` — (modificar) `fotoUrl` en `PerfilActualResponse` y `EntrenadorClienteResponse`; nuevas `ActualizarFotoRequest`/`ActualizarFotoResponse`.
- `network/SpartanGymApi.kt` — (modificar) `actualizarFotoPerfil`.
- `util/ImagenPerfil.kt` — (crear) `calcularDimensionesEscaladas` (pura) + `comprimirParaPerfil` (I/O).
- `ui/screen/PerfilCredencial.kt` — (modificar) mostrar foto en la credencial.
- `ui/screen/PantallaUsuario.kt` — (modificar) subida del socio (optimista + reversión).
- `ui/screen/Pantallaentrenador.kt` — (modificar) foto en "Mis Clientes".
- Test: `app/src/test/java/com/example/spartangymapp/util/ImagenPerfilTest.kt`.

**Orden:** API (Tareas 1-4) → Web (5-9) → App (10-14). El web y la app dependen de que el endpoint y las lecturas de la API existan.

---

## Task 1: Columna `foto_url` (schema + entidad)

**Files:**
- Modify: `spartan_gym_schema.sql` (CREATE TABLE usuarios, ~línea 64-71)
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/Usuario.java`

**Interfaces:**
- Consumes: nada.
- Produces: `Usuario.getFotoUrl()` / `Usuario.setFotoUrl(String)` (Lombok `@Data`); columna `usuarios.foto_url`.

- [ ] **Step 1: Agregar la columna al CREATE TABLE de `usuarios`**

En `spartan_gym_schema.sql`, dentro de `CREATE TABLE IF NOT EXISTS usuarios (...)`, agregar `foto_url TEXT,` antes de `fecha_creacion`:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT TRUE,
    foto_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 2: Agregar el ALTER idempotente** (para bases ya existentes, mismo patrón que `imagen_url`)

Inmediatamente después del `CREATE TABLE ... usuarios (...);`, agregar:

```sql
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS foto_url TEXT;
```

- [ ] **Step 3: Agregar el campo a la entidad `Usuario`**

En `Usuario.java`, dentro de la clase (por ejemplo tras el campo `activo`), agregar:

```java
    @Column(name = "foto_url", columnDefinition = "TEXT")
    private String fotoUrl;
```

- [ ] **Step 4: Compilar la API**

Run: `cd SpartanGymAPI && ./mvnw -q -DskipTests compile`
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add spartan_gym_schema.sql SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/Usuario.java
git commit -m "feat(api): agregar columna foto_url a usuarios"
```

> **Nota operativa (no es un paso de código):** en Neon hay que correr a mano el `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;` porque `ddl-auto=none`. Registrarlo en el checklist de deploy.

---

## Task 2: `FotoPerfilValidator` (validación pura, TDD)

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/util/FotoPerfilValidator.java`
- Test: `SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/util/FotoPerfilValidatorTest.java`

**Interfaces:**
- Consumes: nada.
- Produces: `public static String FotoPerfilValidator.validar(String fotoUrl)` — devuelve `null` para entrada nula/blank, el mismo string si es válido, o lanza `RuntimeException` con el mensaje correspondiente.

- [ ] **Step 1: Escribir el test que falla**

Crear `FotoPerfilValidatorTest.java`:

```java
package ni.edu.uam.SpartanGymAPI.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FotoPerfilValidatorTest {

    @Test
    void validar_aceptaDataUrlDeImagen() {
        String entrada = "data:image/webp;base64,AAAA";
        assertEquals(entrada, FotoPerfilValidator.validar(entrada));
    }

    @Test
    void validar_nullDevuelveNull() {
        assertNull(FotoPerfilValidator.validar(null));
    }

    @Test
    void validar_vacioODeEspaciosDevuelveNull() {
        assertNull(FotoPerfilValidator.validar(""));
        assertNull(FotoPerfilValidator.validar("   "));
    }

    @Test
    void validar_rechazaUrlExternaQueNoEsDataUrl() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> FotoPerfilValidator.validar("https://ejemplo.com/foto.png"));
        assertEquals("La foto debe ser una imagen válida.", ex.getMessage());
    }

    @Test
    void validar_rechazaImagenDemasiadoGrande() {
        String grande = "data:image/webp;base64," + "A".repeat(700_001);
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> FotoPerfilValidator.validar(grande));
        assertEquals("La imagen es demasiado grande.", ex.getMessage());
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `cd SpartanGymAPI && ./mvnw -q -Dtest=FotoPerfilValidatorTest test`
Expected: FAIL con error de compilación ("cannot find symbol: class FotoPerfilValidator").

- [ ] **Step 3: Implementar el validador mínimo**

Crear `FotoPerfilValidator.java`:

```java
package ni.edu.uam.SpartanGymAPI.util;

/**
 * Validación pura y aislada de la foto de perfil (data URL base64), testeable
 * sin la capa web ni la base de datos. Convención de errores del proyecto:
 * RuntimeException plano, que GlobalExceptionHandler traduce a 400.
 */
public final class FotoPerfilValidator {

    private static final int LONGITUD_MAXIMA = 700_000;

    private FotoPerfilValidator() {
    }

    public static String validar(String fotoUrl) {
        if (fotoUrl == null || fotoUrl.isBlank()) {
            return null;
        }
        if (!fotoUrl.startsWith("data:image/")) {
            throw new RuntimeException("La foto debe ser una imagen válida.");
        }
        if (fotoUrl.length() > LONGITUD_MAXIMA) {
            throw new RuntimeException("La imagen es demasiado grande.");
        }
        return fotoUrl;
    }
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `cd SpartanGymAPI && ./mvnw -q -Dtest=FotoPerfilValidatorTest test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/util/FotoPerfilValidator.java SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/util/FotoPerfilValidatorTest.java
git commit -m "feat(api): validador de foto de perfil con tests"
```

---

## Task 3: Endpoint `PUT /api/operacion/me/foto`

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/ActualizarFotoRequest.java`
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java`
- Test: `SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionControllerFotoTest.java`

**Interfaces:**
- Consumes: `FotoPerfilValidator.validar(String)` (Tarea 2); `Usuario.setFotoUrl` (Tarea 1).
- Produces: `PUT /api/operacion/me/foto` → `200` con cuerpo `{ "fotoUrl": "<valor o "">" }`. `ActualizarFotoRequest` con getter `getFotoUrl()` (Lombok `@Data`).

- [ ] **Step 1: Crear el DTO**

Crear `ActualizarFotoRequest.java`:

```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class ActualizarFotoRequest {
    private String fotoUrl; // null o "" = quitar la foto
}
```

- [ ] **Step 2: Escribir el test de controller que falla**

Crear `OperacionControllerFotoTest.java`. Construye el controller con solo `usuarioRepository` mockeado (los demás repos/servicios finales van en `null`, en el orden del constructor generado por `@RequiredArgsConstructor`: `usuarioRepository, socioRepository, personalRepository, pagoRepository, membresiaRepository, asistenciaRepository, rutinaRepository, notificacionRepository, ejercicioCompletadoService, rutinaResponseMapper`):

```java
package ni.edu.uam.SpartanGymAPI.controllers;

import ni.edu.uam.SpartanGymAPI.dto.ActualizarFotoRequest;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperacionControllerFotoTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private Authentication auth;

    private OperacionController controller;

    @BeforeEach
    void setUp() {
        controller = new OperacionController(
                usuarioRepository, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void actualizarFoto_soloModificaAlUsuarioAutenticado() {
        Usuario usuario = new Usuario();
        usuario.setEmail("socio@ejemplo.com");
        when(auth.getName()).thenReturn("socio@ejemplo.com");
        when(usuarioRepository.findByEmail("socio@ejemplo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ActualizarFotoRequest req = new ActualizarFotoRequest();
        req.setFotoUrl("data:image/webp;base64,AAAA");

        ResponseEntity<Map<String, Object>> resp = controller.actualizarFoto(req, auth);

        assertEquals("data:image/webp;base64,AAAA", usuario.getFotoUrl());
        assertEquals("data:image/webp;base64,AAAA", resp.getBody().get("fotoUrl"));
        verify(usuarioRepository).findByEmail("socio@ejemplo.com");
        verify(usuarioRepository).save(usuario);
        verifyNoMoreInteractions(usuarioRepository);
    }

    @Test
    void actualizarFoto_conFotoNulaBorraLaFoto() {
        Usuario usuario = new Usuario();
        usuario.setEmail("socio@ejemplo.com");
        usuario.setFotoUrl("data:image/webp;base64,VIEJA");
        when(auth.getName()).thenReturn("socio@ejemplo.com");
        when(usuarioRepository.findByEmail("socio@ejemplo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ActualizarFotoRequest req = new ActualizarFotoRequest();
        req.setFotoUrl(null);

        ResponseEntity<Map<String, Object>> resp = controller.actualizarFoto(req, auth);

        assertNull(usuario.getFotoUrl());
        assertEquals("", resp.getBody().get("fotoUrl"));
    }
}
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `cd SpartanGymAPI && ./mvnw -q -Dtest=OperacionControllerFotoTest test`
Expected: FAIL (no existe el método `actualizarFoto`).

- [ ] **Step 4: Agregar el import y el endpoint en `OperacionController`**

En `OperacionController.java`, agregar el import (junto a los demás `import ni.edu.uam...`):

```java
import ni.edu.uam.SpartanGymAPI.dto.ActualizarFotoRequest;
import ni.edu.uam.SpartanGymAPI.util.FotoPerfilValidator;
```

Y agregar el método público tras `perfilActual(...)` (después de la línea 57, antes de `inicioRecepcion`):

```java
    @PutMapping("/me/foto")
    @Transactional
    public ResponseEntity<Map<String, Object>> actualizarFoto(
            @RequestBody ActualizarFotoRequest request, Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        usuario.setFotoUrl(FotoPerfilValidator.validar(request.getFotoUrl()));
        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("fotoUrl",
                usuario.getFotoUrl() == null ? "" : usuario.getFotoUrl()));
    }
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `cd SpartanGymAPI && ./mvnw -q -Dtest=OperacionControllerFotoTest test`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/ActualizarFotoRequest.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionControllerFotoTest.java
git commit -m "feat(api): endpoint PUT /operacion/me/foto para foto de perfil"
```

---

## Task 4: Exponer `fotoUrl` en las lecturas

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java` (`usuarioBase`, `socioMap`)
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/SocioResponse.java`
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/SocioService.java`

**Interfaces:**
- Consumes: `Usuario.getFotoUrl()` (Tarea 1); `Socio.getUsuario()` (ya usado en `socioMap`/`mapearSocio`).
- Produces: `fotoUrl` en `GET /operacion/me`, `GET /operacion/entrenador/perfil`, `GET /operacion/entrenador/clientes` y `GET /api/socios`. Campo `SocioResponse.fotoUrl` (Lombok, `.fotoUrl(...)` en el builder + `getFotoUrl()`).

- [ ] **Step 1: Agregar `fotoUrl` a `usuarioBase()`**

En `OperacionController.usuarioBase(Usuario usuario)` (línea ~198), agregar tras `data.put("activo", ...)`:

```java
        data.put("fotoUrl", usuario.getFotoUrl());
```

- [ ] **Step 2: Agregar `fotoUrl` a `socioMap()`**

En `OperacionController.socioMap(Socio socio)` (línea ~207), agregar tras `data.put("email", socio.getUsuario().getEmail());`:

```java
        data.put("fotoUrl", socio.getUsuario().getFotoUrl());
```

- [ ] **Step 3: Agregar el campo a `SocioResponse`**

En `SocioResponse.java`, agregar dentro de la clase (por ejemplo tras `estadoAcceso`):

```java
    private String fotoUrl;
```

- [ ] **Step 4: Mapear `fotoUrl` en `SocioService.mapearSocio()`**

En el builder de `mapearSocio` (dentro de `SocioResponse.builder()...build()`), agregar tras `.estadoAcceso(socio.getEstadoAcceso())`:

```java
                .fotoUrl(socio.getUsuario().getFotoUrl())
```

- [ ] **Step 5: Compilar y correr toda la suite de API**

Run: `cd SpartanGymAPI && ./mvnw -q test`
Expected: BUILD SUCCESS, todos los tests (incluidos los de Tareas 2 y 3) en verde.

- [ ] **Step 6: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/SocioResponse.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/SocioService.java
git commit -m "feat(api): exponer fotoUrl en /operacion/me, clientes y /socios"
```

---

## Task 5: Extraer `prepararImagen` a util compartido (web)

**Files:**
- Create: `SpartanGymWeb/src/utils/imagen.js`
- Modify: `SpartanGymWeb/src/pages/Admin/sub_pages/Inventario.jsx`

**Interfaces:**
- Consumes: nada.
- Produces: `export const prepararImagen = async (archivo, { maxLado = 720, calidad = 0.86, maxBytesEntrada = 3 * 1024 * 1024 } = {}) => Promise<string>` — devuelve una data URL webp (o el data URL crudo para SVG/entornos sin `document`).

- [ ] **Step 1: Crear `utils/imagen.js`**

Copiar los helpers hoy locales en `Inventario.jsx` (`leerArchivoComoDataUrl`, `cargarImagen`) y parametrizar el resize:

```js
const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = rechazar;
    lector.readAsDataURL(archivo);
  });

const cargarImagen = (src) =>
  new Promise((resolver, rechazar) => {
    const imagen = new window.Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = src;
  });

export const prepararImagen = async (
  archivo,
  { maxLado = 720, calidad = 0.86, maxBytesEntrada = 3 * 1024 * 1024 } = {}
) => {
  if (!archivo?.type?.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen valido.');
  }
  if (archivo.size > maxBytesEntrada) {
    const mb = Math.round(maxBytesEntrada / (1024 * 1024));
    throw new Error(`La imagen no debe superar ${mb} MB.`);
  }

  const dataUrl = await leerArchivoComoDataUrl(archivo);
  if (archivo.type === 'image/svg+xml' || typeof document === 'undefined') {
    return dataUrl;
  }

  const imagen = await cargarImagen(dataUrl);
  const escala = Math.min(1, maxLado / imagen.width, maxLado / imagen.height);
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));
  const canvas = document.createElement('canvas');
  const contexto = canvas.getContext('2d');
  canvas.width = ancho;
  canvas.height = alto;
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  return canvas.toDataURL('image/webp', calidad);
};
```

- [ ] **Step 2: Refactorizar `Inventario.jsx` para usar el util**

En `Inventario.jsx`:
1. Agregar el import: `import { prepararImagen } from '../../../utils/imagen';`
2. Borrar las definiciones locales ahora duplicadas: `TAMANO_MAXIMO_IMAGEN` (línea 15), `leerArchivoComoDataUrl` (17-23), `cargarImagen` (25-31) y `prepararImagenProducto` (33-59).
3. Reemplazar la llamada `await prepararImagenProducto(archivo)` por:

```js
await prepararImagen(archivo, { maxLado: 720, calidad: 0.86, maxBytesEntrada: 3 * 1024 * 1024 })
```

(Buscar la llamada con `grep -n "prepararImagenProducto" SpartanGymWeb/src/pages/Admin/sub_pages/Inventario.jsx` antes de editar; debe quedar una sola referencia, la de la invocación.)

- [ ] **Step 3: Verificar lint y build**

Run: `cd SpartanGymWeb && npm run lint && npm run build`
Expected: sin errores; el build de Vite completa.

- [ ] **Step 4: Verificación manual (Inventario intacto)**

`cd SpartanGymWeb && npm run dev`; en Admin → Inventario, crear/editar un producto subiendo una imagen. Confirmar que sigue funcionando igual que antes (resize webp, guardado). Esto valida que la extracción no cambió el comportamiento.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymWeb/src/utils/imagen.js SpartanGymWeb/src/pages/Admin/sub_pages/Inventario.jsx
git commit -m "refactor(web): extraer prepararImagen a util compartido"
```

---

## Task 6: Componente `<Avatar>` + cliente API `actualizarFoto` (web)

**Files:**
- Create: `SpartanGymWeb/src/components/Avatar.jsx`
- Modify: `SpartanGymWeb/src/services/api.js`

**Interfaces:**
- Consumes: `obtenerInicialesCuenta({ name, email }, respaldo)` de `utils/cuentaActual.js`.
- Produces: `export default Avatar` con props `{ fotoUrl, nombre, email, tamano = 40, respaldo = 'US', className = '' }`; `operacionApi.actualizarFoto(fotoUrl)` → PUT que devuelve `{ fotoUrl }`.

- [ ] **Step 1: Crear `components/Avatar.jsx`**

```jsx
import { obtenerInicialesCuenta } from '../utils/cuentaActual';

const Avatar = ({ fotoUrl, nombre, email, tamano = 40, respaldo = 'US', className = '' }) => {
  const estiloTamano = { width: tamano, height: tamano };

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre || 'Foto de perfil'}
        style={{ ...estiloTamano, objectFit: 'cover' }}
        className={`rounded-full ${className}`.trim()}
      />
    );
  }

  const iniciales = obtenerInicialesCuenta({ name: nombre, email }, respaldo);
  return (
    <span
      style={{ ...estiloTamano, fontSize: Math.round(tamano * 0.4) }}
      className={`inline-flex items-center justify-center rounded-full bg-red-600/10 font-black text-red-500 ${className}`.trim()}
    >
      {iniciales}
    </span>
  );
};

export default Avatar;
```

- [ ] **Step 2: Agregar `actualizarFoto` al `operacionApi`**

En `services/api.js`, dentro del objeto `operacionApi = { ... }`, agregar (por ejemplo tras `perfil:`):

```js
  actualizarFoto: (fotoUrl) => apiRequest('/operacion/me/foto', {
    method: 'PUT',
    body: JSON.stringify({ fotoUrl }),
  }),
```

- [ ] **Step 3: Verificar lint y build**

Run: `cd SpartanGymWeb && npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add SpartanGymWeb/src/components/Avatar.jsx SpartanGymWeb/src/services/api.js
git commit -m "feat(web): componente Avatar y cliente operacionApi.actualizarFoto"
```

---

## Task 7: Subida de foto en perfil de admin + avatar del nav

**Files:**
- Modify: `SpartanGymWeb/src/pages/Admin/sub_pages/PerfilAdmin.jsx`
- Modify: `SpartanGymWeb/src/pages/Admin/AdminLayout.jsx`

**Interfaces:**
- Consumes: `prepararImagen` (Tarea 5), `Avatar` (Tarea 6), `operacionApi.actualizarFoto` + `operacionApi.perfil` (Tarea 6/API), `leerCuentaActual`/`guardarCuentaActual` de `utils/cuentaActual.js`.
- Produces: la foto del admin persiste en `cuentaActual.fotoUrl` (localStorage) → el nav (`AdminLayout`) la refleja vía el evento `EVENTO_CUENTA_ACTUAL` y sobrevive un refresh.

> **Nota de diseño (no reabre el spec):** `PerfilAdmin` hoy guarda su perfil en localStorage, no en la API. Para que la foto (a) sobreviva refresh y (b) aparezca en el nav, se persiste `fotoUrl` dentro de `cuentaActual` (mecanismo local ya existente que el nav escucha) además de mandarla al backend con `actualizarFoto`. En el montaje se hidrata desde `operacionApi.perfil()` para reflejar lo que ya haya en el servidor. Esto concreta el "refrescar estado local" que el spec deja abierto.

- [ ] **Step 1: Estado de foto + hidratación desde la API en `PerfilAdmin.jsx`**

Agregar imports:

```js
import { prepararImagen } from '../../../utils/imagen';
import Avatar from '../../../components/Avatar';
```

Agregar estado y carga inicial (junto al resto de `useState`/`useEffect` del componente):

```js
  const [fotoUrl, setFotoUrl] = useState(() => leerCuentaActual().fotoUrl || '');
  const [errorFoto, setErrorFoto] = useState('');

  useEffect(() => {
    operacionApi.perfil()
      .then((datos) => {
        const remota = datos.fotoUrl || '';
        setFotoUrl(remota);
        const cuenta = leerCuentaActual();
        if ((cuenta.fotoUrl || '') !== remota) {
          guardarCuentaActual({ ...cuenta, fotoUrl: remota });
        }
      })
      .catch(() => { /* sin sesión API válida: se queda con el valor local */ });
  }, []);
```

(`leerCuentaActual` y `guardarCuentaActual` ya están importados en este archivo; si no, agregarlos desde `../../../utils/cuentaActual`.)

- [ ] **Step 2: Handlers de cambio y quitar foto**

Agregar dentro del componente:

```js
  const persistirFotoLocal = (nueva) => {
    const cuenta = leerCuentaActual();
    guardarCuentaActual({ ...cuenta, fotoUrl: nueva });
  };

  const cambiarFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setErrorFoto('');
    try {
      const dataUrl = await prepararImagen(archivo, { maxLado: 512, calidad: 0.8, maxBytesEntrada: 5 * 1024 * 1024 });
      await operacionApi.actualizarFoto(dataUrl);
      setFotoUrl(dataUrl);
      persistirFotoLocal(dataUrl);
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo actualizar la foto.');
    }
  };

  const quitarFoto = async () => {
    setErrorFoto('');
    try {
      await operacionApi.actualizarFoto('');
      setFotoUrl('');
      persistirFotoLocal('');
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo quitar la foto.');
    }
  };
```

- [ ] **Step 3: Reemplazar el círculo de iniciales por `<Avatar>` con controles**

En el `<aside>` de la tarjeta de perfil (donde hoy está el `<div>...{iniciales}</div>`, ~línea 275), reemplazar ese `<div>` por:

```jsx
          <div className="mx-auto mt-3 flex flex-col items-center gap-3">
            <Avatar fotoUrl={fotoUrl} nombre={perfil.nombre} email={perfil.correo} tamano={112} respaldo="AD" />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:bg-white/10">
                Cambiar foto
                <input type="file" accept="image/*" className="hidden" onChange={cambiarFoto} />
              </label>
              {fotoUrl && (
                <button
                  type="button"
                  onClick={quitarFoto}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 transition hover:text-white"
                >
                  Quitar foto
                </button>
              )}
            </div>
            {errorFoto && <p className="text-xs text-red-400">{errorFoto}</p>}
          </div>
```

(El `useMemo` de `iniciales` puede quedar; `<Avatar>` calcula sus propias iniciales. Si el linter marca `iniciales` como sin uso tras el cambio, eliminar ese `useMemo`.)

- [ ] **Step 4: Nav de admin muestra `<Avatar>`**

En `AdminLayout.jsx`:
1. Agregar import: `import Avatar from '../../components/Avatar';`
2. En el `<Link to="/admin/perfil" ...>` (~línea 148), reemplazar el contenido `{inicialesCuenta}` por:

```jsx
              <Avatar
                fotoUrl={cuentaActual.fotoUrl}
                nombre={cuentaActual.name || cuentaActual.username}
                email={cuentaActual.email}
                tamano={36}
              />
```

Quitar las clases de fondo/gradiente y texto del `<Link>` que solo servían para el círculo de iniciales (dejar `flex h-9 w-9 items-center justify-center rounded-xl ... hover:...`), ya que `<Avatar>` trae su propio fondo. Si `inicialesCuenta` (useMemo) queda sin uso, eliminarlo para no romper el lint.

- [ ] **Step 5: Verificar lint y build**

Run: `cd SpartanGymWeb && npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 6: Verificación manual**

`npm run dev`, iniciar sesión como admin real (contra la API local), ir a Perfil: subir una foto → aparece en la tarjeta y en el avatar del nav; recargar la página → la foto persiste; "Quitar foto" → vuelve a iniciales en ambos sitios.

- [ ] **Step 7: Commit**

```bash
git add SpartanGymWeb/src/pages/Admin/sub_pages/PerfilAdmin.jsx SpartanGymWeb/src/pages/Admin/AdminLayout.jsx
git commit -m "feat(web): subida de foto en perfil admin y avatar del nav"
```

---

## Task 8: Subida de foto en perfil de recepción

**Files:**
- Modify: `SpartanGymWeb/src/pages/Recepcionista/sub_pages/Perfil.jsx`

**Interfaces:**
- Consumes: `prepararImagen` (Tarea 5), `Avatar` (Tarea 6), `operacionApi.actualizarFoto` (Tarea 6). El componente ya llama `operacionApi.perfil()` en el montaje.
- Produces: la recepcionista sube/quita su foto; la tarjeta de perfil la muestra.

- [ ] **Step 1: Imports y estado de foto**

Agregar imports:

```js
import { prepararImagen } from '../../../utils/imagen';
import Avatar from '../../../components/Avatar';
import { operacionApi } from '../../../services/api';
```

(Verificar los que ya existan; `operacionApi` ya se importa en este archivo.)

Agregar estado:

```js
  const [fotoUrl, setFotoUrl] = useState('');
  const [errorFoto, setErrorFoto] = useState('');
```

- [ ] **Step 2: Hidratar `fotoUrl` desde la respuesta de perfil ya existente**

En el `Promise.allSettled([...]).then(...)` (rama `perfil.status === 'fulfilled'`, ~línea 46), tras `setPerfilActualApi({...})`, agregar:

```js
        setFotoUrl(datos.fotoUrl || '');
```

- [ ] **Step 3: Handlers de cambio/quitar foto**

```js
  const cambiarFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setErrorFoto('');
    try {
      const dataUrl = await prepararImagen(archivo, { maxLado: 512, calidad: 0.8, maxBytesEntrada: 5 * 1024 * 1024 });
      await operacionApi.actualizarFoto(dataUrl);
      setFotoUrl(dataUrl);
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo actualizar la foto.');
    }
  };

  const quitarFoto = async () => {
    setErrorFoto('');
    try {
      await operacionApi.actualizarFoto('');
      setFotoUrl('');
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo quitar la foto.');
    }
  };
```

- [ ] **Step 4: Reemplazar el círculo de iniciales por `<Avatar>` con controles**

En el `<article>` de la tarjeta de perfil (donde hoy está el `<div>...{obtenerInicialesCuenta({ name: perfilActual.nombre, ... }, 'RC')}</div>`, ~línea 118), reemplazar ese `<div>` por:

```jsx
          <Avatar fotoUrl={fotoUrl} nombre={perfilActual.nombre} email={perfilActual.correo} tamano={112} respaldo="RC" />
          <div className="mt-3 flex items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:bg-white/10">
              Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={cambiarFoto} />
            </label>
            {fotoUrl && (
              <button type="button" onClick={quitarFoto} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 transition hover:text-white">
                Quitar foto
              </button>
            )}
          </div>
          {errorFoto && <p className="mt-2 text-xs text-red-400">{errorFoto}</p>}
```

(El otro uso de `obtenerInicialesCuenta` en la línea ~212 —lista de recepcionistas por nombre— **no se toca** en esta tarea; queda fuera del núcleo.)

- [ ] **Step 5: Verificar lint y build**

Run: `cd SpartanGymWeb && npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 6: Verificación manual**

`npm run dev`, iniciar sesión como recepcionista real: subir foto → aparece en la tarjeta; recargar → persiste (viene de `GET /operacion/me`); quitar → vuelve a iniciales.

- [ ] **Step 7: Commit**

```bash
git add SpartanGymWeb/src/pages/Recepcionista/sub_pages/Perfil.jsx
git commit -m "feat(web): subida de foto en perfil de recepcion"
```

---

## Task 9: Avatar en la tabla de socios registrados

**Files:**
- Modify: `SpartanGymWeb/src/components/RegistroSocioCompartido.jsx`

**Interfaces:**
- Consumes: `Avatar` (Tarea 6); `socio.fotoUrl` que ahora trae `SocioResponse` vía `sociosApi.listar()` (Tarea 4).
- Produces: cada fila de la columna "Socio" muestra el avatar (foto o iniciales) junto al nombre.

- [ ] **Step 1: Import de `Avatar`**

Agregar: `import Avatar from './Avatar';`

- [ ] **Step 2: Renderizar el avatar en la celda "Socio"**

En la celda de la columna Socio (~línea 298, hoy `<td className="py-3 pr-4"><p ...>{socio.nombres} {socio.apellidos}</p>...</td>`), envolver el nombre con el avatar:

```jsx
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        fotoUrl={socio.fotoUrl}
                        nombre={`${socio.nombres || ''} ${socio.apellidos || ''}`.trim()}
                        email={socio.email}
                        tamano={36}
                        respaldo="SC"
                      />
                      <div>
                        <p className="font-black text-white">{socio.nombres} {socio.apellidos}</p>
                        {/* conservar aquí el resto del contenido que ya existía en la celda (email/id), si lo hay */}
                      </div>
                    </div>
                  </td>
```

(Antes de editar, mirar el contenido actual completo de esa `<td>` con `sed -n '296,304p' SpartanGymWeb/src/components/RegistroSocioCompartido.jsx` y preservar cualquier subtexto —email o id— dentro del `<div>` de la derecha.)

- [ ] **Step 3: Verificar lint y build**

Run: `cd SpartanGymWeb && npm run lint && npm run build`
Expected: sin errores.

- [ ] **Step 4: Verificación manual**

`npm run dev`, entrar como Admin → Registrar Socio (o Recepción → Registrar Socio, es el mismo componente). En "Socios registrados": un socio con foto muestra su avatar; uno sin foto muestra iniciales.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymWeb/src/components/RegistroSocioCompartido.jsx
git commit -m "feat(web): avatar de socio en la tabla de socios registrados"
```

---

## Task 10: Modelos y API Retrofit (app)

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/AuthModels.kt`
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/SpartanGymApi.kt`

**Interfaces:**
- Consumes: endpoint `PUT /api/operacion/me/foto` (Tarea 3); campos `fotoUrl` en las lecturas (Tarea 4).
- Produces: `PerfilActualResponse.fotoUrl`, `EntrenadorClienteResponse.fotoUrl`; `ActualizarFotoRequest(val fotoUrl: String?)`, `ActualizarFotoResponse(val fotoUrl: String? = null)`; `SpartanGymApi.actualizarFotoPerfil(request): Response<ActualizarFotoResponse>`.

- [ ] **Step 1: Agregar `fotoUrl` a los modelos existentes**

En `AuthModels.kt`, agregar `val fotoUrl: String? = null` como último campo de `PerfilActualResponse` (tras `sucursal`, línea ~48) y de `EntrenadorClienteResponse` (tras `email`, línea ~275).

- [ ] **Step 2: Agregar los DTOs nuevos**

Al final de `AuthModels.kt`:

```kotlin
data class ActualizarFotoRequest(
    val fotoUrl: String?
)

data class ActualizarFotoResponse(
    val fotoUrl: String? = null
)
```

- [ ] **Step 3: Agregar el endpoint al `SpartanGymApi`**

En `SpartanGymApi.kt`, agregar el import que falta junto a los demás de `retrofit2.http`:

```kotlin
import retrofit2.http.PUT
```

Y dentro de la interfaz, agregar:

```kotlin
    @PUT("api/operacion/me/foto")
    suspend fun actualizarFotoPerfil(
        @Body request: ActualizarFotoRequest
    ): Response<ActualizarFotoResponse>
```

- [ ] **Step 4: Compilar Kotlin**

Run: `cd SpartanGymApp && ./gradlew :app:compileDebugKotlin`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit** (descartar binarios de Gradle antes)

```bash
git checkout -- SpartanGymApp/.gradle 2>/dev/null; true
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/AuthModels.kt SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/SpartanGymApi.kt
git commit -m "feat(app): fotoUrl en modelos y endpoint actualizarFotoPerfil"
```

---

## Task 11: `ImagenPerfil.kt` — escalado puro (TDD) + compresión webp

**Files:**
- Create: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/util/ImagenPerfil.kt`
- Test: `SpartanGymApp/app/src/test/java/com/example/spartangymapp/util/ImagenPerfilTest.kt`

**Interfaces:**
- Consumes: nada (la función pura); `android.graphics.Bitmap` + `android.util.Base64` (la de I/O).
- Produces: `fun calcularDimensionesEscaladas(anchoOriginal: Int, altoOriginal: Int, ladoMaximo: Int = 512): Pair<Int, Int>`; `fun comprimirParaPerfil(bitmap: Bitmap): String` → data URL `data:image/webp;base64,...`.

- [ ] **Step 1: Escribir el test que falla** (solo la función pura, mismo criterio que `RotacionQrTest`)

Crear `ImagenPerfilTest.kt`:

```kotlin
package com.example.spartangymapp.util

import org.junit.Assert.assertEquals
import org.junit.Test

class ImagenPerfilTest {

    @Test
    fun `imagen mas ancha que alta se limita a 512 en el lado mayor`() {
        val (ancho, alto) = calcularDimensionesEscaladas(1024, 512)
        assertEquals(512, ancho)
        assertEquals(256, alto)
    }

    @Test
    fun `imagen mas alta que ancha se limita a 512 en el lado mayor`() {
        val (ancho, alto) = calcularDimensionesEscaladas(600, 1200)
        assertEquals(256, ancho)
        assertEquals(512, alto)
    }

    @Test
    fun `imagen ya menor a 512 no se agranda`() {
        val (ancho, alto) = calcularDimensionesEscaladas(300, 200)
        assertEquals(300, ancho)
        assertEquals(200, alto)
    }

    @Test
    fun `imagen cuadrada mayor a 512 se escala a 512x512`() {
        val (ancho, alto) = calcularDimensionesEscaladas(1000, 1000)
        assertEquals(512, ancho)
        assertEquals(512, alto)
    }
}
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `cd SpartanGymApp && ./gradlew :app:testDebugUnitTest --tests "com.example.spartangymapp.util.ImagenPerfilTest"`
Expected: FAIL (no existe `calcularDimensionesEscaladas`).

- [ ] **Step 3: Implementar `ImagenPerfil.kt`**

```kotlin
package com.example.spartangymapp.util

import android.graphics.Bitmap
import android.util.Base64
import java.io.ByteArrayOutputStream

/**
 * Calcula (ancho, alto) escalados para que el lado mayor no supere `ladoMaximo`,
 * manteniendo la proporción. No agranda imágenes ya menores. Función pura, sin
 * dependencias de Android, para poder testearla sin dispositivo (mismo criterio
 * que RotacionQr/RotacionQrTest).
 */
fun calcularDimensionesEscaladas(
    anchoOriginal: Int,
    altoOriginal: Int,
    ladoMaximo: Int = 512
): Pair<Int, Int> {
    if (anchoOriginal <= 0 || altoOriginal <= 0) return Pair(1, 1)
    val ladoMayor = maxOf(anchoOriginal, altoOriginal)
    if (ladoMayor <= ladoMaximo) return Pair(anchoOriginal, altoOriginal)
    val escala = ladoMaximo.toDouble() / ladoMayor
    val ancho = maxOf(1, Math.round(anchoOriginal * escala).toInt())
    val alto = maxOf(1, Math.round(altoOriginal * escala).toInt())
    return Pair(ancho, alto)
}

/**
 * Comprime un bitmap a webp base64 (data URL) listo para PUT /operacion/me/foto.
 * Usa la constante WEBP (deprecada desde API 30 pero no eliminada) y NO WEBP_LOSSY
 * (API 30+), porque minSdk = 24.
 */
fun comprimirParaPerfil(bitmap: Bitmap): String {
    val (ancho, alto) = calcularDimensionesEscaladas(bitmap.width, bitmap.height)
    val escalado = Bitmap.createScaledBitmap(bitmap, ancho, alto, true)
    val salida = ByteArrayOutputStream()
    @Suppress("DEPRECATION")
    escalado.compress(Bitmap.CompressFormat.WEBP, 80, salida)
    val base64 = Base64.encodeToString(salida.toByteArray(), Base64.NO_WRAP)
    return "data:image/webp;base64,$base64"
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `cd SpartanGymApp && ./gradlew :app:testDebugUnitTest --tests "com.example.spartangymapp.util.ImagenPerfilTest"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit** (descartar binarios de Gradle antes)

```bash
git checkout -- SpartanGymApp/.gradle 2>/dev/null; true
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/util/ImagenPerfil.kt SpartanGymApp/app/src/test/java/com/example/spartangymapp/util/ImagenPerfilTest.kt
git commit -m "feat(app): util de imagen de perfil (escalado puro testeado + webp)"
```

---

## Task 12: Mostrar la foto en la credencial del socio

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PerfilCredencial.kt`
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt`

**Interfaces:**
- Consumes: `perfilActual?.fotoUrl` (Tarea 10); `cargarImagenConfiguracion(source): Bitmap?` (ya existe en `PerfilCredencial.kt`, decodifica data URLs base64).
- Produces: `CredencialSistemaCard(..., fotoUrl: String? = null)` propagado a `CredencialPantallaIntegrada` y a la variante de hoja inferior; cuando `fotoUrl != null` se muestra la foto en el círculo de identidad, si no se conserva el contenido actual.

> **Anclaje:** el socio ve `CredencialSistemaCard(integradaPantalla = true)` → `CredencialPantallaIntegrada`, cuyo círculo superior de 84.dp hoy muestra el **logo del gym** (`LogoConfiguracion`). La otra variante (hoja inferior) muestra un `Icon(Icons.Outlined.CameraAlt)`. En ambas, la regla es: si hay `fotoUrl`, mostrar la foto de la persona; si es null, dejar el contenido actual intacto (el spec: "si es null, mantiene el comportamiento actual, sin tocar esa rama").

- [ ] **Step 1: Helper composable para la foto de perfil en la credencial**

En `PerfilCredencial.kt`, agregar un composable reutilizable (cerca de `LogoConfiguracion`, ~línea 627). Reutiliza `cargarImagenConfiguracion` y hace fallback al contenido actual vía un slot:

```kotlin
@Composable
private fun FotoPerfilCredencial(
    fotoUrl: String?,
    modifier: Modifier = Modifier,
    respaldo: @Composable () -> Unit
) {
    val fuente = fotoUrl?.trim()?.takeIf { it.isNotBlank() }
    var imageBitmap by remember(fuente) {
        mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null)
    }
    LaunchedEffect(fuente) {
        imageBitmap = if (fuente == null) null
        else withContext(Dispatchers.IO) { cargarImagenConfiguracion(fuente)?.asImageBitmap() }
    }
    val imagen = imageBitmap
    if (imagen != null) {
        Image(
            bitmap = imagen,
            contentDescription = "Foto de perfil",
            contentScale = ContentScale.Crop,
            modifier = modifier.fillMaxSize()
        )
    } else {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            respaldo()
        }
    }
}
```

- [ ] **Step 2: Propagar `fotoUrl` por las firmas**

Agregar el parámetro `fotoUrl: String? = null` a:
1. `CredencialSistemaCard(...)` (línea 57), y pasarlo en ambas ramas: a `CredencialPantallaIntegrada(fotoUrl = fotoUrl, ...)` y a la variante de hoja inferior.
2. `CredencialPantallaIntegrada(...)` (línea 235).
3. La composable de la hoja inferior (la que contiene el `Icon(Icons.Outlined.CameraAlt)` de la línea ~148).

- [ ] **Step 3: Usar la foto en el círculo de identidad (variante integrada)**

En `CredencialPantallaIntegrada`, dentro del `Surface` de 84.dp (línea ~289), reemplazar la llamada directa a `LogoConfiguracion(...)` por el helper, dejando el logo como respaldo:

```kotlin
                FotoPerfilCredencial(
                    fotoUrl = fotoUrl,
                    modifier = Modifier.fillMaxSize()
                ) {
                    LogoConfiguracion(
                        source = logo,
                        fallbackTint = apariencia.textMuted,
                        modifier = Modifier.padding(10.dp)
                    )
                }
```

- [ ] **Step 4: Usar la foto en el círculo de identidad (variante hoja inferior)**

En la composable de hoja inferior, dentro del `Surface` con el `Icon(Icons.Outlined.CameraAlt)` (línea ~140-155), envolver el `Icon` actual como respaldo del helper:

```kotlin
                        FotoPerfilCredencial(
                            fotoUrl = fotoUrl,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.CameraAlt,
                                contentDescription = null,
                                tint = Color(0xFF7E8796),
                                modifier = Modifier.size(27.dp)
                            )
                        }
```

- [ ] **Step 5: Pasar `perfilActual?.fotoUrl` desde `PantallaUsuario`**

Ubicar la envoltura que llama `CredencialSistemaCard(... integradaPantalla = true ...)` para el socio (función alrededor de la línea 2009 y su llamador que pasa `nombre`, `correo`, etc.). Propagar `fotoUrl` desde `perfilActual?.fotoUrl` hasta esa llamada: agregar el parámetro a la función wrapper y pasar `fotoUrl = fotoUrl` a `CredencialSistemaCard`. En el sitio donde se invoca ese wrapper (sección "credencial" del socio, ~línea 358-366 donde ya se leen `perfilActual?.email`, etc.), pasar `fotoUrl = perfilActual?.fotoUrl`.

- [ ] **Step 6: Compilar**

Run: `cd SpartanGymApp && ./gradlew :app:compileDebugKotlin`
Expected: BUILD SUCCESSFUL. (Revisar que los imports `Image`, `ContentScale`, `asImageBitmap`, `Dispatchers`, `withContext`, `LaunchedEffect`, `mutableStateOf`, `remember` ya estén en el archivo — lo están para `LogoConfiguracion`.)

- [ ] **Step 7: Commit** (descartar binarios de Gradle antes)

```bash
git checkout -- SpartanGymApp/.gradle 2>/dev/null; true
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PerfilCredencial.kt SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt
git commit -m "feat(app): mostrar foto de perfil en la credencial del socio"
```

---

## Task 13: Subida de foto del socio (Photo Picker, optimista + reversión)

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt`

**Interfaces:**
- Consumes: `comprimirParaPerfil(bitmap)` (Tarea 11); `RetrofitClient.apiService.actualizarFotoPerfil(ActualizarFotoRequest(...))` (Tarea 10); `PerfilActualResponse.copy(fotoUrl = ...)`.
- Produces: el socio elige una imagen con el Android Photo Picker; el estado `perfilActual` se actualiza de forma optimista y se revierte si la respuesta HTTP no es exitosa (mismo patrón que `marcarEjercicioCompletado`, commit `0c42036`).

- [ ] **Step 1: Imports necesarios**

Confirmar/añadir en `PantallaUsuario.kt` (ya están `rememberLauncherForActivityResult` línea 7, y `ContextCompat`/`LocalContext` para la cámara). Añadir los que falten:

```kotlin
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import android.graphics.BitmapFactory
import com.example.spartangymapp.network.ActualizarFotoRequest
import com.example.spartangymapp.util.comprimirParaPerfil
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
```

- [ ] **Step 2: Launcher del Photo Picker + handler de subida**

Dentro del composable de la pantalla del socio (donde viven `perfilActual`, `scope`, `error`; junto al bloque de estado ~línea 187-200), agregar:

```kotlin
    val context = LocalContext.current
    val seleccionarFoto = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        val fotoAnterior = perfilActual?.fotoUrl
        scope.launch {
            val dataUrl = try {
                withContext(Dispatchers.IO) {
                    val bitmap = context.contentResolver.openInputStream(uri).use {
                        BitmapFactory.decodeStream(it)
                    } ?: throw java.io.IOException("No se pudo leer la imagen.")
                    comprimirParaPerfil(bitmap)
                }
            } catch (_: Exception) {
                error = "No se pudo procesar la imagen."
                return@launch
            }
            // Optimista
            perfilActual = perfilActual?.copy(fotoUrl = dataUrl)
            try {
                val resp = RetrofitClient.apiService.actualizarFotoPerfil(ActualizarFotoRequest(dataUrl))
                if (!resp.isSuccessful) throw java.io.IOException("HTTP ${resp.code()}")
            } catch (_: Exception) {
                // Revertir
                perfilActual = perfilActual?.copy(fotoUrl = fotoAnterior)
                error = "No se pudo actualizar la foto."
            }
        }
    }
```

(Si `error`/`scope` tienen otros nombres en ese composable, ajustarlos a los reales; `scope` es el `rememberCoroutineScope()` ya usado para `marcarEjercicioCompletado`.)

- [ ] **Step 3: Botón para lanzar el selector**

En la UI del perfil/credencial del socio, agregar un botón que dispare el selector (por ejemplo bajo la credencial). Usar el launcher:

```kotlin
                Button(onClick = {
                    seleccionarFoto.launch(
                        androidx.activity.result.PickVisualMediaRequest(
                            ActivityResultContracts.PickVisualMedia.ImageOnly
                        )
                    )
                }) {
                    Text("Cambiar foto de perfil")
                }
```

Colocarlo en la sección donde el socio ve su credencial (cerca de la llamada del wrapper de credencial de la Tarea 12). Ajustar el estilo/`Modifier` al look existente de esa pantalla.

- [ ] **Step 4: Compilar**

Run: `cd SpartanGymApp && ./gradlew :app:compileDebugKotlin`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Verificación manual** (si hay dispositivo/emulador contra la API local)

Socio elige una foto → la credencial la muestra de inmediato (optimista); tras recargar el perfil, sigue (viene de `GET /operacion/me`). Si la API está caída, la foto vuelve al estado anterior y aparece el mensaje de error.

- [ ] **Step 6: Commit** (descartar binarios de Gradle antes)

```bash
git checkout -- SpartanGymApp/.gradle 2>/dev/null; true
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt
git commit -m "feat(app): socio sube su foto de perfil (optimista con reversion)"
```

---

## Task 14: Foto de clientes en "Mis Clientes" (entrenador)

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/Pantallaentrenador.kt`

**Interfaces:**
- Consumes: `EntrenadorClienteResponse.fotoUrl` (Tarea 10); `cargarImagenConfiguracion(source): Bitmap?` (público-`internal` en `PerfilCredencial.kt`, mismo paquete `ui.screen`, accesible directo).
- Produces: cada item de `TabClientes` muestra la foto del socio si `fotoUrl != null`, si no conserva el círculo de iniciales de color actual.

- [ ] **Step 1: Imports para decodificar/mostrar**

Confirmar/añadir en `Pantallaentrenador.kt`:

```kotlin
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
```

- [ ] **Step 2: Renderizar la foto en el círculo del item**

En `TabClientes` (línea ~272), dentro del `items(clientes) { c -> ... }`, reemplazar el `Box` del avatar de iniciales (el que hoy contiene `Text(ini, ...)`, ~línea 300) por un bloque que muestre la foto si existe:

```kotlin
                            val fotoCliente = c.fotoUrl?.trim()?.takeIf { it.isNotBlank() }
                            var bitmapCliente by remember(fotoCliente) {
                                mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null)
                            }
                            LaunchedEffect(fotoCliente) {
                                bitmapCliente = if (fotoCliente == null) null
                                else withContext(Dispatchers.IO) {
                                    cargarImagenConfiguracion(fotoCliente)?.asImageBitmap()
                                }
                            }
                            Box(Modifier.size(44.dp).background(ap.soft, CircleShape), contentAlignment = Alignment.Center) {
                                val imagenCliente = bitmapCliente
                                if (imagenCliente != null) {
                                    Image(
                                        bitmap = imagenCliente,
                                        contentDescription = "Foto de ${c.nombres ?: ""}",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.size(44.dp).clip(CircleShape)
                                    )
                                } else {
                                    Text(ini, color = ap.accent, fontWeight = FontWeight.Black, fontSize = 15.sp)
                                }
                            }
```

(Mantener el cálculo de `ini` que ya existe justo arriba. Confirmar que `clip`, `CircleShape`, `Image` estén importados; `CircleShape` e `Image` ya se usan en este archivo.)

- [ ] **Step 3: Compilar**

Run: `cd SpartanGymApp && ./gradlew :app:compileDebugKotlin`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Verificación manual** (si hay dispositivo/emulador)

Como entrenador, en "Mis Clientes": un socio con foto muestra su avatar; uno sin foto mantiene el círculo de iniciales de color.

- [ ] **Step 5: Commit** (descartar binarios de Gradle antes)

```bash
git checkout -- SpartanGymApp/.gradle 2>/dev/null; true
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/Pantallaentrenador.kt
git commit -m "feat(app): foto de socio en Mis Clientes del entrenador"
```

---

## Verificación end-to-end final (antes de cerrar la feature)

No es una tarea de código; es el gate de cierre que exige el spec (sección 6). Ejecutar tras la Tarea 14.

- [ ] **API:** `cd SpartanGymAPI && ./mvnw test` en verde + boot local (perfil `local`) + un `PUT /api/operacion/me/foto` real con token válido; confirmar que persiste en la fila `usuarios.foto_url` y que `GET /operacion/me` lo refleja. Confirmar que un `data:` inválido (p. ej. `https://...`) devuelve `400` con "La foto debe ser una imagen válida.".
- [ ] **Web:** `cd SpartanGymWeb && npm run build` OK. Con `npm run dev`: subir foto como admin y como recepcionista → aparece y sobrevive refresh; nav de admin muestra el avatar; tabla de `RegistroSocioCompartido` muestra avatar de un socio con foto e iniciales de uno sin foto.
- [ ] **App:** `cd SpartanGymApp && ./gradlew assembleDebug testDebugUnitTest` en verde. Si hay forma de correr contra la API local: socio elige foto → sube → credencial la muestra tras recargar; entrenador ve la foto en "Mis Clientes".
- [ ] **Deploy checklist:** aplicar a mano en Neon `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;` antes de desplegar la API. Recompilar y redistribuir el APK para que los testers tengan la feature.
