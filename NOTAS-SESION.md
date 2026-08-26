# Notas de sesión — pendientes de investigar en el entorno

## Fuga de escritura entre worktrees (patrón recurrente, no incidente aislado)

**Estado: sin investigar la causa raíz. Ocurrió dos veces en la misma sesión (2026-08-19/20), en tareas distintas, con síntomas distintos.**

Durante la implementación de la feature "foto de perfil" (plan
`docs/superpowers/plans/2026-08-19-foto-perfil.md`, ejecutada con
subagentes vía `superpowers:subagent-driven-development`), el checkout
principal de este repo (`main`, en
`C:/Users/gaboe/Documents/PoyectoFInalPOOII/SpartanGymResolve/SpartanGym1/SpartanGym`)
recibió escrituras que correspondían al trabajo de un subagente que
debía estar operando exclusivamente en un worktree distinto
(`.claude/worktrees/spartangym-context-review-549f66`, rama
`claude/spartangym-context-review-549f66`), a pesar de que cada
subagente recibió instrucciones explícitas de `cd` al worktree correcto
y de verificar `pwd` + `git rev-parse --abbrev-ref HEAD` antes de tocar
archivos.

**Ocurrencia 1 (Task 2 — validador de foto de perfil):** el subagente
terminó haciendo un **commit real** (`81cff8f`) sobre `main` en el
checkout principal, en vez de sobre la rama de la feature. Se detectó
porque `git log --oneline -1` en `main` mostró un commit inesperado.
Recuperación: se extrajo el contenido de los archivos del commit
huérfano, se reescribieron a mano en el worktree correcto, se
verificaron los tests, se commiteó de nuevo ahí, y se revirtió `main` a
su estado previo (`git stash` + `git reset --mixed` + limpieza de
archivos sueltos — el `reset --hard` fue bloqueado por el clasificador
de auto mode del harness, `reset --mixed` sí funcionó).

**Ocurrencia 2 (Task 4 — exponer `fotoUrl` en lecturas):** esta vez
**no hubo commit** en `main`, solo cambios sin commitear en el working
tree de 3 archivos (`OperacionController.java`, `SocioResponse.java`,
`SocioService.java`), con contenido idéntico al de la tarea. No se
detectó hasta el momento del merge final, porque la verificación
post-tarea de cada dispatch solo chequeaba `git log --oneline -1` en
`main` (¿se movió el commit?), nunca `git status` (¿hay working tree
sucio?). Un `git stash` normal no logró limpiar estos 3 archivos del
working tree de `main` en el primer intento — quedaron con el mismo
diff después del stash, con el mismo `mtime` que antes, lo que sugiere
que la restauración post-stash no se aplicó correctamente para esos
archivos (posible interacción con `core.autocrlf=true`, activo en este
repo). Se resolvió con `git checkout HEAD -- <archivo>` explícito por
archivo, que sí forzó la reescritura (confirmado por cambio de
`mtime`).

### Lo que se sabe

- Pasó con subagentes distintos, en tareas distintas, con manifestaciones
  distintas (commit real vs. working tree sucio). No es un caso aislado
  de un subagente "confundido" una sola vez.
- Las instrucciones explícitas de verificación de `pwd`/rama antes de
  escribir (agregadas a partir de la Ocurrencia 1) no impidieron la
  Ocurrencia 2 — o el subagente de Task 4 nunca llegó a violar esa
  verificación y el problema está en otra capa (herramienta de
  edición/escritura del harness operando sobre una ruta distinta a la
  que el propio subagente cree estar usando), o la escritura sucia
  ocurrió por un mecanismo que no pasa por los comandos que el
  subagente reporta haber ejecutado.
- El fallo de `git stash` para restaurar limpiamente esos 3 archivos
  específicos (mismo diff, mismo `mtime`, después de un stash
  "exitoso") es en sí mismo un dato relevante, no solo una casualidad
  del momento — sugiere que algo (agente de build, IDE, o el propio
  mecanismo de escritura del harness) puede estar re-escribiendo esos
  archivos de forma que el working tree normal de git no captura bien
  con una sola pasada de `stash`.

