# Diseño: foto de perfil (socio y personal)

Rama: `claude/cleanup-branches-context-7266db` (base: `main` en `e96f0b9`,
que ya incluye el fix de `JWT_SECRET` mergeado antes de este spec)

## Contexto y problema

Fase 4 pendiente desde la sesión de progreso+cardio: hoy ningún usuario (socio
ni personal) tiene foto. El único ícono de "foto" en toda la app es decorativo,
en `SpartanGymWeb/src/pages/Recepcionista/sub_pages/CheckIn.jsx`, sin backend
detrás. Donde se necesita mostrar una identidad visual, se usan iniciales en un
círculo de color, calculadas con `obtenerInicialesCuenta` (ya existe en
`SpartanGymWeb/src/utils/cuentaActual.js` y se usa hoy con nombres arbitrarios,
no solo la cuenta logueada — ver `Perfil.jsx:212`).

## Decisiones tomadas (con el usuario, durante brainstorming)

1. **Modelo:** columna `foto_url TEXT` en `usuarios`, compartida entre
   `Socio` y `Personal` vía la relación `@MapsId` existente — no se duplica
   por tipo. Mismo patrón que `productos_inventario.imagen_url`: base64
   (data URL) directo en la columna, resize a webp en el cliente antes de
   enviar. Sin S3 ni storage nuevo (decisión ya tomada en la sesión anterior,
   no reabierta aquí).
2. **Cada quien sube la suya, desde donde ya edita su perfil.** El socio
   sube/cambia su foto desde la app (su único punto de edición de perfil
   hoy). El personal la sube desde su perfil web (`PUT /api/personal/me` ya
   existe). **Nadie edita la foto de otro usuario.** Se descarta explícitamente
   que recepción/staff puedan poner la foto de un socio — eso requeriría crear
   edición de socio por parte de staff, que no existe hoy, y se decidió no
   abrir ese alcance en esta fase.
3. **Endpoint único y dedicado:** `PUT /api/operacion/me/foto`, sobre
   `OperacionController` (que ya sirve `GET /me` a socio y personal por
   igual). Se prefirió sobre "doblar" el campo en los PUTs existentes de
   staff porque el socio no tiene ningún PUT de edición hoy, y crear uno
   solo para la foto sin abrir edición general de su perfil es más simple
   que crear un PUT de edición completa del socio de la nada. También se
   descartó duplicar el endpoint por rol (`/personal/me/foto` +
   `/socios/me/foto`) porque ambos tocarían el mismo campo en `Usuario` con
   lógica idéntica.
4. **Tamaño:** cliente redimensiona a máx. 512px de lado mayor, webp calidad
   0.8; tope de archivo de entrada 5MB antes de procesar; guard en servidor
   que rechaza `fotoUrl` > ~700.000 caracteres (~512KB decodificado) para no
   depender solo de que el cliente se porte bien.
5. **Dónde se muestra ("núcleo bien hecho", ni mínimo ni cobertura total):**
   perfil propio (única superficie de subida: socio en app, staff en web),
   avatar de staff en el nav web, "Mis Clientes" del entrenador (app), y el
   listado de socios (`RegistroSocioCompartido.jsx` — **ver nota de
   descubrimiento abajo**, es una sola tabla compartida por Admin y
   Recepción, no dos). Fuera: Pagos, Asistencias, CheckIn.
6. **De-duplicación explícita (confirmada con el usuario), mismo criterio
   que `RutinaResponseMapper`:** el helper de resize/webp que hoy vive
   *local* en `Inventario.jsx` se extrae a un util compartido en vez de
   copiarse; se crea un componente `<Avatar>` en vez de repetir el
   `{fotoUrl ? <img> : <iniciales>}` en cada sitio que lo necesite.

### Nota de descubrimiento (corrige una imprecisión de la presentación previa)

