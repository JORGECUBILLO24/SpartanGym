# Diseño: progreso semanal de rutinas + campos alternativos por tipo de ejercicio

Rama: `feat/progreso-y-cardio`

## Contexto y problema

Hoy `detalle_rutinas` tiene PK compuesta `(rutina_id, ejercicio_id)`, así que cada
ejercicio aparece **una sola vez** por rutina — no hay forma de registrar que un
ejercicio se completó en varias fechas. El "progreso" que ve el socio en la app es
`0f` hardcodeado (estado local de Compose, no persistido). Además `series` y
`repeticiones` son `NOT NULL CHECK > 0`, así que hoy es literalmente imposible
guardar un ejercicio de cardio puro sin inventar series/reps falsos.

Este spec resuelve dos problemas juntos porque comparten la misma tabla:

- **(A)** Marcar un ejercicio como completado y calcular el % real de progreso.
- **(B)** Campos alternativos para tipos de ejercicio no-fuerza (Cardio ahora;
  Movilidad/Funcional/Estiramiento a futuro): velocidad/nivel, inclinación,
  duración, distancia.

## Decisiones tomadas (con el usuario, durante brainstorming)

1. **Modelo de progreso: recurrente semanal**, no "una sola pasada". El socio
   repite la misma rutina cada semana. Esto obliga a una **tabla de sesiones
   nueva** (`ejercicios_completados`), porque el mismo ejercicio se completa en
   muchas fechas distintas y el PK actual de `detalle_rutinas` no lo permite.
2. **El % representa la semana actual (lunes–domingo)**: completados esta semana
   / planificados en la rutina. Se reinicia cada lunes. Para que "planificados de
   la semana" tenga sentido, cada ejercicio se etiqueta a un **día de la semana**
   (Lun–Dom, `dia_semana` 1–7) en vez de solo una fecha suelta (`dia_programado`
   se mantiene como columna legacy/opcional, sin usarse en el flujo nuevo).
3. **(B) columnas fijas, no JSON `parametros`.** Los 4 parámetros nombrados
   (velocidad/nivel, inclinación, duración, distancia) cubren Cardio y en buena
   medida Movilidad/Funcional/Estiramiento (sobre todo duración). Un tipo nuevo
   casi siempre reusa esos mismos campos → sin migración. Columnas tipadas dan
   validación de BD y son más legibles para reportes y para la defensa del
   proyecto. JSON se descartó por ser flexibilidad que no se va a usar (YAGNI) a
   cambio de perder validación y claridad.
4. **`spring.jpa.hibernate.ddl-auto=none`** (confirmado en
   `application.properties`): Hibernate no crea ni altera columnas solo. Todo
   cambio de schema se aplica a mano con un script SQL contra Neon.

## Diseño

### 1. Schema SQL (aplicado a mano en Neon)

**a) Relajar series/repeticiones** (para permitir cardio puro sin series/reps):

```sql
ALTER TABLE detalle_rutinas ALTER COLUMN series DROP NOT NULL;
ALTER TABLE detalle_rutinas ALTER COLUMN repeticiones DROP NOT NULL;

ALTER TABLE detalle_rutinas DROP CONSTRAINT IF EXISTS detalle_rutinas_series_check;
ALTER TABLE detalle_rutinas ADD CONSTRAINT detalle_rutinas_series_check
    CHECK (series IS NULL OR series > 0);

ALTER TABLE detalle_rutinas DROP CONSTRAINT IF EXISTS detalle_rutinas_repeticiones_check;
ALTER TABLE detalle_rutinas ADD CONSTRAINT detalle_rutinas_repeticiones_check
    CHECK (repeticiones IS NULL OR repeticiones > 0);
```

> Nota de implementación: los nombres exactos de los CHECK constraints actuales
> deben confirmarse contra Neon (`\d detalle_rutinas` o `information_schema`)
> antes de aplicar el `DROP CONSTRAINT`, porque Postgres autogenera el nombre y
> puede no ser exactamente `detalle_rutinas_series_check`.

**b) Nuevas columnas en `detalle_rutinas`:**