### Lo que falta investigar

- Si el harness que orquesta los subagentes (Claude Code / Claude Agent
  SDK) tiene algún mecanismo de resolución de rutas relativas al
  directorio del repo raíz en vez de al worktree activo del subagente,
  que explique por qué una escritura "en el worktree correcto" termina
  aterrizando físicamente en el checkout principal.
- Si hay un proceso vivo (Gradle daemon, Android Studio, un file
  watcher) con el checkout principal abierto que pueda estar
  interfiriendo con operaciones de git sobre esos archivos
  específicos — el ruido de `.gradle/**/*.bin` y `.idea/**` regenerándose
  constantemente en `main` durante toda la sesión (visto también en
  sesiones anteriores, ver memoria del proyecto) es consistente con
  esta hipótesis, pero no se confirmó una causa concreta.
- Si `core.autocrlf=true` en este repo (confirmado activo) tiene algún
  rol en por qué `git stash push` no dejó esos 3 archivos coincidiendo
  con `HEAD` en la primera pasada.

### Disciplina que sí funcionó como mitigación (mantener)

- Verificar `git log --oneline -1` en `main` después de cada tarea
  dispatchada (detecta la Ocurrencia-1, un commit real).
- **Agregar**, a partir de ahora: verificar también `git status` en el
  checkout principal después de cada tarea dispatchada, no solo el
  commit — la Ocurrencia 2 no se hubiera detectado a tiempo con el
  chequeo de solo-commit.
- Antes de cualquier merge/reset/checkout destructivo: `git stash`
  primero, sin excepción — y **verificar que el stash realmente limpió
  el working tree** (no asumir éxito solo porque el comando no dio
  error), porque se demostró que puede fallar silenciosamente para
  archivos específicos.

## Otros pendientes de esta sesión