Durante la exploración se asumió que "el listado de socios de Admin" y "la
tabla de socios de Recepción" eran dos pantallas distintas a tocar por
separado. **Son el mismo componente:** tanto
`SpartanGymWeb/src/pages/Admin/sub_pages/Socioadm.jsx` como
`SpartanGymWeb/src/pages/Recepcionista/sub_pages/RegistrarSocio.jsx` son
wrappers finos que renderizan `RegistroSocioCompartido.jsx` con distinto
título/subtítulo. La tabla de socios registrados vive una sola vez ahí. Esto
no cambia el alcance ("núcleo"), solo reduce el trabajo real: es un archivo,
no dos.

## Diseño

### 1. Schema SQL (aplicado a mano en Neon, `spring.jpa.hibernate.ddl-auto=none`)

```sql
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS foto_url TEXT;
```

Se agrega también al `CREATE TABLE usuarios` en `spartan_gym_schema.sql` para
que una base nueva la tenga desde cero, igual que se hizo con
`productos_inventario.imagen_url` (líneas 296 y 301-305 de ese archivo).

### 2. API (`SpartanGymAPI`)

**Entidad:** `Usuario.java` — agregar

```java
@Column(name = "foto_url", columnDefinition = "TEXT")
private String fotoUrl;
```

**DTO nuevo** `ActualizarFotoRequest`:

```java
@Data
public class ActualizarFotoRequest {
    private String fotoUrl; // null o "" = quitar la foto
}
```

**Endpoint** en `OperacionController`:

```java
@PutMapping("/me/foto")
@Transactional
public ResponseEntity<Map<String, Object>> actualizarFoto(
        @RequestBody ActualizarFotoRequest request, Authentication auth) {
    Usuario usuario = usuarioAutenticado(auth);
    usuario.setFotoUrl(validarFotoUrl(request.getFotoUrl()));
    usuarioRepository.save(usuario);
    return ResponseEntity.ok(Map.of("fotoUrl",
            usuario.getFotoUrl() == null ? "" : usuario.getFotoUrl()));
}
```

Sin `@PreAuthorize` de rol — cualquier usuario autenticado (socio o
personal) puede llamarlo, y solo afecta a `usuarioAutenticado(auth)`, nunca
a un `usuarioId` recibido por parámetro. No hay forma de que un usuario
cambie la foto de otro por este endpoint.

**Validación** (`validarFotoUrl`, método aislado y testeable sin mockear
la capa web ni la base de datos):

- `null` o blank → devuelve `null` (borra la foto).
- Si no empieza con `data:image/` → `RuntimeException("La foto debe ser una
  imagen válida.")`.
  (Evita URLs externas arbitrarias en la columna: ni hotlinking ni vector de
  XSS si algún día se renderiza fuera de un `<img src>` controlado.)
- Si `length() > 700_000` → `RuntimeException("La imagen es demasiado
  grande.")`.
- Devuelve el valor recibido sin más transformación si pasa ambas.

Se usa `RuntimeException` plano (no `IllegalArgumentException`) porque es la
convención exacta que ya siguen todos los servicios del proyecto (`SocioService`,
`PersonalService`, `AuthService`, etc.) y `GlobalExceptionHandler.java` ya
tiene un `@ExceptionHandler(RuntimeException.class)` genérico que la traduce
a `400` con el mensaje tal cual — confirmado leyendo
`controllers/GlobalExceptionHandler.java`, no hace falta agregar nada nuevo
ahí.

**Lecturas — agregar `fotoUrl` a:**

- `OperacionController.usuarioBase()` → cubre `GET /operacion/me` (socio y
  personal) y `GET /operacion/entrenador/perfil` (hereda de `usuarioBase`).
- `OperacionController.socioMap()` → cubre `GET /operacion/entrenador/clientes`
  (Mis Clientes).
- `SocioResponse` (agregar campo `fotoUrl`) + `SocioService.mapearSocio()`
  → cubre `GET /api/socios` (la tabla compartida de
  `RegistroSocioCompartido.jsx`).

`PersonalResponse` **no** se toca — esa lista es de staff gestionando staff
(`PersonalController.listar`), fuera del núcleo acordado.

### 3. Web (`SpartanGymWeb`)

**Refactor de-duplicación (confirmado):**