```sql
ALTER TABLE detalle_rutinas
  ADD COLUMN IF NOT EXISTS dia_semana        SMALLINT,        -- 1=Lun .. 7=Dom
  ADD COLUMN IF NOT EXISTS velocidad_nivel   DECIMAL(6,2),    -- km/h o nivel de maquina
  ADD COLUMN IF NOT EXISTS inclinacion       DECIMAL(5,2),    -- % de inclinacion
  ADD COLUMN IF NOT EXISTS duracion_segundos INT,
  ADD COLUMN IF NOT EXISTS distancia_metros  DECIMAL(8,2);

ALTER TABLE detalle_rutinas
  ADD CONSTRAINT IF NOT EXISTS detalle_rutinas_dia_semana_check
  CHECK (dia_semana IS NULL OR dia_semana BETWEEN 1 AND 7);
```

`dia_programado DATE` se mantiene sin cambios (legacy/opcional); el scheduling
recurrente pasa a usar `dia_semana`.

**c) Tabla nueva de sesiones completadas:**

```sql
CREATE TABLE IF NOT EXISTS ejercicios_completados (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rutina_id      UUID NOT NULL,
    ejercicio_id   INT  NOT NULL,
    fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
    completado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ec_detalle FOREIGN KEY (rutina_id, ejercicio_id)
        REFERENCES detalle_rutinas (rutina_id, ejercicio_id) ON DELETE CASCADE,
    CONSTRAINT uq_ec_dia UNIQUE (rutina_id, ejercicio_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_ec_rutina_fecha ON ejercicios_completados (rutina_id, fecha);
```

- La FK compuesta garantiza que solo se marca completado un ejercicio que
  realmente pertenece a esa rutina, y cascadea si se borra el detalle.
- El `UNIQUE (rutina_id, ejercicio_id, fecha)` hace idempotente marcar el mismo
  ejercicio el mismo día dos veces.
- `rutina_id` ya aísla el progreso por socio (cada rutina es de un solo socio,
  incluidas las creadas desde una rutina global) — no hace falta `socio_id` en
  esta tabla.

**Cálculo del %:** dado el lunes/domingo de la semana actual:
`planificadosSemana` = filas en `detalle_rutinas` de esa rutina;
`completadosSemana` = `COUNT(DISTINCT ejercicio_id)` en `ejercicios_completados`
con `rutina_id` y `fecha` dentro de esa semana;
`progresoSemana = completadosSemana / planificadosSemana` (0 si no hay
planificados).

### 2. Entidad JPA + DTOs (`SpartanGymAPI`)

- **`RutinaDetalle`**: quitar `nullable = false` de `series`/`repeticiones`;
  agregar `diaSemana` (Integer), `velocidadNivel` (Double), `inclinacion`
  (Double), `duracionSegundos` (Integer), `distanciaMetros` (Double).
- **Nueva entidad `EjercicioCompletado`** (`@Table("ejercicios_completados")`):
  `id` (UUID), `rutinaId` (UUID), `ejercicioId` (Long), `fecha` (LocalDate),
  `completadoEn` (LocalDateTime). Se mapea con columnas escalares (no como
  relación JPA hacia `RutinaDetalle`), para mantenerlo simple dado que el uso es
  solo insert/delete/count por `(rutinaId, ejercicioId, fecha)`.
- **Nuevo `EjercicioCompletadoRepository`**: métodos necesarios —
  `existsByRutinaIdAndEjercicioIdAndFecha`,
  `deleteByRutinaIdAndEjercicioIdAndFecha`,
  `findByRutinaIdAndFechaBetween` (para pintar los ✓ de la semana y contar
  distinct ejercicios completados).
- **`RutinaDetalleRequest`** (API): agregar `diaSemana`, `velocidadNivel`,
  `inclinacion`, `duracionSegundos`, `distanciaMetros`; `series`/`repeticiones`
  pasan a `Integer` opcional (ya lo son en el DTO, pero el `RutinaService` debe
  dejar de asumir que siempre vienen).