- `stash@{0}` en el checkout principal (mensaje: "dirty main before
  ff-only merge of foto-perfil branch...") es **redundante** — se
  confirmó línea por línea que su único contenido real (4 líneas de
  `fotoUrl` en `OperacionController.java`/`SocioResponse.java`/
  `SocioService.java`) ya está presente en `main` vía el merge de la
  feature (`ae59671`). El resto del stash es ruido de build de
  `.gradle`/`.idea`. Se deja sin borrar por ahora a pedido explícito —
  no tocar hasta indicación en contrario.
- Recompilar y redistribuir el APK para que los testers tengan la
  feature de foto de perfil (progreso+cardio y fix de QR de sesiones
  anteriores tampoco están en el APK que tengan instalado).
- Confirmar si Render tiene auto-deploy por push a `main` o si hay que
  dispararlo a mano — nunca se confirmó a lo largo de ninguna sesión.

## Cuentas de prueba descartables (verificación en vivo de foto de perfil, 2026-08-21)

No había cuentas de prueba documentadas para admin/recepcionista/socio
más allá del admin semilla del schema (`admin@spartangym`, ROLE_SUPERADMIN,
`spartan_gym_schema.sql`). Para verificar la feature de foto de perfil
contra la API real de producción (`https://spartangym-api.onrender.com`)
sin tocar cuentas reales del gimnasio, se crearon 4 cuentas descartables
directamente contra prod vía `curl`:

| Rol | Email | Password | Creada para |
|---|---|---|---|
| ROLE_ADMIN | `qa-fotoperfil-admin-2026@example.com` | `[REDACTADO]` | Verificar subida de foto en `PerfilAdmin.jsx` + avatar del nav |
| ROLE_RECEPCIONISTA | `qa-fotoperfil-recepcion-2026@example.com` | `[REDACTADO]` | Verificar subida de foto en `Recepcionista/Perfil.jsx` |
| ROLE_ENTRENADOR | `qa-fotoperfil-entrenador-2026@example.com` | `[REDACTADO]` | Verificar lectura de foto en "Mis Clientes" (app, Task 14) — sin sucursal asignada, ve todos los socios |
| ROLE_SOCIO | `qa-fotoperfil-socio-2026@example.com` | `[REDACTADO]` | Verificar subida desde la app + lectura en tabla de socios (web) y en "Mis Clientes" (app) |

**Bootstrap:** las 3 cuentas de staff (admin/recepción/entrenador) se
crearon vía `POST /api/personal/registrar`, que exige rol ADMIN — para
eso se hizo login con `admin@spartangym` **una sola vez**, únicamente
para esa llamada de creación, sin tocar nada más con esa cuenta (nunca
se le subió foto ni se usó para ninguna otra prueba). La cuenta de
socio se creó vía `POST /api/auth/register` (público, no requiere admin).

**Son descartables.** Se pueden borrar cuando ya no hagan falta (no hay
endpoint de auto-borrado de cuenta; requeriría acceso directo a la DB
de Neon o un endpoint de admin para desactivar/eliminar usuario).

## Cierre: verificación en vivo de foto de perfil contra producción (2026-08-24)

Verificación real contra `https://spartangym-api.onrender.com`, sin mocks,
usando las 4 cuentas descartables de arriba. Cada superficie se probó por
separado; el detalle real (comando/acción + resultado observado) de cada
una está más abajo. Resumen:

| # | Superficie | Subida verificada | Persiste tras refresh real | Avatar visible donde corresponde |
|---|---|---|---|---|
| 1 | Web Admin (`PerfilAdmin.jsx` + nav) | ✅ | ✅ (nav y tarjeta) | ✅ |
| 2 | Web Recepcionista (`Perfil.jsx`) | ✅ | ✅ (tarjeta; sin nav, correcto) | ✅ |
| 3 | Web tabla de socios (`RegistroSocioCompartido.jsx`, Task 9) | N/A (solo lectura) | N/A | ✅ |
| 4 | App Android — socio, Photo Picker (Task 13) | ✅ (2026-08-25, ejecutado en la app real) | ✅ (force-stop + reapertura + re-login) | ✅ |
| 4b | Fallback previo: payload real de `ImagenPerfil.kt` contra el endpoint (2026-08-24, antes de tener emulador con espacio) | ✅ | — | — |
| 5 | App Android — "Mis Clientes" del entrenador (Task 14) | N/A (solo lectura) | N/A | ✅ (2026-08-25, confirmado en la UI real de Compose) |

### 1. Web — Admin (`PerfilAdmin.jsx` + avatar del nav)

- Login real como `qa-fotoperfil-admin-2026@example.com` en `http://localhost:5173` (Vite dev server local, `VITE_API_BASE_URL` apuntando a producción — sin mocks).
- Se inyectó un archivo PNG real (`Asset/WhatsApp_Image_2026-05-20...png`, 342 KB) en el `<input type="file">` de "Cambiar foto" vía `fetch` + `DataTransfer` + evento `change` (el input no acepta asignación directa de `value` por seguridad del navegador).
- `GET https://spartangym-api.onrender.com/api/operacion/me` con un token fresco de esa cuenta confirmó `fotoUrl` seteado a un `data:image/webp;base64,...` real — el `PUT` se hizo y persistió en la base, no fue solo optimismo de UI.
- Se forzó `window.location.reload()` (recarga real de documento, no navegación SPA) y se releyó el DOM: tanto el avatar del nav (`Editar perfil de administrador`) como la tarjeta de perfil mostraron un `<img>` completo (`complete: true`, 506×493px, redimensionado correctamente bajo 512px) con la misma data URL. Esto confirma que el fix de la condición de carrera de Task 7 (hidratación al montar vs. subida optimista) funciona con un refresh real, no solo en memoria.

### 2. Web — Recepcionista (`Recepcionista/Perfil.jsx`)

- Login real como `qa-fotoperfil-recepcion-2026@example.com`.
- Misma técnica de inyección de archivo real en el input de "Cambiar foto" de `/recepcion/perfil`.
- `GET /operacion/me` con token fresco confirmó `fotoUrl` persistido en la base.
- `window.location.reload()` real → el avatar de la tarjeta de perfil mostró `<img complete:true, 506×493px>` con la data URL correcta.
- `RecepcionistaLayout.jsx` no tiene avatar personalizado en el nav (ícono genérico + etiqueta estática "Recepcionista", confirmado en sesión anterior) — no se buscó ahí, como se indicó.

### 3. Web — Tabla de socios (`RegistroSocioCompartido.jsx`, solo lectura)

- Con la sesión admin activa, se navegó a `/admin/registrar-socio` (la misma tabla compartida con Recepción).
- Se inspeccionó el DOM de la fila de `QA SocioPrueba` (el socio de prueba, con foto subida por API — ver superficie 4b): la celda "Socio" mostró un `<img complete:true, 506px de ancho>` con `src` en formato `data:image/webp;base64,...`, junto al nombre. Confirma que Task 9 muestra correctamente el avatar de un socio con foto ya subida.

### 4. App Android — Socio, subida desde la credencial (Task 13)

**Ejecutado en la app real, en un emulador con espacio real, el 2026-08-25.**

**Intento previo (2026-08-24, documentado por transparencia):** con el AVD `Medium_Phone_API_36.1` la instalación del APK falló de forma consistente por falta de espacio (`IOException: Requested internal only, but not enough space`; `adb shell df /data` mostraba 98-100% de uso, 6 GB totales). Ese intento se cerró sin ejecutar nada en la app real, solo con el fallback 4b (payload directo al endpoint).

**Este intento (2026-08-25):** el usuario abrió el mismo AVD (`Medium_Phone_API_36.1`) desde Android Studio. Se verificó `adb devices` → `emulator-5554 device` (autorizado) y `adb shell df /data` → **80% uso, 1 205 272 KB (~1.18 GB) libres** — espacio real, muy distinto del intento anterior. Con eso confirmado, se instaló el APK ya compilado (`adb install -r app-debug.apk`, mismo build de la sesión anterior, sin cambios de código desde entonces) → `Success`.

Flujo ejecutado en la UI real, paso a paso, con capturas de pantalla e inspección de `uiautomator dump` para las coordenadas exactas de cada tap (no se asumió ninguna coordenada a ojo sin verificarla cuando falló al primer intento):

1. Se generó una imagen de prueba **visualmente inequívoca** (600×600, fondo azul sólido, texto blanco "QA TEST PHOTO / 2026-08-25") — la imagen real usada originalmente (`Asset/WhatsApp_Image...png`) resultó ser, sin darse cuenta, el mismo mascot spartan que la app usa como logo por defecto, lo que hacía ambiguo distinguir "foto subida" de "fallback mostrado". Se corrigió el error de método antes de reportar nada.
2. `adb push` de la imagen a `/sdcard/Pictures/` + broadcast de `MEDIA_SCANNER_SCAN_FILE`.
3. Login real en la app con `qa-fotoperfil-socio-2026@example.com` → pantalla "Cargando tu perfil" → Inicio cargado ("Hola, QA").
4. Navegación a la pestaña "Perfil" → credencial cargada, mostrando en el círculo de identidad la foto ya subida previamente (el mascot spartan del intento 4b — confirma retroactivamente que esa subida anterior sí se había renderizado bien, no era un fallback).
5. Scroll hasta el botón "Cambiar foto de perfil" → tap → **se abrió el Android Photo Picker nativo del sistema** ("SpartanGymApp will only have access to the photos you select"), confirmando que `ActivityResultContracts.PickVisualMedia` funciona en un dispositivo real.
6. Selección de "QA TEST PHOTO 2026-08-25" → tap en "Done".
7. **Guardado optimista confirmado visualmente**: el círculo de identidad cambió de inmediato a la imagen azul distintiva, en la UI de Compose real, sin necesidad de recargar nada.
8. Verificación de persistencia en backend: `GET /operacion/me` con token fresco de esa cuenta devolvió un `fotoUrl` con contenido distinto al anterior (nuevo prefijo base64), confirmando que el `PUT` desde la app (compresión real en Kotlin vía `ImagenPerfil.kt`, no el canvas del navegador) llegó y persistió.
9. **Prueba de persistencia real, no en memoria**: `adb shell am force-stop com.example.spartangymapp` (mata el proceso por completo) → reapertura de la app → volvió a la pantalla de login (la app no persiste sesión entre reinicios, comportamiro esperado, no un bug de esta feature) → login de nuevo con la misma cuenta → pestaña Perfil → **la credencial mostró la foto azul "QA TEST PHOTO 2026-08-25" de nuevo**, cargada desde cero vía red, no desde ningún estado en memoria que hubiera sobrevivido al `force-stop`.

Conclusión: **Task 13 (Photo Picker + guardado optimista + persistencia real) confirmado funcionando en la app real, no solo por contrato de API.**

**4b. (Histórico, 2026-08-24) Fallback ejecutado cuando no había emulador con espacio — payload real, mismo formato que `ImagenPerfil.kt`, contra el endpoint real:**

- Se generó el payload exacto que produciría la app: resize a máx. 512px de lado mayor + recodificación a webp calidad 0.8, replicando el algoritmo de `calcularDimensionesEscaladas`/`comprimirParaPerfil`, usando `canvas.toDataURL('image/webp', 0.8)` en el navegador sobre la misma imagen real (resultado: 506×493px, coincide con el cálculo esperado para una imagen de ese tamaño).
- Se envió `PUT https://spartangym-api.onrender.com/api/operacion/me/foto` directo (vía `fetch` desde el navegador, con el token real de `qa-fotoperfil-socio-2026@example.com`) → `200 OK`, cuerpo de respuesta con el `fotoUrl` completo (46 037 caracteres, coincide con lo enviado).
- En su momento esto solo confirmaba el contrato de API. Ya no es la única evidencia — ver el flujo real de arriba.

### 5. App Android — "Mis Clientes" del entrenador (Task 14, solo lectura)

**Ejecutado en la app real el 2026-08-25** (mismo emulador con espacio real que la superficie 4).

- Login real con `qa-fotoperfil-entrenador-2026@example.com` → "Panel Entrenador", "15 Clientes" (la cuenta no tiene sucursal asignada, así que ve a todos los socios del sistema — comportamiento esperado según `sucursalDelEntrenador`/`sociosVisiblesPara` en `OperacionController.java`).
- Tap en la pestaña "Clientes" → lista real de 15 socios cargada. **Nota:** esta lista incluye socios reales del gimnasio (no cuentas de prueba) porque el entrenador sin sucursal ve a todos — se observaron de pasada al buscar la fila de prueba, sin tocar ni interactuar con ninguna de esas cuentas, tal como se pidió.
- Se hizo scroll hasta encontrar la fila de "QA SocioPrueba" (`qa-fotoperfil-socio-2026@example.com`), al final de la lista. **Su círculo mostró correctamente la foto real** ("QA TEST PHOTO 2026-08-25", la misma subida en la superficie 4), mientras que las 14 filas de socios reales sin foto mostraron correctamente sus iniciales en círculo de color (p. ej. "AL" para Ana Lopez, "CR" para Carlos Ramirez, etc.).
- Conclusión: **Task 14 + el fix de la revisión final (`FotoPerfilCredencial` reusado en `TabClientes`) confirmado renderizando la foto correctamente en la UI de Compose real**, no solo a nivel de backend.

### Pendiente real

- ~~Repetir las superficies 4 y 5 en un entorno con un AVD que tenga espacio en disco suficiente~~ — hecho el 2026-08-25, ver arriba. Las 5 superficies de la feature quedaron confirmadas en vivo, contra producción, sin mocks.
- Las 4 cuentas de prueba (`qa-fotoperfil-*`) quedaron con foto subida — quitarlas o borrar las cuentas cuando ya no hagan falta para pruebas futuras.
- El AVD `Medium_Phone_API_36.1` volvió a tener espacio real (80% de uso, ~1.18 GB libres) el 2026-08-25, sin que se hiciera ninguna intervención manual de este lado — probablemente el usuario limpió/reinició el AVD entre sesiones. Si vuelve a quedarse sin espacio, la causa más probable son builds/instalaciones repetidas acumulando caché sin limpiar entre sesiones de prueba.