- `src/utils/imagen.js` (nuevo): extraer de `Inventario.jsx` la función que
  hoy hace `leerArchivoComoDataUrl` + `cargarImagen` + resize por canvas +
  `toDataURL('image/webp', calidad)`, parametrizada como
  `prepararImagen(archivo, { maxLado, calidad, maxBytesEntrada })`.
  `Inventario.jsx` pasa a importarla con sus mismos valores actuales
  (`maxLado: 720, calidad: 0.86, maxBytesEntrada: 3MB`) — su comportamiento
  no cambia. El nuevo flujo de foto de perfil la llama con
  `{ maxLado: 512, calidad: 0.8, maxBytesEntrada: 5MB }`.
- `src/components/Avatar.jsx` (nuevo): `<Avatar fotoUrl nombre email
  tamano respaldo />`. Si `fotoUrl` está presente, renderiza `<img
  src={fotoUrl} />`; si no, renderiza el círculo de iniciales reutilizando
  `obtenerInicialesCuenta({ name: nombre, email }, respaldo)` de
  `utils/cuentaActual.js` (ya soporta nombre arbitrario, no solo la sesión
  activa — no se reescribe ese algoritmo).

**API client** (`src/services/api.js`): agregar a `operacionApi`:

```js
actualizarFoto: (fotoUrl) => apiRequest('/operacion/me/foto', {
  method: 'PUT',
  body: JSON.stringify({ fotoUrl }),
}),
```

**Subida (staff, en su propio perfil):**

- `PerfilAdmin.jsx` y `Recepcionista/sub_pages/Perfil.jsx`: agregar control
  de archivo + preview + botón "Quitar foto" junto al círculo de iniciales
  existente (que pasa a ser el fallback dentro de `<Avatar>`). Al
  seleccionar: `prepararImagen` → `operacionApi.actualizarFoto` → refrescar
  estado local.

**Mostrar:**

- `AdminLayout.jsx` (avatar del nav, hoy `{inicialesCuenta}` en
  `PerfilAdmin.jsx:276` y `AdminLayout.jsx:153`) → `<Avatar>`.
- `RegistroSocioCompartido.jsx`: columna "Socio" de la tabla → `<Avatar>`
  junto al nombre, usando el `fotoUrl` que ahora trae `SocioResponse`.

Sin infra de test JS en el repo (`package.json` solo tiene `vite`/`eslint`,
sin vitest/jest) → verificación de la web es **manual**, no automatizada.

### 4. App Android (`SpartanGymApp`)

**Modelos** (`network/AuthModels.kt`): agregar `val fotoUrl: String? = null`
a `PerfilActualResponse` y a `EntrenadorClienteResponse`.

**API** (`network/SpartanGymApi.kt`):

```kotlin
@PUT("api/operacion/me/foto")
suspend fun actualizarFotoPerfil(
    @Body request: ActualizarFotoRequest
): Response<ActualizarFotoResponse>
```

con `ActualizarFotoRequest(val fotoUrl: String?)` y
`ActualizarFotoResponse(val fotoUrl: String? = null)` en el archivo de
modelos correspondiente.

**Subida (solo socio, desde su credencial):**

- Selector con Android Photo Picker
  (`rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia())`)
  — no requiere permiso runtime ni dependencia nueva (`androidx.activity.compose`
  ya está en `build.gradle.kts:47`).
- Util nuevo `util/ImagenPerfil.kt`, separando **cálculo puro** de I/O de
  bitmap (mismo criterio que `util/RotacionQr.kt` con `RotacionQrTest`):
  - Función pura `calcularDimensionesEscaladas(anchoOriginal, altoOriginal,
    ladoMaximo = 512): Pair<Int, Int>` — testeable sin Android.
  - Función de I/O `comprimirParaPerfil(bitmap: Bitmap): String` que usa
    esas dimensiones, hace `Bitmap.createScaledBitmap`,
    `Bitmap.compress(Bitmap.CompressFormat.WEBP, 80, ...)` y arma el
    `data:image/webp;base64,...` con `android.util.Base64` (ya se usa en
    `PerfilCredencial.kt` para decodificar, aquí se usa para codificar).
    Se usa la constante `WEBP` (deprecada desde API 30, no eliminada) y no
    `WEBP_LOSSY` (API 30+) porque `minSdk = 24`
    (`SpartanGymApp/app/build.gradle.kts:16`) — `WEBP_LOSSY` no existe en
    dispositivos con Android 9-10, y este spec no introduce lógica
    condicional por versión de SDK solo para esto.
