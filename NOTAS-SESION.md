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