- **`DashboardResponse`**: agregar `progresoSemana` (Double, 0–1),
  `completadosSemana` (Integer), `planificadosSemana` (Integer). Se mantiene
  `totalEjercicios` por compatibilidad con quien ya lo consuma.
- **Nuevo `MarcarEjercicioRequest`**: `{ completado: Boolean, fecha: LocalDate?
  }` (si `fecha` es null, usar hoy).
- **`RutinaService.mapearRutina`** y **`OperacionController.rutinaMap`**: por
  ejercicio agregar `diaSemana` + los 4 parámetros nuevos +
  `completadoEstaSemana` (boolean, requiere consultar
  `ejercicios_completados` para la semana actual); a nivel rutina agregar
  `progresoSemana`, `completadosSemana`, `planificadosSemana`.

### 3. Endpoints nuevos/cambiados (`SpartanGymAPI`)

| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| `POST` | `/api/rutinas/{rutinaId}/ejercicios/{ejercicioId}/completar` | `ROLE_SOCIO` | Body `MarcarEjercicioRequest`. `completado=true` → si `existsByRutinaIdAndEjercicioIdAndFecha` es `false`, inserta la fila (evita depender de capturar la excepción del `UNIQUE`); `completado=false` → `deleteByRutinaIdAndEjercicioIdAndFecha`. Valida que la rutina pertenezca al socio autenticado (token → usuario → `rutina.socio.usuarioId`); si no, 403. |

- **`DashboardService.obtenerDashboardInicio`**: calcula lunes/domingo de la
  semana actual y llena `completadosSemana`/`planificadosSemana`/
  `progresoSemana` para la rutina más reciente del socio.
- **`GET /api/operacion/socio/{socioId}/rutinas`** (ya existe, la usa la app):
  ahora devuelve por rutina el `progresoSemana`, y por ejercicio
  `completadoEstaSemana` + los 4 parámetros nuevos — así la app pinta ✓ y % con
  datos del backend, no estado local.

### 4. Reflejo en la UI (diseño, sin implementar en este spec)

**Web — `SpartanGymWeb/src/pages/Admin/sub_pages/Rutinas.jsx`** (constructor del
entrenador):

- Campos del formulario **condicionados por `tipoEjercicio`**:
  - `Fuerza` → series / reps / peso / descanso (como hoy).
  - `Cardio` → velocidad-nivel / inclinación / duración / distancia (+
    descanso opcional).
  - `Movilidad` / `Estiramiento` → duración (+ reps opcional).
  - `Funcional` → mezcla: series/reps + duración.
- Nuevo selector de **día de la semana** (Lun–Dom) por ejercicio, en vez del
  date-picker de `dia_programado`, para el flujo recurrente.
- El constructor no muestra estado de completado — eso es solo del socio.

**App Android — pantalla de rutina del socio (`PantallaUsuario.kt`):**

- `RingProgreso` / `BarraProgreso` consumen `progresoSemana` real desde la API
  en vez de `0f` hardcodeado.
- Cada `ItemEjercicio` refleja `completadoEstaSemana` desde el backend; al
  tocarlo, llama a `POST .../completar` (actualización optimista + refresco),
  en vez de solo alternar un booleano en memoria.
- El texto de detalle del ejercicio se arma según `tipoEjercicio`: Cardio
  muestra algo como "20 min · 6 km/h · 2% incl · 2 km" en vez de "3 series · 12
  reps".
- Opcional (no bloqueante): agrupar ejercicios por `diaSemana` con encabezado
  de día (Lunes, Martes, …).

## Fuera de alcance de este spec

- Rachas/gamificación (semanas consecutivas cumplidas) — se mencionó como
  posible iteración futura, no se incluye aquí.
- Historial de progreso semana-a-semana más allá de la semana actual (la tabla
  `ejercicios_completados` sí lo permite a futuro, pero ningún endpoint de este
  spec lo expone todavía).
- Migrar `dia_programado` existente a `dia_semana` para rutinas ya creadas (no
  hay rutinas reales en producción con datos sensibles a esto más allá de los
  datos de prueba sembrados).