- Al confirmar selección: actualización optimista del estado local +
  llamada a `actualizarFotoPerfil` + reversión si la respuesta HTTP no es
  exitosa (mismo patrón ya establecido para
  `marcarEjercicioCompletado`/`0c42036`).

**Mostrar:**

- `PerfilCredencial.kt`: decodificar `fotoUrl` (si no es null) con
  `BitmapFactory` + `Base64.decode` (ya importados en ese archivo) y
  mostrarla en el círculo de la credencial; si es null, mantiene el
  comportamiento actual (iniciales/ícono, sin tocar esa rama).
- `Pantallaentrenador.kt` (`TabClientes`, línea 272): cada item de
  `EntrenadorClienteResponse` en el `LazyColumn` muestra la foto si
  `fotoUrl != null`, si no mantiene el círculo de color actual.

### 5. Testing

- **API (TDD):** `JwtServiceTest.java` como referencia de estilo —
  `ActualizarFotoValidatorTest` (o test directo sobre el método aislado de
  validación): acepta `data:image/webp;base64,AAAA`; rechaza
  `https://ejemplo.com/foto.png` (no es data URL); rechaza un string de más
  de 700.000 caracteres; `null`/`""` devuelve `null` sin lanzar. Sin mockear
  repositorios para esta parte — es lógica pura de validación.
  Adicionalmente, un test de servicio/controller (con `@Mock` de
  `UsuarioRepository`, mismo estilo que `EjercicioCompletadoServiceTest`)
  que confirma que `actualizarFoto` solo modifica al usuario resuelto por
  `Authentication`, nunca otro.
- **App:** `ImagenPerfilTest.kt` sobre `calcularDimensionesEscaladas` —
  imagen más ancha que alta se recorta a 512 de lado mayor manteniendo
  proporción; imagen ya menor a 512 no se agranda; caso cuadrado.
  `comprimirParaPerfil` (I/O real de Bitmap) queda cubierto por build +
  prueba manual, igual que el resto del pipeline de imagen en la app hoy.
- **Web:** manual — no hay runner de test JS en el proyecto.

### 6. Verificación end-to-end antes de cerrar (no solo build/tests)

- API: `mvnw test` en verde + boot local (`spring-boot:run`, perfil
  `local`) + `PUT /api/operacion/me/foto` real con un token válido,
  confirmando persistencia en la fila y que `GET /operacion/me` la refleja.
- Web: `npm run dev`, subir foto como staff, confirmar que aparece en el
  nav y sobrevive un refresh; confirmar que la tabla de
  `RegistroSocioCompartido` muestra el avatar de un socio con foto y las
  iniciales de uno sin foto.
- App: build (`gradlew assembleDebug testDebugUnitTest`), y si hay forma de
  correrla contra la API local, ejercitar el flujo real: socio elige foto →
  sube → la credencial la muestra tras recargar; entrenador ve la foto en
  Mis Clientes.

## Fuera de alcance de este spec

- Recorte/crop manual de la imagen (solo resize automático a máximo lado).
- Que staff (recepción/admin) suba o cambie la foto de un socio — requeriría
  edición de socio por staff, que no existe hoy; explícitamente descartado
  en la decisión 2.
- Avatares en Pagos, Asistencias o CheckIn.
- Edición general del perfil del socio (nombres, teléfono, etc. vía self
  edit) — la foto es el único campo que el socio puede editar de sí mismo
  en esta fase; abrir edición general del perfil del socio queda para una
  fase futura si se decide.
- Storage externo (S3/Cloudinary/similar) — se reafirma la decisión previa
  de base64 en columna `TEXT`.
