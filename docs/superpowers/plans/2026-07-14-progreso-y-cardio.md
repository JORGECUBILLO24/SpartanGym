# Progreso semanal de rutinas + campos por tipo de ejercicio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el progreso `0f` hardcodeado de las rutinas por un progreso semanal real persistido en BD, y permitir que `detalle_rutinas` guarde campos alternativos (velocidad/nivel, inclinación, duración, distancia) para ejercicios no-fuerza en vez de forzar series/repeticiones/peso.

**Architecture:** Nueva tabla `ejercicios_completados` (una fila por ejercicio marcado en una fecha) + 5 columnas nuevas en `detalle_rutinas`. Un servicio nuevo `EjercicioCompletadoService` centraliza el cálculo de "progreso de la semana actual" (lunes–domingo) y la operación de marcar/desmarcar, reutilizado por `RutinaService`, `OperacionController` y `DashboardService`. El endpoint `GET /api/operacion/socio/{socioId}/rutinas` (ya usado por la app) empieza a devolver `progresoSemana` y `completadoEstaSemana` reales. La app deja de mantener `completado` como estado local y llama al backend; la web condiciona los campos del constructor de rutinas según `tipoEjercicio`.

**Tech Stack:** Spring Boot 4.0.6 / Java 17 / Spring Data JPA / PostgreSQL (API) — React 19 / Vite (Web) — Kotlin 2.2.10 / Jetpack Compose / Retrofit2 (App).

## Global Constraints

- `spring.jpa.hibernate.ddl-auto=none` — ningún cambio de schema se aplica solo. Todo `ALTER`/`CREATE TABLE` se ejecuta a mano contra la base de datos usada para pruebas.
- Spec de referencia (decisiones ya aprobadas, no reabrir): [docs/superpowers/specs/2026-07-14-progreso-y-cardio-design.md](../specs/2026-07-14-progreso-y-cardio-design.md).
- El progreso es **semanal** (lunes–domingo), se reinicia cada semana. No hay rachas ni historial multi-semana en este plan (fuera de alcance, ver spec).
- Columnas fijas, no JSON, para los parámetros alternativos.
- **No se toca `PantallaEntrenador.kt`** (constructor de rutinas dentro de la app Android) — fuera de alcance de este plan; el entrenador construye rutinas con campos por tipo únicamente desde la web. Es un gap conocido a futuro, no silencioso: se documenta aquí.
- **Prerrequisito de entorno (una sola vez):** este worktree es un checkout nuevo y `SpartanGymAPI/src/main/resources/application-local.properties` está gitignored, así que **no existe aquí todavía**. Antes de correr la API localmente (Tarea 12), cópialo desde el checkout principal:
  ```powershell
  Copy-Item "C:\Users\gaboe\Documents\PoyectoFInalPOOII\SpartanGymResolve\SpartanGym1\SpartanGym\SpartanGymAPI\src\main\resources\application-local.properties" "C:\Users\gaboe\Documents\PoyectoFInalPOOII\SpartanGymResolve\SpartanGym1\SpartanGym\.claude\worktrees\feat+progreso-y-cardio\SpartanGymAPI\src\main\resources\application-local.properties"
  ```
- Build de la API: `JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"` (no hay JDK global instalado), usar `SpartanGymAPI\mvnw.cmd`.
- Build de la app Android: mismo `JAVA_HOME`, usar `SpartanGymApp\gradlew.bat`.
- La Web no tiene runner de tests (no hay Jest/Vitest en `package.json`) — su verificación es manual vía `npm run dev` + navegador, no inventar infraestructura de test nueva.

---

## Fase 1 — SpartanGymAPI

### Task 1: Migración SQL — relajar series/repeticiones y agregar columnas nuevas

**Files:**
- Modify: `spartan_gym_schema.sql` (agregar al final, siguiendo el patrón existente de bloques `ALTER TABLE IF NOT EXISTS` ya presentes en el archivo)

**Interfaces:**
- Produces: columnas `detalle_rutinas.dia_semana`, `.velocidad_nivel`, `.inclinacion`, `.duracion_segundos`, `.distancia_metros`; `series`/`repeticiones` ahora nullable. Usado por Task 4 (entidad JPA).

- [ ] **Step 1: Agregar el bloque de migración al final de `spartan_gym_schema.sql`**

```sql

-- ==========================================
-- 5. Progreso semanal de rutinas y campos por tipo de ejercicio
-- ==========================================

-- Cardio puro no tiene series/repeticiones; se relaja el NOT NULL.
ALTER TABLE detalle_rutinas ALTER COLUMN series DROP NOT NULL;
ALTER TABLE detalle_rutinas ALTER COLUMN repeticiones DROP NOT NULL;

ALTER TABLE detalle_rutinas DROP CONSTRAINT IF EXISTS detalle_rutinas_series_check;
ALTER TABLE detalle_rutinas ADD CONSTRAINT detalle_rutinas_series_check
    CHECK (series IS NULL OR series > 0);

ALTER TABLE detalle_rutinas DROP CONSTRAINT IF EXISTS detalle_rutinas_repeticiones_check;
ALTER TABLE detalle_rutinas ADD CONSTRAINT detalle_rutinas_repeticiones_check
    CHECK (repeticiones IS NULL OR repeticiones > 0);

ALTER TABLE detalle_rutinas
  ADD COLUMN IF NOT EXISTS dia_semana        SMALLINT,        -- 1=Lunes .. 7=Domingo
  ADD COLUMN IF NOT EXISTS velocidad_nivel   DECIMAL(6,2),    -- km/h o nivel de maquina
  ADD COLUMN IF NOT EXISTS inclinacion       DECIMAL(5,2),    -- % de inclinacion
  ADD COLUMN IF NOT EXISTS duracion_segundos INT,
  ADD COLUMN IF NOT EXISTS distancia_metros  DECIMAL(8,2);

ALTER TABLE detalle_rutinas DROP CONSTRAINT IF EXISTS detalle_rutinas_dia_semana_check;
ALTER TABLE detalle_rutinas ADD CONSTRAINT detalle_rutinas_dia_semana_check
    CHECK (dia_semana IS NULL OR dia_semana BETWEEN 1 AND 7);

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

- [ ] **Step 2: Verificar los nombres reales de los CHECK constraints existentes contra la BD antes de aplicar**

Los nombres autogenerados por Postgres pueden no coincidir exactamente con lo asumido arriba. Antes de ejecutar el script contra cualquier base (local o Neon), correr:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'detalle_rutinas'::regclass AND contype = 'c';
```

Si los nombres difieren de `detalle_rutinas_series_check` / `detalle_rutinas_repeticiones_check`, ajustar el `DROP CONSTRAINT IF EXISTS` del Step 1 con los nombres reales antes de continuar (el `IF EXISTS` hace esto seguro de reintentar).

- [ ] **Step 3: Commit**

```bash
git add spartan_gym_schema.sql
git commit -m "feat(api): agregar migracion SQL para progreso semanal y campos por tipo de ejercicio"
```

(La ejecución real del script contra una base de datos ocurre en la Tarea 12, junto con la verificación manual end-to-end — aplicarlo antes no tiene efecto porque las entidades JPA que lo consumen todavía no existen.)

---

### Task 2: Utilidad pura `RangoSemana` (lunes–domingo) + tests

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/util/RangoSemana.java`
- Test: `SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/util/RangoSemanaTest.java`

**Interfaces:**
- Produces: `RangoSemana.deLunesADomingo(LocalDate fecha): RangoSemana` con `record RangoSemana(LocalDate inicio, LocalDate fin)`. Usado por Task 7 (`EjercicioCompletadoService`).

- [ ] **Step 1: Escribir el test que falla**

```java
package ni.edu.uam.SpartanGymAPI.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RangoSemanaTest {

    @Test
    void unMiercolesDevuelveElLunesYDomingoDeEsaSemana() {
        // 2026-07-15 es miercoles
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 15));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio()); // lunes
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());    // domingo
    }

    @Test
    void unLunesEsElInicioDeSuPropiaSemana() {
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 13));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio());
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());
    }

    @Test
    void unDomingoEsElFinDeSuPropiaSemanaNoLaSiguiente() {
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 19));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio());
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());
    }
}
```

- [ ] **Step 2: Correr el test y confirmar que falla (la clase no existe todavía)**

Run (desde `SpartanGymAPI/`, con `JAVA_HOME` apuntando al JBR):
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\mvnw.cmd -Dtest=RangoSemanaTest test
```
Expected: FAIL — `cannot find symbol: class RangoSemana`.

- [ ] **Step 3: Implementar `RangoSemana`**

```java
package ni.edu.uam.SpartanGymAPI.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

public record RangoSemana(LocalDate inicio, LocalDate fin) {

    public static RangoSemana deLunesADomingo(LocalDate fecha) {
        LocalDate lunes = fecha.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate domingo = lunes.plusDays(6);
        return new RangoSemana(lunes, domingo);
    }
}
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

```powershell
.\mvnw.cmd -Dtest=RangoSemanaTest test
```
Expected: PASS — 3 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/util/RangoSemana.java SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/util/RangoSemanaTest.java
git commit -m "feat(api): agregar RangoSemana para calcular limites lunes-domingo"
```

---

### Task 3: DTOs nuevos — `MarcarEjercicioRequest` y `ProgresoSemana`

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/MarcarEjercicioRequest.java`
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/ProgresoSemana.java`

**Interfaces:**
- Produces: `MarcarEjercicioRequest{ completado: Boolean, fecha: LocalDate }` (body del endpoint de la Task 8). `ProgresoSemana(int planificados, int completados, double progreso, Set<Long> ejerciciosCompletadosIds)` (valor de retorno de `EjercicioCompletadoService.calcularProgreso`, Task 7).

- [ ] **Step 1: Crear `MarcarEjercicioRequest`**

```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class MarcarEjercicioRequest {
    private Boolean completado;
    private LocalDate fecha;
}
```

- [ ] **Step 2: Crear `ProgresoSemana`**

```java
package ni.edu.uam.SpartanGymAPI.dto;

import java.util.Set;

public record ProgresoSemana(int planificados, int completados, double progreso, Set<Long> ejerciciosCompletadosIds) {
}
```

- [ ] **Step 3: Verificar que compila**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS (sin errores; estos DTOs todavía no los usa nadie).

- [ ] **Step 4: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/MarcarEjercicioRequest.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/ProgresoSemana.java
git commit -m "feat(api): agregar DTOs MarcarEjercicioRequest y ProgresoSemana"
```

---

### Task 4: Entidad `RutinaDetalle` — relajar series/repeticiones y agregar 5 campos

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/RutinaDetalle.java`

**Interfaces:**
- Produces: `RutinaDetalle.getDiaSemana()/setDiaSemana(Integer)`, `getVelocidadNivel()/setVelocidadNivel(Double)`, `getInclinacion()/setInclinacion(Double)`, `getDuracionSegundos()/setDuracionSegundos(Integer)`, `getDistanciaMetros()/setDistanciaMetros(Double)` (Lombok `@Data` los genera). Usado por Task 9 (`RutinaService`) y Task 10 (`OperacionController`).

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Archivo actual (`SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/RutinaDetalle.java`):

```java
package ni.edu.uam.SpartanGymAPI.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "detalle_rutinas")
@IdClass(RutinaDetalleId.class)
public class RutinaDetalle {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_id", nullable = false)
    @JsonIgnore
    private Rutina rutina;

    @Id
    @ManyToOne
    @JoinColumn(name = "ejercicio_id", nullable = false)
    private Ejercicio ejercicio;

    @Column(nullable = false)
    private Integer series;

    @Column(nullable = false)
    private Integer repeticiones;

    @Column(name = "tipo_ejercicio", length = 40)
    private String tipoEjercicio;

    @Column(name = "dia_programado")
    private LocalDate diaProgramado;

    @Column(name = "peso_sugerido_kg")
    private Double pesoSugeridoKg;

    @Column(name = "tiempo_descanso_segundos")
    private Integer tiempoDescansoSegundos;

    @Column(length = 255)
    private String notas;

    @Column
    private Integer orden;
}
```

Reemplazar por:

```java
package ni.edu.uam.SpartanGymAPI.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "detalle_rutinas")
@IdClass(RutinaDetalleId.class)
public class RutinaDetalle {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_id", nullable = false)
    @JsonIgnore
    private Rutina rutina;

    @Id
    @ManyToOne
    @JoinColumn(name = "ejercicio_id", nullable = false)
    private Ejercicio ejercicio;

    private Integer series;

    private Integer repeticiones;

    @Column(name = "tipo_ejercicio", length = 40)
    private String tipoEjercicio;

    @Column(name = "dia_programado")
    private LocalDate diaProgramado;

    // 1=Lunes .. 7=Domingo. Reemplaza a diaProgramado para el flujo de rutinas recurrentes.
    @Column(name = "dia_semana")
    private Integer diaSemana;

    @Column(name = "peso_sugerido_kg")
    private Double pesoSugeridoKg;

    // Campos alternativos para tipos no-Fuerza (Cardio, Movilidad, etc.)
    @Column(name = "velocidad_nivel")
    private Double velocidadNivel;

    @Column(name = "inclinacion")
    private Double inclinacion;

    @Column(name = "duracion_segundos")
    private Integer duracionSegundos;

    @Column(name = "distancia_metros")
    private Double distanciaMetros;

    @Column(name = "tiempo_descanso_segundos")
    private Integer tiempoDescansoSegundos;

    @Column(length = 255)
    private String notas;

    @Column
    private Integer orden;
}
```

- [ ] **Step 2: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/RutinaDetalle.java
git commit -m "feat(api): relajar series/repeticiones y agregar campos por tipo en RutinaDetalle"
```

---

### Task 5: Entidad `EjercicioCompletado` + repositorio

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/EjercicioCompletado.java`
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/repositories/EjercicioCompletadoRepository.java`

**Interfaces:**
- Produces: `EjercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(UUID, Long, LocalDate): boolean`, `.deleteByRutinaIdAndEjercicioIdAndFecha(UUID, Long, LocalDate): void`, `.findByRutinaIdAndFechaBetween(UUID, LocalDate, LocalDate): List<EjercicioCompletado>`. Usado por Task 7 (`EjercicioCompletadoService`).

- [ ] **Step 1: Crear la entidad**

```java
package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ejercicios_completados")
public class EjercicioCompletado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rutina_id", nullable = false)
    private UUID rutinaId;

    @Column(name = "ejercicio_id", nullable = false)
    private Long ejercicioId;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(name = "completado_en", updatable = false)
    private LocalDateTime completadoEn = LocalDateTime.now();
}
```

- [ ] **Step 2: Crear el repositorio**

```java
package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.EjercicioCompletado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EjercicioCompletadoRepository extends JpaRepository<EjercicioCompletado, UUID> {

    boolean existsByRutinaIdAndEjercicioIdAndFecha(UUID rutinaId, Long ejercicioId, LocalDate fecha);

    void deleteByRutinaIdAndEjercicioIdAndFecha(UUID rutinaId, Long ejercicioId, LocalDate fecha);

    List<EjercicioCompletado> findByRutinaIdAndFechaBetween(UUID rutinaId, LocalDate inicio, LocalDate fin);
}
```

- [ ] **Step 3: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/models/EjercicioCompletado.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/repositories/EjercicioCompletadoRepository.java
git commit -m "feat(api): agregar entidad y repositorio EjercicioCompletado"
```

---

### Task 6: DTOs — extender `RutinaDetalleRequest` y `DashboardResponse`

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/RutinaDetalleRequest.java`
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/DashboardResponse.java`

**Interfaces:**
- Produces: `RutinaDetalleRequest` con `diaSemana`, `velocidadNivel`, `inclinacion`, `duracionSegundos`, `distanciaMetros`. `DashboardResponse` con `progresoSemana`, `completadosSemana`, `planificadosSemana`. Usado por Task 9 (`RutinaService`) y Task 11 (`DashboardService`).

- [ ] **Step 1: Reemplazar `RutinaDetalleRequest.java` completo**

Archivo actual:
```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RutinaDetalleRequest {
    private Long idEjercicio;
    private Integer series;
    private Integer repeticiones;
    private String tipoEjercicio;
    private LocalDate diaProgramado;
    private Double pesoSugeridoKg;
    private Integer tiempoDescansoSegundos;
    private String notas;
    private Integer orden;
}
```

Reemplazar por:
```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RutinaDetalleRequest {
    private Long idEjercicio;
    private Integer series;
    private Integer repeticiones;
    private String tipoEjercicio;
    private LocalDate diaProgramado;
    private Integer diaSemana;
    private Double pesoSugeridoKg;
    private Double velocidadNivel;
    private Double inclinacion;
    private Integer duracionSegundos;
    private Double distanciaMetros;
    private Integer tiempoDescansoSegundos;
    private String notas;
    private Integer orden;
}
```

- [ ] **Step 2: Reemplazar `DashboardResponse.java` completo**

Archivo actual:
```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DashboardResponse {
    // Datos del Perfil y Acceso
    private String nombreCompleto;
    private String estadoAcceso;
    private String tipoMembresia;
    private LocalDate fechaVencimiento;

    // Progreso Físico (El último registro)
    private Double ultimoPesoKg;
    private String notasMedidas;

    // Rutina Actual (La más reciente asignada)
    private String objetivoRutina;
    private String nombreEntrenador;
    private Integer totalEjercicios;
}
```

Reemplazar por:
```java
package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DashboardResponse {
    // Datos del Perfil y Acceso
    private String nombreCompleto;
    private String estadoAcceso;
    private String tipoMembresia;
    private LocalDate fechaVencimiento;

    // Progreso Físico (El último registro)
    private Double ultimoPesoKg;
    private String notasMedidas;

    // Rutina Actual (La más reciente asignada)
    private String objetivoRutina;
    private String nombreEntrenador;
    private Integer totalEjercicios;

    // Progreso semanal real (lunes-domingo) de la rutina actual
    private Double progresoSemana;
    private Integer completadosSemana;
    private Integer planificadosSemana;
}
```

- [ ] **Step 3: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/RutinaDetalleRequest.java SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/dto/DashboardResponse.java
git commit -m "feat(api): extender RutinaDetalleRequest y DashboardResponse con progreso y campos por tipo"
```

---

### Task 7: `EjercicioCompletadoService` (calcular progreso + marcar/desmarcar) + tests

**Files:**
- Create: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/EjercicioCompletadoService.java`
- Test: `SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/services/EjercicioCompletadoServiceTest.java`

**Interfaces:**
- Consumes: `RangoSemana.deLunesADomingo(LocalDate)` (Task 2), `EjercicioCompletadoRepository` (Task 5), `RutinaRepository.findById(UUID)` (ya existe, hereda de `JpaRepository`), `UsuarioRepository.findByEmail(String)` (ya existe), `SocioRepository.findById(UUID)` (ya existe), `MarcarEjercicioRequest`/`ProgresoSemana` (Task 3).
- Produces: `EjercicioCompletadoService.calcularProgreso(Rutina rutina): ProgresoSemana`, `.marcarCompletado(String emailSocio, UUID rutinaId, Long ejercicioId, MarcarEjercicioRequest request): void` (lanza `AccessDeniedException` si la rutina no es del socio autenticado, `RuntimeException` si la rutina/ejercicio no existen). Usado por Task 8 (`RutinaController`), Task 9 (`RutinaService`), Task 10 (`OperacionController`), Task 11 (`DashboardService`).

- [ ] **Step 1: Escribir los tests que fallan**

```java
package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.EjercicioCompletadoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EjercicioCompletadoServiceTest {

    @Mock private RutinaRepository rutinaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SocioRepository socioRepository;
    @Mock private EjercicioCompletadoRepository ejercicioCompletadoRepository;

    @InjectMocks
    private EjercicioCompletadoService service;

    private Ejercicio ejercicio(Long id) {
        Ejercicio e = new Ejercicio();
        e.setId(id);
        return e;
    }

    private RutinaDetalle detalle(Ejercicio ej) {
        RutinaDetalle d = new RutinaDetalle();
        d.setEjercicio(ej);
        return d;
    }

    @Test
    void calcularProgreso_devuelveElPorcentajeDeEjerciciosDistintosCompletadosEstaSemana() {
        Ejercicio e1 = ejercicio(1L);
        Ejercicio e2 = ejercicio(2L);
        Ejercicio e3 = ejercicio(3L);

        Rutina rutina = new Rutina();
        rutina.setId(UUID.randomUUID());
        rutina.setDetalles(List.of(detalle(e1), detalle(e2), detalle(e3)));

        EjercicioCompletado c1 = new EjercicioCompletado();
        c1.setEjercicioId(1L);
        EjercicioCompletado c2 = new EjercicioCompletado();
        c2.setEjercicioId(2L);

        when(ejercicioCompletadoRepository.findByRutinaIdAndFechaBetween(eq(rutina.getId()), any(), any()))
                .thenReturn(List.of(c1, c2));

        ProgresoSemana progreso = service.calcularProgreso(rutina);

        assertEquals(3, progreso.planificados());
        assertEquals(2, progreso.completados());
        assertEquals(2.0 / 3.0, progreso.progreso(), 0.0001);
        assertEquals(java.util.Set.of(1L, 2L), progreso.ejerciciosCompletadosIds());
    }

    @Test
    void calcularProgreso_devuelveCeroSinDividirPorCeroCuandoNoHayEjerciciosPlanificados() {
        Rutina rutina = new Rutina();
        rutina.setId(UUID.randomUUID());
        rutina.setDetalles(List.of());

        when(ejercicioCompletadoRepository.findByRutinaIdAndFechaBetween(eq(rutina.getId()), any(), any()))
                .thenReturn(List.of());

        ProgresoSemana progreso = service.calcularProgreso(rutina);

        assertEquals(0, progreso.planificados());
        assertEquals(0.0, progreso.progreso(), 0.0001);
    }

    @Test
    void marcarCompletado_lanzaAccessDenied_siLaRutinaNoEsDelSocioAutenticado() {
        UUID rutinaId = UUID.randomUUID();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socioAutenticado = new Socio();
        socioAutenticado.setUsuarioId(usuario.getId());

        Socio socioDueno = new Socio();
        socioDueno.setUsuarioId(UUID.randomUUID());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socioDueno);
        rutina.setDetalles(List.of(detalle(ejercicio(1L))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socioAutenticado));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        assertThrows(AccessDeniedException.class, () ->
                service.marcarCompletado("socio@correo.com", rutinaId, 1L, request));

        verify(ejercicioCompletadoRepository, never()).save(any());
    }

    @Test
    void marcarCompletado_insertaRegistro_cuandoCompletadoEsTrueYNoExisteAun() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));
        when(ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy))
                .thenReturn(false);

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, times(1)).save(any(EjercicioCompletado.class));
    }

    @Test
    void marcarCompletado_esIdempotente_noInsertaDuplicadoSiYaExisteEseDia() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));
        when(ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy))
                .thenReturn(true);

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, never()).save(any());
    }

    @Test
    void marcarCompletado_false_eliminaElRegistroDeEseDia() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(false);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, times(1))
                .deleteByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy);
    }
}
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\mvnw.cmd -Dtest=EjercicioCompletadoServiceTest test
```
Expected: FAIL — `cannot find symbol: class EjercicioCompletadoService`.

- [ ] **Step 3: Implementar `EjercicioCompletadoService`**

```java
package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.EjercicioCompletado;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.EjercicioCompletadoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.util.RangoSemana;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EjercicioCompletadoService {

    private final RutinaRepository rutinaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final EjercicioCompletadoRepository ejercicioCompletadoRepository;

    @Transactional(readOnly = true)
    public ProgresoSemana calcularProgreso(Rutina rutina) {
        RangoSemana semana = RangoSemana.deLunesADomingo(LocalDate.now());

        Set<Long> completados = ejercicioCompletadoRepository
                .findByRutinaIdAndFechaBetween(rutina.getId(), semana.inicio(), semana.fin())
                .stream()
                .map(EjercicioCompletado::getEjercicioId)
                .collect(Collectors.toSet());

        int planificados = rutina.getDetalles().size();
        double progreso = planificados == 0 ? 0.0 : (double) completados.size() / planificados;

        return new ProgresoSemana(planificados, completados.size(), progreso, completados);
    }

    @Transactional
    public void marcarCompletado(String emailSocio, UUID rutinaId, Long ejercicioId, MarcarEjercicioRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(emailSocio)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Perfil de socio no encontrado"));

        Rutina rutina = rutinaRepository.findById(rutinaId)
                .orElseThrow(() -> new RuntimeException("Rutina no encontrada"));

        if (!rutina.getSocio().getUsuarioId().equals(socio.getUsuarioId())) {
            throw new AccessDeniedException("Esta rutina no pertenece al socio autenticado.");
        }

        boolean perteneceARutina = rutina.getDetalles().stream()
                .anyMatch(detalle -> detalle.getEjercicio().getId().equals(ejercicioId));
        if (!perteneceARutina) {
            throw new RuntimeException("Ese ejercicio no pertenece a esta rutina.");
        }

        LocalDate fecha = request.getFecha() != null ? request.getFecha() : LocalDate.now();

        if (Boolean.TRUE.equals(request.getCompletado())) {
            if (!ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, fecha)) {
                EjercicioCompletado registro = new EjercicioCompletado();
                registro.setRutinaId(rutinaId);
                registro.setEjercicioId(ejercicioId);
                registro.setFecha(fecha);
                ejercicioCompletadoRepository.save(registro);
            }
        } else {
            ejercicioCompletadoRepository.deleteByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, fecha);
        }
    }
}
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

```powershell
.\mvnw.cmd -Dtest=EjercicioCompletadoServiceTest test
```
Expected: PASS — 5 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/EjercicioCompletadoService.java SpartanGymAPI/src/test/java/ni/edu/uam/SpartanGymAPI/services/EjercicioCompletadoServiceTest.java
git commit -m "feat(api): agregar EjercicioCompletadoService (calcular progreso + marcar/desmarcar)"
```

---

### Task 8: Endpoint `POST /api/rutinas/{rutinaId}/ejercicios/{ejercicioId}/completar`

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/RutinaController.java`

**Interfaces:**
- Consumes: `EjercicioCompletadoService.marcarCompletado(String, UUID, Long, MarcarEjercicioRequest)` (Task 7).
- Produces: endpoint `POST /api/rutinas/{rutinaId}/ejercicios/{ejercicioId}/completar`, rol `ROLE_SOCIO`. Usado por la app (Fase 3, Task 18).

- [ ] **Step 1: Reemplazar `RutinaController.java` completo**

Archivo actual:
```java
package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
public class RutinaController {

    private final RutinaService rutinaService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<List<Map<String, Object>>> listarRutinas() {
        return ResponseEntity.ok(rutinaService.listarRutinas());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Object> crearRutina(@RequestBody RutinaRequest request) {
        if (Boolean.TRUE.equals(request.getEsGlobal())) {
            return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
        }

        return ResponseEntity.ok(rutinaService.crearRutinaPersonalizada(request));
    }

    @PostMapping("/global")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Map<String, Object>> crearRutinaGlobal(@RequestBody RutinaRequest request) {
        return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
    }
}
```

Reemplazar por:
```java
package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.services.EjercicioCompletadoService;
import ni.edu.uam.SpartanGymAPI.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
public class RutinaController {

    private final RutinaService rutinaService;
    private final EjercicioCompletadoService ejercicioCompletadoService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<List<Map<String, Object>>> listarRutinas() {
        return ResponseEntity.ok(rutinaService.listarRutinas());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Object> crearRutina(@RequestBody RutinaRequest request) {
        if (Boolean.TRUE.equals(request.getEsGlobal())) {
            return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
        }

        return ResponseEntity.ok(rutinaService.crearRutinaPersonalizada(request));
    }

    @PostMapping("/global")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Map<String, Object>> crearRutinaGlobal(@RequestBody RutinaRequest request) {
        return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
    }

    // El socio marca/desmarca su propio ejercicio de la rutina (socio sale del token, no del body).
    @PostMapping("/{rutinaId}/ejercicios/{ejercicioId}/completar")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<Void> marcarEjercicioCompletado(
            @PathVariable UUID rutinaId,
            @PathVariable Long ejercicioId,
            @RequestBody MarcarEjercicioRequest request,
            Authentication auth
    ) {
        ejercicioCompletadoService.marcarCompletado(auth.getName(), rutinaId, ejercicioId, request);
        return ResponseEntity.ok().build();
    }
}
```

- [ ] **Step 2: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/RutinaController.java
git commit -m "feat(api): agregar endpoint para marcar/desmarcar ejercicio completado"
```

---

### Task 9: `RutinaService` — mapear campos nuevos y progreso en `construirRutina`/`mapearRutina`

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/RutinaService.java`

**Interfaces:**
- Consumes: `EjercicioCompletadoService.calcularProgreso(Rutina)` (Task 7).
- Produces: `GET /api/rutinas` (usado por `Rutinas.jsx` en la Fase 2) ahora incluye `progresoSemana`, `completadosSemana`, `planificadosSemana` por rutina y `diaSemana`/`velocidadNivel`/`inclinacion`/`duracionSegundos`/`distanciaMetros`/`completadoEstaSemana` por ejercicio.

- [ ] **Step 1: Inyectar `EjercicioCompletadoService` y mapear los campos nuevos en `construirRutina`**

En `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/RutinaService.java`, agregar el campo tras `notificacionService` (línea 30):

```java
    private final NotificacionService notificacionService;
    private final EjercicioCompletadoService ejercicioCompletadoService;
```

Dentro de `construirRutina` (líneas 128-139), reemplazar:
```java
            RutinaDetalle detalle = new RutinaDetalle();
            detalle.setRutina(rutina);
            detalle.setEjercicio(ejercicio);
            detalle.setSeries(dto.getSeries());
            detalle.setRepeticiones(dto.getRepeticiones());
            detalle.setTipoEjercicio(textoOpcional(dto.getTipoEjercicio(), "Fuerza"));
            detalle.setDiaProgramado(dto.getDiaProgramado());
            detalle.setPesoSugeridoKg(dto.getPesoSugeridoKg());
            detalle.setTiempoDescansoSegundos(dto.getTiempoDescansoSegundos());
            detalle.setNotas(limpiarTexto(dto.getNotas()));
            detalle.setOrden(dto.getOrden());
```

por:
```java
            RutinaDetalle detalle = new RutinaDetalle();
            detalle.setRutina(rutina);
            detalle.setEjercicio(ejercicio);
            detalle.setSeries(dto.getSeries());
            detalle.setRepeticiones(dto.getRepeticiones());
            detalle.setTipoEjercicio(textoOpcional(dto.getTipoEjercicio(), "Fuerza"));
            detalle.setDiaProgramado(dto.getDiaProgramado());
            detalle.setDiaSemana(dto.getDiaSemana());
            detalle.setPesoSugeridoKg(dto.getPesoSugeridoKg());
            detalle.setVelocidadNivel(dto.getVelocidadNivel());
            detalle.setInclinacion(dto.getInclinacion());
            detalle.setDuracionSegundos(dto.getDuracionSegundos());
            detalle.setDistanciaMetros(dto.getDistanciaMetros());
            detalle.setTiempoDescansoSegundos(dto.getTiempoDescansoSegundos());
            detalle.setNotas(limpiarTexto(dto.getNotas()));
            detalle.setOrden(dto.getOrden());
```

- [ ] **Step 2: Reemplazar `mapearRutina` completo**

Método actual (líneas 204-239):
```java
    private Map<String, Object> mapearRutina(Rutina rutina) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenadorId", rutina.getEntrenador().getUsuarioId());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("nombre", rutina.getNombre());
        data.put("tipoRutina", rutina.getTipoRutina());
        data.put("generoObjetivo", rutina.getGeneroObjetivo());
        data.put("esGlobal", Boolean.TRUE.equals(rutina.getEsGlobal()));
        data.put("fechaInicio", rutina.getFechaInicio());
        data.put("fechaFin", rutina.getFechaFin());
        data.put("objetivo", rutina.getObjetivo());
        data.put("notas", rutina.getNotas());
        data.put("ejercicios", rutina.getDetalles().stream()
                .sorted(Comparator.comparing(detalle -> Objects.requireNonNullElse(detalle.getOrden(), 0)))
                .map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicioId", detalle.getEjercicio().getId());
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("grupoMuscular", detalle.getEjercicio().getGrupoMuscular().getNombre());
            ejercicio.put("grupoMuscularId", detalle.getEjercicio().getGrupoMuscular().getId());
            ejercicio.put("tipoEjercicio", detalle.getTipoEjercicio());
            ejercicio.put("diaProgramado", detalle.getDiaProgramado());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            ejercicio.put("notas", detalle.getNotas());
            ejercicio.put("orden", detalle.getOrden());
            return ejercicio;
        }).toList());
        return data;
    }
```

Reemplazar por:
```java
    private Map<String, Object> mapearRutina(Rutina rutina) {
        ProgresoSemana progresoSemana = ejercicioCompletadoService.calcularProgreso(rutina);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenadorId", rutina.getEntrenador().getUsuarioId());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("nombre", rutina.getNombre());
        data.put("tipoRutina", rutina.getTipoRutina());
        data.put("generoObjetivo", rutina.getGeneroObjetivo());
        data.put("esGlobal", Boolean.TRUE.equals(rutina.getEsGlobal()));
        data.put("fechaInicio", rutina.getFechaInicio());
        data.put("fechaFin", rutina.getFechaFin());
        data.put("objetivo", rutina.getObjetivo());
        data.put("notas", rutina.getNotas());
        data.put("progresoSemana", progresoSemana.progreso());
        data.put("completadosSemana", progresoSemana.completados());
        data.put("planificadosSemana", progresoSemana.planificados());
        data.put("ejercicios", rutina.getDetalles().stream()
                .sorted(Comparator.comparing(detalle -> Objects.requireNonNullElse(detalle.getOrden(), 0)))
                .map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicioId", detalle.getEjercicio().getId());
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("grupoMuscular", detalle.getEjercicio().getGrupoMuscular().getNombre());
            ejercicio.put("grupoMuscularId", detalle.getEjercicio().getGrupoMuscular().getId());
            ejercicio.put("tipoEjercicio", detalle.getTipoEjercicio());
            ejercicio.put("diaProgramado", detalle.getDiaProgramado());
            ejercicio.put("diaSemana", detalle.getDiaSemana());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("velocidadNivel", detalle.getVelocidadNivel());
            ejercicio.put("inclinacion", detalle.getInclinacion());
            ejercicio.put("duracionSegundos", detalle.getDuracionSegundos());
            ejercicio.put("distanciaMetros", detalle.getDistanciaMetros());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            ejercicio.put("notas", detalle.getNotas());
            ejercicio.put("orden", detalle.getOrden());
            ejercicio.put("completadoEstaSemana", progresoSemana.ejerciciosCompletadosIds().contains(detalle.getEjercicio().getId()));
            return ejercicio;
        }).toList());
        return data;
    }
```

- [ ] **Step 3: Agregar el import de `ProgresoSemana`**

Al inicio del archivo, la línea `import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;` cambia a:
```java
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
```

- [ ] **Step 4: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/RutinaService.java
git commit -m "feat(api): RutinaService mapea campos por tipo y progreso semanal real"
```

---

### Task 10: `OperacionController.rutinaMap` — progreso real para el endpoint que consume la app

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java`

**Interfaces:**
- Consumes: `EjercicioCompletadoService.calcularProgreso(Rutina)` (Task 7).
- Produces: `GET /api/operacion/socio/{socioId}/rutinas` (consumido por la app, Fase 3) ahora incluye `progresoSemana`, `completadosSemana`, `planificadosSemana` y por ejercicio `diaSemana`/`velocidadNivel`/`inclinacion`/`duracionSegundos`/`distanciaMetros`/`completadoEstaSemana`.

- [ ] **Step 1: Inyectar `EjercicioCompletadoService`**

Agregar el campo tras `notificacionRepository` (línea 26):
```java
    private final NotificacionRepository notificacionRepository;
    private final EjercicioCompletadoService ejercicioCompletadoService;
```

- [ ] **Step 2: Reemplazar `rutinaMap` completo**

Método actual (líneas 247-281):
```java
    private Map<String, Object> rutinaMap(Rutina rutina) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("nombre", rutina.getNombre());
        data.put("tipoRutina", rutina.getTipoRutina());
        data.put("generoObjetivo", rutina.getGeneroObjetivo());
        data.put("esGlobal", Boolean.TRUE.equals(rutina.getEsGlobal()));
        data.put("fechaInicio", rutina.getFechaInicio());
        data.put("fechaFin", rutina.getFechaFin());
        data.put("objetivo", rutina.getObjetivo());
        data.put("notas", rutina.getNotas());
        data.put("ejercicios", rutina.getDetalles().stream()
                .sorted(Comparator.comparing(detalle -> Objects.requireNonNullElse(detalle.getOrden(), 0)))
                .map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicioId", detalle.getEjercicio().getId());
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("grupoMuscular", detalle.getEjercicio().getGrupoMuscular().getNombre());
            ejercicio.put("grupoMuscularId", detalle.getEjercicio().getGrupoMuscular().getId());
            ejercicio.put("tipoEjercicio", detalle.getTipoEjercicio());
            ejercicio.put("diaProgramado", detalle.getDiaProgramado());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            ejercicio.put("notas", detalle.getNotas());
            ejercicio.put("orden", detalle.getOrden());
            return ejercicio;
        }).toList());
        return data;
    }
```

Reemplazar por:
```java
    private Map<String, Object> rutinaMap(Rutina rutina) {
        ProgresoSemana progresoSemana = ejercicioCompletadoService.calcularProgreso(rutina);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("nombre", rutina.getNombre());
        data.put("tipoRutina", rutina.getTipoRutina());
        data.put("generoObjetivo", rutina.getGeneroObjetivo());
        data.put("esGlobal", Boolean.TRUE.equals(rutina.getEsGlobal()));
        data.put("fechaInicio", rutina.getFechaInicio());
        data.put("fechaFin", rutina.getFechaFin());
        data.put("objetivo", rutina.getObjetivo());
        data.put("notas", rutina.getNotas());
        data.put("progresoSemana", progresoSemana.progreso());
        data.put("completadosSemana", progresoSemana.completados());
        data.put("planificadosSemana", progresoSemana.planificados());
        data.put("ejercicios", rutina.getDetalles().stream()
                .sorted(Comparator.comparing(detalle -> Objects.requireNonNullElse(detalle.getOrden(), 0)))
                .map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicioId", detalle.getEjercicio().getId());
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("grupoMuscular", detalle.getEjercicio().getGrupoMuscular().getNombre());
            ejercicio.put("grupoMuscularId", detalle.getEjercicio().getGrupoMuscular().getId());
            ejercicio.put("tipoEjercicio", detalle.getTipoEjercicio());
            ejercicio.put("diaProgramado", detalle.getDiaProgramado());
            ejercicio.put("diaSemana", detalle.getDiaSemana());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("velocidadNivel", detalle.getVelocidadNivel());
            ejercicio.put("inclinacion", detalle.getInclinacion());
            ejercicio.put("duracionSegundos", detalle.getDuracionSegundos());
            ejercicio.put("distanciaMetros", detalle.getDistanciaMetros());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            ejercicio.put("notas", detalle.getNotas());
            ejercicio.put("orden", detalle.getOrden());
            ejercicio.put("completadoEstaSemana", progresoSemana.ejerciciosCompletadosIds().contains(detalle.getEjercicio().getId()));
            return ejercicio;
        }).toList());
        return data;
    }
```

- [ ] **Step 3: Agregar el import de `ProgresoSemana` y `EjercicioCompletadoService`**

El archivo ya tiene `import ni.edu.uam.SpartanGymAPI.repositories.*;` — agregar tras el bloque de imports existente (después de `import java.time.LocalDate;`):
```java
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.services.EjercicioCompletadoService;
```

- [ ] **Step 4: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/controllers/OperacionController.java
git commit -m "feat(api): OperacionController.rutinaMap devuelve progreso semanal real"
```

---

### Task 11: `DashboardService` — progreso semanal en el dashboard de inicio

**Files:**
- Modify: `SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/DashboardService.java`

**Interfaces:**
- Consumes: `EjercicioCompletadoService.calcularProgreso(Rutina)` (Task 7).
- Produces: `GET /api/dashboard/inicio/{socioId}` ahora llena `progresoSemana`/`completadosSemana`/`planificadosSemana` de `DashboardResponse` (Task 6).

- [ ] **Step 1: Reemplazar el archivo completo**

Archivo actual:
```java
package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.DashboardResponse;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.ControlBiometricoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaRepository;
    private final ControlBiometricoRepository controlRepository;
    private final RutinaRepository rutinaRepository;

    public DashboardResponse obtenerDashboardInicio(UUID socioId) {
        DashboardResponse response = new DashboardResponse();

        // 1. Datos del Socio
        Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        response.setNombreCompleto(socio.getNombres() + " " + socio.getApellidos());
        response.setEstadoAcceso(socio.getEstadoAcceso());

        // 2. Estado de Membresía
        Optional<MembresiaSocio> membresiaActiva = membresiaRepository.findBySocioUsuarioIdAndEstado(socioId, "Activa");
        if (membresiaActiva.isPresent()) {
            response.setTipoMembresia(membresiaActiva.get().getTipoMembresia().getNombre());
            response.setFechaVencimiento(membresiaActiva.get().getFechaVencimiento());
        } else {
            response.setTipoMembresia("Sin Membresía Activa");
        }

        // 3. Último Progreso Físico
        List<ControlBiometrico> historial = controlRepository.findBySocioUsuarioIdOrderByFechaRegistroAsc(socioId);
        if (!historial.isEmpty()) {
            // Obtenemos el último de la lista
            ControlBiometrico ultimo = historial.get(historial.size() - 1);
            response.setUltimoPesoKg(ultimo.getPesoKg());
            response.setNotasMedidas(ultimo.getMedidasNotas());
        }

        // 4. Rutina Asignada (Optimizada en Base de Datos)
        List<Rutina> rutinasDelSocio = rutinaRepository.findBySocioUsuarioIdOrderByFechaAsignacionDesc(socioId);

        if (!rutinasDelSocio.isEmpty()) {
            Rutina r = rutinasDelSocio.get(0); // Tomamos la primera (la más reciente)
            response.setObjetivoRutina(r.getObjetivo());
            response.setNombreEntrenador(r.getEntrenador().getNombres() + " " + r.getEntrenador().getApellidos());
            response.setTotalEjercicios(r.getDetalles().size());
        } else {
            response.setObjetivoRutina("Sin rutina asignada");
            response.setNombreEntrenador("N/A");
            response.setTotalEjercicios(0);
        }

        return response;
    }
}
```

Reemplazar por:
```java
package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.DashboardResponse;
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.ControlBiometricoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaRepository;
    private final ControlBiometricoRepository controlRepository;
    private final RutinaRepository rutinaRepository;
    private final EjercicioCompletadoService ejercicioCompletadoService;

    public DashboardResponse obtenerDashboardInicio(UUID socioId) {
        DashboardResponse response = new DashboardResponse();

        // 1. Datos del Socio
        Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        response.setNombreCompleto(socio.getNombres() + " " + socio.getApellidos());
        response.setEstadoAcceso(socio.getEstadoAcceso());

        // 2. Estado de Membresía
        Optional<MembresiaSocio> membresiaActiva = membresiaRepository.findBySocioUsuarioIdAndEstado(socioId, "Activa");
        if (membresiaActiva.isPresent()) {
            response.setTipoMembresia(membresiaActiva.get().getTipoMembresia().getNombre());
            response.setFechaVencimiento(membresiaActiva.get().getFechaVencimiento());
        } else {
            response.setTipoMembresia("Sin Membresía Activa");
        }

        // 3. Último Progreso Físico
        List<ControlBiometrico> historial = controlRepository.findBySocioUsuarioIdOrderByFechaRegistroAsc(socioId);
        if (!historial.isEmpty()) {
            // Obtenemos el último de la lista
            ControlBiometrico ultimo = historial.get(historial.size() - 1);
            response.setUltimoPesoKg(ultimo.getPesoKg());
            response.setNotasMedidas(ultimo.getMedidasNotas());
        }

        // 4. Rutina Asignada (Optimizada en Base de Datos)
        List<Rutina> rutinasDelSocio = rutinaRepository.findBySocioUsuarioIdOrderByFechaAsignacionDesc(socioId);

        if (!rutinasDelSocio.isEmpty()) {
            Rutina r = rutinasDelSocio.get(0); // Tomamos la primera (la más reciente)
            response.setObjetivoRutina(r.getObjetivo());
            response.setNombreEntrenador(r.getEntrenador().getNombres() + " " + r.getEntrenador().getApellidos());
            response.setTotalEjercicios(r.getDetalles().size());

            ProgresoSemana progresoSemana = ejercicioCompletadoService.calcularProgreso(r);
            response.setProgresoSemana(progresoSemana.progreso());
            response.setCompletadosSemana(progresoSemana.completados());
            response.setPlanificadosSemana(progresoSemana.planificados());
        } else {
            response.setObjetivoRutina("Sin rutina asignada");
            response.setNombreEntrenador("N/A");
            response.setTotalEjercicios(0);
            response.setProgresoSemana(0.0);
            response.setCompletadosSemana(0);
            response.setPlanificadosSemana(0);
        }

        return response;
    }
}
```

- [ ] **Step 2: Verificar que compila**

```powershell
.\mvnw.cmd -q compile
```
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add SpartanGymAPI/src/main/java/ni/edu/uam/SpartanGymAPI/services/DashboardService.java
git commit -m "feat(api): DashboardService calcula progreso semanal real de la rutina actual"
```

---

### Task 12: Verificación end-to-end de la API (build completo + tests + smoke manual contra BD)

**Files:** (ninguno — tarea de verificación)

- [ ] **Step 1: Correr toda la suite de tests**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd SpartanGymAPI
.\mvnw.cmd test
```
Expected: BUILD SUCCESS — incluye `RangoSemanaTest` (3), `EjercicioCompletadoServiceTest` (5), y `SpartanGymApiApplicationTests.contextLoads` (1), 0 failures.

- [ ] **Step 2: Copiar `application-local.properties` desde el checkout principal (ver Global Constraints) si no está ya copiado**

- [ ] **Step 3: Aplicar la migración SQL de la Task 1 contra la base del perfil `local`**

Usar el cliente psql apuntando a la misma base que `application-local.properties`. Ejecutar el bloque SQL agregado en la Task 1 (sección "5. Progreso semanal..." de `spartan_gym_schema.sql`).

- [ ] **Step 4: Levantar la API localmente**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\mvnw.cmd spring-boot:run
```
Expected: arranca sin excepciones, log `Started SpartanGymApiApplication`.

- [ ] **Step 5: Smoke test manual con curl — login de un socio de prueba**

```powershell
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"<email-de-un-socio-sembrado>\",\"password\":\"admin123\"}'
```
Guardar el `token` de la respuesta.

- [ ] **Step 6: Smoke test — marcar un ejercicio completado y verificar que el progreso cambia**

```powershell
# Obtener rutinas del socio (tomar un rutinaId y ejercicioId real del body)
curl http://localhost:8080/api/operacion/socio/<socioId>/rutinas -H "Authorization: Bearer <token>"

# Marcar el primer ejercicio como completado
curl -X POST http://localhost:8080/api/rutinas/<rutinaId>/ejercicios/<ejercicioId>/completar -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{\"completado\":true}'

# Volver a pedir las rutinas: progresoSemana debe haber subido y ese ejercicio debe traer completadoEstaSemana=true
curl http://localhost:8080/api/operacion/socio/<socioId>/rutinas -H "Authorization: Bearer <token>"
```
Expected: la segunda llamada a `.../rutinas` muestra `completadoEstaSemana: true` en ese ejercicio y `progresoSemana` mayor que en la primera llamada. Repetir el POST con el mismo body no debe crear un segundo registro (idempotente) — confirmar revisando `SELECT COUNT(*) FROM ejercicios_completados WHERE rutina_id='<rutinaId>' AND ejercicio_id=<ejercicioId>;` = 1.

- [ ] **Step 7: Smoke test — desmarcar**

```powershell
curl -X POST http://localhost:8080/api/rutinas/<rutinaId>/ejercicios/<ejercicioId>/completar -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{\"completado\":false}'
```
Expected: 200 OK; `SELECT COUNT(*)...` de la fila = 0; siguiente `GET .../rutinas` muestra `completadoEstaSemana: false` y `progresoSemana` baja de nuevo.

- [ ] **Step 8: Smoke test — ownership check**

Repetir el Step 6 pero con el token de un socio **distinto** al dueño de la rutina.
Expected: `403 Forbidden` con body `"No tienes permisos para realizar esta acción."` (viene de `GlobalExceptionHandler.handleAccessDenied`).

- [ ] **Step 9: Detener el servidor (Ctrl+C) y no commitear nada en esta tarea** (es solo verificación).

---

## Fase 2 — SpartanGymWeb

### Task 13: `Rutinas.jsx` — campos condicionales por `tipoEjercicio` + día de la semana

**Files:**
- Modify: `SpartanGymWeb/src/pages/Admin/sub_pages/Rutinas.jsx`

**Interfaces:**
- Produces: el payload que `guardarRutina` envía a `POST /api/rutinas` ahora incluye `diaSemana` y los 4 campos alternativos, y omite `series`/`repeticiones`/`pesoSugeridoKg` cuando el tipo no los usa (coincide con `RutinaDetalleRequest`, Task 6).

- [ ] **Step 1: Reemplazar las constantes del inicio del archivo (líneas 18-19)**

Actual:
```jsx
const tiposRutina = ['Hipertrofia', 'Fuerza', 'Definicion', 'Resistencia', 'Salud'];
const tiposEjercicio = ['Fuerza', 'Cardio', 'Movilidad', 'Funcional', 'Estiramiento'];
```

Reemplazar por:
```jsx
const tiposRutina = ['Hipertrofia', 'Fuerza', 'Definicion', 'Resistencia', 'Salud'];
const tiposEjercicio = ['Fuerza', 'Cardio', 'Movilidad', 'Funcional', 'Estiramiento'];

const diasSemana = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 7, label: 'Domingo' },
];

// Campos numericos por tipo de ejercicio: requeridos deben tener valor para poder guardar,
// opcionales se envian solo si el entrenador los llena. Cardio/Movilidad/Estiramiento ya no
// muestran ni exigen series/repeticiones/peso pensados para Fuerza.
const CAMPOS_POR_TIPO = {
  Fuerza: { requeridos: ['series', 'repeticiones'], opcionales: ['pesoSugeridoKg', 'tiempoDescansoSegundos'] },
  Cardio: { requeridos: ['duracionSegundos'], opcionales: ['velocidadNivel', 'inclinacion', 'distanciaMetros', 'tiempoDescansoSegundos'] },
  Movilidad: { requeridos: ['duracionSegundos'], opcionales: ['repeticiones'] },
  Estiramiento: { requeridos: ['duracionSegundos'], opcionales: ['repeticiones'] },
  Funcional: { requeridos: ['series', 'repeticiones'], opcionales: ['duracionSegundos', 'tiempoDescansoSegundos'] },
};

const ETIQUETAS_CAMPO = {
  series: 'Series',
  repeticiones: 'Reps',
  pesoSugeridoKg: 'Peso kg',
  tiempoDescansoSegundos: 'Descanso (s)',
  velocidadNivel: 'Vel/Nivel',
  inclinacion: 'Inclinacion %',
  duracionSegundos: 'Duracion (s)',
  distanciaMetros: 'Distancia (m)',
};

const camposDeTipo = (tipo) => CAMPOS_POR_TIPO[tipo] || CAMPOS_POR_TIPO.Fuerza;
```

- [ ] **Step 2: Reemplazar `crearDetalleInicial` (líneas 51-67)**

Actual:
```jsx
const crearDetalleInicial = (ejercicios = [], fecha = obtenerFechaIso(), orden = 1) => {
  const ejercicio = ejercicios[0];

  return {
    grupoMuscularId: ejercicio?.grupoMuscular?.id ? String(ejercicio.grupoMuscular.id) : '',
    idEjercicio: ejercicio?.id ? String(ejercicio.id) : '',
    ejercicioNombre: ejercicio?.nombre || '',
    tipoEjercicio: 'Fuerza',
    diaProgramado: fecha,
    series: 3,
    repeticiones: 12,
    pesoSugeridoKg: '',
    tiempoDescansoSegundos: 60,
    notas: '',
    orden,
  };
};
```

Reemplazar por:
```jsx
const crearDetalleInicial = (ejercicios = [], orden = 1) => {
  const ejercicio = ejercicios[0];

  return {
    grupoMuscularId: ejercicio?.grupoMuscular?.id ? String(ejercicio.grupoMuscular.id) : '',
    idEjercicio: ejercicio?.id ? String(ejercicio.id) : '',
    ejercicioNombre: ejercicio?.nombre || '',
    tipoEjercicio: 'Fuerza',
    diaSemana: 1,
    series: 3,
    repeticiones: 12,
    pesoSugeridoKg: '',
    tiempoDescansoSegundos: 60,
    velocidadNivel: '',
    inclinacion: '',
    duracionSegundos: '',
    distanciaMetros: '',
    notas: '',
    orden,
  };
};
```

- [ ] **Step 3: Actualizar el llamador en `crearFormularioInicial` (línea 80) — sin cambios de firma, sigue funcionando** (llama `crearDetalleInicial()` sin argumentos, compatible con la nueva firma por defaults).

- [ ] **Step 4: Actualizar el llamador en `agregarDetalle` (líneas 226-234)**

Actual:
```jsx
  const agregarDetalle = () => {
    setFormulario((actual) => ({
      ...actual,
      detalles: [
        ...actual.detalles,
        crearDetalleInicial(ejercicios, actual.fechaInicio || obtenerFechaIso(), actual.detalles.length + 1),
      ],
    }));
  };
```

Reemplazar por:
```jsx
  const agregarDetalle = () => {
    setFormulario((actual) => ({
      ...actual,
      detalles: [
        ...actual.detalles,
        crearDetalleInicial(ejercicios, actual.detalles.length + 1),
      ],
    }));
  };
```

- [ ] **Step 5: Reemplazar `construirPayload` (líneas 245-267)**

Actual:
```jsx
  const construirPayload = () => ({
    idSocio: formulario.alcance === 'global' ? null : formulario.idSocio,
    idEntrenador: formulario.idEntrenador,
    esGlobal: formulario.alcance === 'global',
    nombre: formulario.nombre.trim(),
    tipoRutina: formulario.tipoRutina,
    generoObjetivo: formulario.generoObjetivo,
    fechaInicio: formulario.fechaInicio || null,
    fechaFin: formulario.fechaFin || null,
    objetivo: formulario.objetivo.trim(),
    notas: formulario.notas.trim() || null,
    detalles: formulario.detalles.map((detalle, index) => ({
      idEjercicio: Number(detalle.idEjercicio),
      tipoEjercicio: detalle.tipoEjercicio,
      diaProgramado: detalle.diaProgramado || null,
      series: Number(detalle.series),
      repeticiones: Number(detalle.repeticiones),
      pesoSugeridoKg: detalle.pesoSugeridoKg === '' ? null : Number(detalle.pesoSugeridoKg),
      tiempoDescansoSegundos: detalle.tiempoDescansoSegundos === '' ? null : Number(detalle.tiempoDescansoSegundos),
      notas: detalle.notas.trim() || null,
      orden: index + 1,
    })),
  });
```

Reemplazar por:
```jsx
  const construirPayload = () => ({
    idSocio: formulario.alcance === 'global' ? null : formulario.idSocio,
    idEntrenador: formulario.idEntrenador,
    esGlobal: formulario.alcance === 'global',
    nombre: formulario.nombre.trim(),
    tipoRutina: formulario.tipoRutina,
    generoObjetivo: formulario.generoObjetivo,
    fechaInicio: formulario.fechaInicio || null,
    fechaFin: formulario.fechaFin || null,
    objetivo: formulario.objetivo.trim(),
    notas: formulario.notas.trim() || null,
    detalles: formulario.detalles.map((detalle, index) => {
      const campos = camposDeTipo(detalle.tipoEjercicio);
      const activos = [...campos.requeridos, ...campos.opcionales];
      const numeroONull = (campo) => (
        activos.includes(campo) && detalle[campo] !== '' && detalle[campo] != null
          ? Number(detalle[campo])
          : null
      );

      return {
        idEjercicio: Number(detalle.idEjercicio),
        tipoEjercicio: detalle.tipoEjercicio,
        diaProgramado: null,
        diaSemana: Number(detalle.diaSemana),
        series: numeroONull('series'),
        repeticiones: numeroONull('repeticiones'),
        pesoSugeridoKg: numeroONull('pesoSugeridoKg'),
        tiempoDescansoSegundos: numeroONull('tiempoDescansoSegundos'),
        velocidadNivel: numeroONull('velocidadNivel'),
        inclinacion: numeroONull('inclinacion'),
        duracionSegundos: numeroONull('duracionSegundos'),
        distanciaMetros: numeroONull('distanciaMetros'),
        notas: detalle.notas.trim() || null,
        orden: index + 1,
      };
    }),
  });
```

- [ ] **Step 6: Reemplazar la validación `formularioInvalido` (líneas 303-311)**

Actual:
```jsx
  const formularioInvalido =
    guardando ||
    cargando ||
    !ejercicios.length ||
    !formulario.idEntrenador ||
    !formulario.nombre.trim() ||
    !formulario.objetivo.trim() ||
    (formulario.alcance === 'personal' && !formulario.idSocio) ||
    formulario.detalles.some((detalle) => !detalle.idEjercicio || !detalle.series || !detalle.repeticiones);
```

Reemplazar por:
```jsx
  const formularioInvalido =
    guardando ||
    cargando ||
    !ejercicios.length ||
    !formulario.idEntrenador ||
    !formulario.nombre.trim() ||
    !formulario.objetivo.trim() ||
    (formulario.alcance === 'personal' && !formulario.idSocio) ||
    formulario.detalles.some((detalle) => {
      if (!detalle.idEjercicio || !detalle.diaSemana) return true;
      const { requeridos } = camposDeTipo(detalle.tipoEjercicio);
      return requeridos.some((campo) => detalle[campo] === '' || detalle[campo] == null);
    });
```

- [ ] **Step 7: Reemplazar el bloque de campos del ejercicio en el render (líneas 500-540)**

Actual:
```jsx
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.25fr_150px_150px_100px_100px_110px_120px]">
                      <CampoSelect
                        label="Grupo muscular"
                        value={detalle.grupoMuscularId}
                        onChange={(valor) => actualizarDetalle(index, 'grupoMuscularId', valor)}
                      >
                        <option value="">Selecciona grupo</option>
                        {gruposMusculares.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                        ))}
                      </CampoSelect>

                      <CampoEjercicioTexto
                        label="Ejercicio"
                        value={detalle.ejercicioNombre || ''}
                        opciones={ejerciciosGrupo}
                        listId={`ejercicios-rutina-${index}`}
                        onChange={(valor) => actualizarEjercicioPorNombre(index, valor, ejerciciosGrupo)}
                      />

                      <CampoSelect
                        label="Tipo ejercicio"
                        value={detalle.tipoEjercicio}
                        onChange={(valor) => actualizarDetalle(index, 'tipoEjercicio', valor)}
                      >
                        {tiposEjercicio.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </CampoSelect>

                      <CampoFecha
                        label="Fecha"
                        value={detalle.diaProgramado}
                        min={formulario.fechaInicio}
                        max={formulario.fechaFin || undefined}
                        onChange={(valor) => actualizarDetalle(index, 'diaProgramado', valor)}
                      />

                      <CampoNumero label="Series" value={detalle.series} onChange={(valor) => actualizarDetalle(index, 'series', valor)} />
                      <CampoNumero label="Reps" value={detalle.repeticiones} onChange={(valor) => actualizarDetalle(index, 'repeticiones', valor)} />
                      <CampoNumero label="Peso kg" value={detalle.pesoSugeridoKg} onChange={(valor) => actualizarDetalle(index, 'pesoSugeridoKg', valor)} requerido={false} />
                      <CampoNumero label="Descanso" value={detalle.tiempoDescansoSegundos} onChange={(valor) => actualizarDetalle(index, 'tiempoDescansoSegundos', valor)} requerido={false} />
                    </div>
```

Reemplazar por:
```jsx
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <CampoSelect
                        label="Grupo muscular"
                        value={detalle.grupoMuscularId}
                        onChange={(valor) => actualizarDetalle(index, 'grupoMuscularId', valor)}
                      >
                        <option value="">Selecciona grupo</option>
                        {gruposMusculares.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                        ))}
                      </CampoSelect>

                      <CampoEjercicioTexto
                        label="Ejercicio"
                        value={detalle.ejercicioNombre || ''}
                        opciones={ejerciciosGrupo}
                        listId={`ejercicios-rutina-${index}`}
                        onChange={(valor) => actualizarEjercicioPorNombre(index, valor, ejerciciosGrupo)}
                      />

                      <CampoSelect
                        label="Tipo ejercicio"
                        value={detalle.tipoEjercicio}
                        onChange={(valor) => actualizarDetalle(index, 'tipoEjercicio', valor)}
                      >
                        {tiposEjercicio.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </CampoSelect>

                      <CampoSelect
                        label="Dia de la semana"
                        value={String(detalle.diaSemana)}
                        onChange={(valor) => actualizarDetalle(index, 'diaSemana', Number(valor))}
                      >
                        {diasSemana.map((dia) => <option key={dia.value} value={dia.value}>{dia.label}</option>)}
                      </CampoSelect>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      {[...camposDeTipo(detalle.tipoEjercicio).requeridos, ...camposDeTipo(detalle.tipoEjercicio).opcionales].map((campo) => (
                        <div key={campo} className="w-28">
                          <CampoNumero
                            label={ETIQUETAS_CAMPO[campo]}
                            value={detalle[campo]}
                            onChange={(valor) => actualizarDetalle(index, campo, valor)}
                            requerido={camposDeTipo(detalle.tipoEjercicio).requeridos.includes(campo)}
                          />
                        </div>
                      ))}
                    </div>
```

- [ ] **Step 8: Actualizar `normalizarDetalles` (líneas 634-652) para el nuevo campo `diaSemana`**

Actual:
```jsx
const normalizarDetalles = (detalles, ejercicios) => {
  if (!detalles?.length) {
    return [crearDetalleInicial(ejercicios)];
  }

  return detalles.map((detalle, index) => {
    const ejercicioActual = ejercicios.find((ejercicio) => String(ejercicio.id) === String(detalle.idEjercicio)) || ejercicios[0];
    return {
      ...detalle,
      grupoMuscularId: detalle.grupoMuscularId || (ejercicioActual?.grupoMuscular?.id ? String(ejercicioActual.grupoMuscular.id) : ''),
      idEjercicio: detalle.idEjercicio || (ejercicioActual?.id ? String(ejercicioActual.id) : ''),
      ejercicioNombre: detalle.ejercicioNombre || ejercicioActual?.nombre || '',
      diaProgramado: detalle.diaProgramado || obtenerFechaIso(),
      tipoEjercicio: detalle.tipoEjercicio || 'Fuerza',
      notas: detalle.notas || '',
      orden: index + 1,
    };
  });
};
```

Reemplazar por:
```jsx
const normalizarDetalles = (detalles, ejercicios) => {
  if (!detalles?.length) {
    return [crearDetalleInicial(ejercicios)];
  }

  return detalles.map((detalle, index) => {
    const ejercicioActual = ejercicios.find((ejercicio) => String(ejercicio.id) === String(detalle.idEjercicio)) || ejercicios[0];
    return {
      ...detalle,
      grupoMuscularId: detalle.grupoMuscularId || (ejercicioActual?.grupoMuscular?.id ? String(ejercicioActual.grupoMuscular.id) : ''),
      idEjercicio: detalle.idEjercicio || (ejercicioActual?.id ? String(ejercicioActual.id) : ''),
      ejercicioNombre: detalle.ejercicioNombre || ejercicioActual?.nombre || '',
      diaSemana: detalle.diaSemana || 1,
      tipoEjercicio: detalle.tipoEjercicio || 'Fuerza',
      notas: detalle.notas || '',
      orden: index + 1,
    };
  });
};
```

- [ ] **Step 9: Verificación manual en el navegador**

```powershell
cd SpartanGymWeb
npm run dev
```
Abrir `Constructor de rutinas` (Admin) en el navegador:
1. Con tipo "Fuerza" seleccionado: deben verse Series/Reps/Peso kg/Descanso (s), y el botón "Asignar rutina" debe estar deshabilitado si Series o Reps están vacíos.
2. Cambiar el tipo del ejercicio a "Cardio": los campos deben cambiar a Duración (s) / Vel-Nivel / Inclinación % / Distancia (m) / Descanso (s) — **ya no debe verse "Series" ni "Reps" ni "Peso kg"**.
3. Con Cardio seleccionado y "Duración (s)" vacío, el botón debe seguir deshabilitado (es requerido para ese tipo); llenarlo lo habilita sin necesidad de llenar Series/Reps.
4. Guardar una rutina con un ejercicio Cardio y confirmar en Network que el POST a `/api/rutinas` manda `"series": null, "repeticiones": null, "duracionSegundos": <valor>, "diaSemana": <1-7>`.

- [ ] **Step 10: Commit**

```bash
git add SpartanGymWeb/src/pages/Admin/sub_pages/Rutinas.jsx
git commit -m "feat(web): campos condicionales por tipo de ejercicio y dia de la semana en constructor de rutinas"
```

---

### Task 14: `Rutinas.jsx` — columna de progreso semanal en el historial

**Files:**
- Modify: `SpartanGymWeb/src/pages/Admin/sub_pages/Rutinas.jsx`

**Interfaces:**
- Consumes: `rutina.progresoSemana` (0–1) devuelto por `GET /api/rutinas` (Task 9).

- [ ] **Step 1: Agregar la columna al encabezado de la tabla (línea 594)**

Actual:
```jsx
                <th className="pb-3 pr-4">Ejercicios</th>
                <th className="pb-3">Asignada</th>
```

Reemplazar por:
```jsx
                <th className="pb-3 pr-4">Ejercicios</th>
                <th className="pb-3 pr-4">Progreso semana</th>
                <th className="pb-3">Asignada</th>
```

- [ ] **Step 2: Agregar la celda al cuerpo de la tabla (línea 615)**

Actual:
```jsx
                  <td className="py-4 pr-4 text-gray-400">{rutina.ejercicios?.length || 0}</td>
                  <td className="py-4 text-gray-500">{rutina.fechaAsignacion ? new Date(rutina.fechaAsignacion).toLocaleDateString('es-NI') : 'N/A'}</td>
```

Reemplazar por:
```jsx
                  <td className="py-4 pr-4 text-gray-400">{rutina.ejercicios?.length || 0}</td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.round((rutina.progresoSemana || 0) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-300">{Math.round((rutina.progresoSemana || 0) * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-500">{rutina.fechaAsignacion ? new Date(rutina.fechaAsignacion).toLocaleDateString('es-NI') : 'N/A'}</td>
```

- [ ] **Step 3: Actualizar el `colSpan` del mensaje "sin rutinas" (línea 621)**

Actual:
```jsx
                  <td colSpan="7" className="py-10 text-center text-sm text-gray-500">
```

Reemplazar por:
```jsx
                  <td colSpan="8" className="py-10 text-center text-sm text-gray-500">
```

- [ ] **Step 4: Verificación manual**

Con `npm run dev` corriendo, en la tabla "Rutinas asignadas" cada fila debe mostrar una barra + porcentaje bajo "Progreso semana". Marcar un ejercicio completado desde la app (o vía curl, Task 12 Step 6) y recargar la página: el porcentaje debe reflejar el cambio.

- [ ] **Step 5: Commit**

```bash
git add SpartanGymWeb/src/pages/Admin/sub_pages/Rutinas.jsx
git commit -m "feat(web): mostrar progreso semanal del socio en el historial de rutinas"
```

---

## Fase 3 — SpartanGymApp

### Task 15: DTOs Kotlin — extender `EjercicioRutinaResponse`/`RutinaResumenResponse` + nuevo `MarcarEjercicioRequest`

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/AuthModels.kt`

**Interfaces:**
- Produces: `EjercicioRutinaResponse` con `diaSemana`, `velocidadNivel`, `inclinacion`, `duracionSegundos`, `distanciaMetros`, `completadoEstaSemana`; `RutinaResumenResponse` con `progresoSemana`; `MarcarEjercicioRequest(completado: Boolean, fecha: String? = null)`. Usado por Task 16 (`SpartanGymApi`) y Task 17 (`PantallaUsuario`).

- [ ] **Step 1: Reemplazar `EjercicioRutinaResponse` (líneas 169-182)**

Actual:
```kotlin
data class EjercicioRutinaResponse(
    val ejercicioId: Long? = null,
    val ejercicio: String? = null,
    val grupoMuscular: String? = null,
    val grupoMuscularId: Int? = null,
    val tipoEjercicio: String? = null,
    val diaProgramado: String? = null,
    val series: Int? = null,
    val repeticiones: Int? = null,
    val pesoSugeridoKg: Double? = null,
    val tiempoDescansoSegundos: Int? = null,
    val notas: String? = null,
    val orden: Int? = null
)
```

Reemplazar por:
```kotlin
data class EjercicioRutinaResponse(
    val ejercicioId: Long? = null,
    val ejercicio: String? = null,
    val grupoMuscular: String? = null,
    val grupoMuscularId: Int? = null,
    val tipoEjercicio: String? = null,
    val diaProgramado: String? = null,
    val diaSemana: Int? = null,
    val series: Int? = null,
    val repeticiones: Int? = null,
    val pesoSugeridoKg: Double? = null,
    val velocidadNivel: Double? = null,
    val inclinacion: Double? = null,
    val duracionSegundos: Int? = null,
    val distanciaMetros: Double? = null,
    val tiempoDescansoSegundos: Int? = null,
    val notas: String? = null,
    val orden: Int? = null,
    val completadoEstaSemana: Boolean? = null
)
```

- [ ] **Step 2: Reemplazar `RutinaResumenResponse` (líneas 184-199)**

Actual:
```kotlin
data class RutinaResumenResponse(
    val id: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val entrenador: String? = null,
    val fechaAsignacion: String? = null,
    val nombre: String? = null,
    val tipoRutina: String? = null,
    val generoObjetivo: String? = null,
    val esGlobal: Boolean? = null,
    val fechaInicio: String? = null,
    val fechaFin: String? = null,
    val objetivo: String? = null,
    val notas: String? = null,
    val ejercicios: List<EjercicioRutinaResponse>? = emptyList()
)
```

Reemplazar por:
```kotlin
data class RutinaResumenResponse(
    val id: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val entrenador: String? = null,
    val fechaAsignacion: String? = null,
    val nombre: String? = null,
    val tipoRutina: String? = null,
    val generoObjetivo: String? = null,
    val esGlobal: Boolean? = null,
    val fechaInicio: String? = null,
    val fechaFin: String? = null,
    val objetivo: String? = null,
    val notas: String? = null,
    val progresoSemana: Double? = null,
    val ejercicios: List<EjercicioRutinaResponse>? = emptyList()
)
```

- [ ] **Step 3: Agregar `MarcarEjercicioRequest` después de `RutinaRequest` (tras la línea 248)**

Insertar entre el cierre de `RutinaRequest` (línea 248, `)`) y `data class EntrenadorDashboardResponse` (línea 250):
```kotlin
data class MarcarEjercicioRequest(
    val completado: Boolean,
    val fecha: String? = null
)

```

- [ ] **Step 4: Commit**

```bash
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/AuthModels.kt
git commit -m "feat(app): extender DTOs de rutina con progreso semanal y campos por tipo"
```

---

### Task 16: `SpartanGymApi` — endpoint para marcar/desmarcar

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/SpartanGymApi.kt`

**Interfaces:**
- Consumes: `MarcarEjercicioRequest` (Task 15).
- Produces: `SpartanGymApi.marcarEjercicioCompletado(rutinaId: String, ejercicioId: Long, request: MarcarEjercicioRequest): Response<ResponseBody>`. Usado por Task 17.

- [ ] **Step 1: Agregar el método a la interfaz, después de `crearRutina` (línea 98)**

Actual (final del archivo, líneas 95-99):
```kotlin
    @POST("api/rutinas")
    suspend fun crearRutina(
        @Body request: RutinaRequest
    ): Response<ResponseBody>
}
```

Reemplazar por:
```kotlin
    @POST("api/rutinas")
    suspend fun crearRutina(
        @Body request: RutinaRequest
    ): Response<ResponseBody>

    @POST("api/rutinas/{rutinaId}/ejercicios/{ejercicioId}/completar")
    suspend fun marcarEjercicioCompletado(
        @Path("rutinaId") rutinaId: String,
        @Path("ejercicioId") ejercicioId: Long,
        @Body request: MarcarEjercicioRequest
    ): Response<ResponseBody>
}
```

- [ ] **Step 2: Commit**

```bash
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/network/SpartanGymApi.kt
git commit -m "feat(app): agregar endpoint marcarEjercicioCompletado a SpartanGymApi"
```

---

### Task 17: `PantallaUsuario.kt` — progreso real + persistir completado + detalle por tipo

**Files:**
- Modify: `SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt`

**Interfaces:**
- Consumes: `RetrofitClient.apiService.marcarEjercicioCompletado(...)` (Task 16), `RutinaResumenResponse.progresoSemana`, `EjercicioRutinaResponse.{ejercicioId,tipoEjercicio,velocidadNivel,inclinacion,duracionSegundos,distanciaMetros,completadoEstaSemana}` (Task 15).

- [ ] **Step 1: Agregar `id`/`ejercicioId`/`tipoEjercicio` a los modelos internos (líneas 98-113)**

Actual:
```kotlin
private data class EjercicioSocio(
    val nombre: String,
    val detalle: String,
    val zona: String,
    val completado: Boolean = false
)

private data class RutinaSocio(
    val nombre: String,
    val objetivo: String,
    val dificultad: String,
    val dias: Int,
    val foco: String,
    val progreso: Float,
    val ejercicios: List<EjercicioSocio>
)
```

Reemplazar por:
```kotlin
private data class EjercicioSocio(
    val ejercicioId: Long,
    val nombre: String,
    val detalle: String,
    val zona: String,
    val completado: Boolean = false
)

private data class RutinaSocio(
    val id: String,
    val nombre: String,
    val objetivo: String,
    val dificultad: String,
    val dias: Int,
    val foco: String,
    val progreso: Float,
    val ejercicios: List<EjercicioSocio>
)
```

- [ ] **Step 2: Reemplazar `toRutinaSocio` (líneas 120-144) para usar datos reales y armar el detalle por tipo**

Actual:
```kotlin
private fun RutinaResumenResponse.toRutinaSocio(index: Int): RutinaSocio {
    val ejerciciosMapeados = ejercicios.orEmpty().map { e ->
        val partes = listOfNotNull(
            e.series?.let { "$it series" },
            e.repeticiones?.let { "$it reps" },
            e.pesoSugeridoKg?.let { "${it}kg" },
            e.tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
        EjercicioSocio(
            nombre = e.ejercicio ?: "Ejercicio ${index + 1}",
            detalle = partes.joinToString(" · ").ifBlank { "—" },
            zona = e.grupoMuscular ?: "General"
        )
    }
    val zonas = ejerciciosMapeados.map { it.zona }.distinct().take(3).joinToString(" · ")
    return RutinaSocio(
        nombre = nombre?.ifBlank { null } ?: objetivo?.ifBlank { null } ?: "Rutina ${index + 1}",
        objetivo = objetivo ?: "—",
        dificultad = tipoRutina?.ifBlank { null } ?: "Asignada",
        dias = ejerciciosMapeados.size,
        foco = zonas.ifBlank { "—" },
        progreso = 0f,
        ejercicios = ejerciciosMapeados
    )
}
```

Reemplazar por:
```kotlin
private fun EjercicioRutinaResponse.detalleTexto(): String {
    val partes = if (tipoEjercicio == "Cardio") {
        listOfNotNull(
            duracionSegundos?.let { "${it / 60} min" },
            velocidadNivel?.let { "${it} vel/nivel" },
            inclinacion?.let { "${it}% incl" },
            distanciaMetros?.let { "${it}m" },
            tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
    } else {
        listOfNotNull(
            series?.let { "$it series" },
            repeticiones?.let { "$it reps" },
            pesoSugeridoKg?.let { "${it}kg" },
            duracionSegundos?.let { "${it / 60} min" },
            tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
    }
    return partes.joinToString(" · ").ifBlank { "—" }
}

private fun RutinaResumenResponse.toRutinaSocio(index: Int): RutinaSocio {
    val ejerciciosMapeados = ejercicios.orEmpty().mapNotNull { e ->
        val ejercicioId = e.ejercicioId ?: return@mapNotNull null
        EjercicioSocio(
            ejercicioId = ejercicioId,
            nombre = e.ejercicio ?: "Ejercicio ${index + 1}",
            detalle = e.detalleTexto(),
            zona = e.grupoMuscular ?: "General",
            completado = e.completadoEstaSemana ?: false
        )
    }
    val zonas = ejerciciosMapeados.map { it.zona }.distinct().take(3).joinToString(" · ")
    return RutinaSocio(
        id = id.orEmpty(),
        nombre = nombre?.ifBlank { null } ?: objetivo?.ifBlank { null } ?: "Rutina ${index + 1}",
        objetivo = objetivo ?: "—",
        dificultad = tipoRutina?.ifBlank { null } ?: "Asignada",
        dias = ejerciciosMapeados.size,
        foco = zonas.ifBlank { "—" },
        progreso = (progresoSemana ?: 0.0).toFloat(),
        ejercicios = ejerciciosMapeados
    )
}
```

- [ ] **Step 3: Reemplazar el wiring de `onToggleEjercicio` (líneas 242-252) para llamar al backend con actualización optimista**

Ubicación: dentro de `PantallaUsuario`, bloque `when { ... subPantalla == "rutina_detalle" ... }`. Primero, agregar un `CoroutineScope` a nivel de `PantallaUsuario` — buscar la declaración de estado cerca de la línea 174 (`var error by remember...`) y agregar justo después:

```kotlin
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
```

Luego, reemplazar el bloque actual:
```kotlin
                    subPantalla == "rutina_detalle" && rutinas.isNotEmpty() ->
                        DetalleRutinaUsuario(
                            rutina = rutinas[rutinaSeleccionada],
                            onToggleEjercicio = { idx ->
                                val r = rutinas[rutinaSeleccionada]
                                val lista = r.ejercicios.toMutableList()
                                lista[idx] = lista[idx].copy(completado = !lista[idx].completado)
                                rutinas[rutinaSeleccionada] = r.copy(ejercicios = lista)
                            },
                            onVolver = { subPantalla = "" }
                        )
```

por:
```kotlin
                    subPantalla == "rutina_detalle" && rutinas.isNotEmpty() ->
                        DetalleRutinaUsuario(
                            rutina = rutinas[rutinaSeleccionada],
                            onToggleEjercicio = { idx ->
                                val posicionRutina = rutinaSeleccionada
                                val r = rutinas[posicionRutina]
                                val ejercicio = r.ejercicios[idx]
                                val nuevoEstado = !ejercicio.completado

                                // Actualizacion optimista: refleja el cambio de inmediato
                                val listaOptimista = r.ejercicios.toMutableList()
                                listaOptimista[idx] = ejercicio.copy(completado = nuevoEstado)
                                val completadosOptimista = listaOptimista.count { it.completado }
                                val progresoOptimista = if (listaOptimista.isEmpty()) 0f
                                    else completadosOptimista.toFloat() / listaOptimista.size
                                rutinas[posicionRutina] = r.copy(ejercicios = listaOptimista, progreso = progresoOptimista)

                                scope.launch {
                                    try {
                                        RetrofitClient.apiService.marcarEjercicioCompletado(
                                            rutinaId = r.id,
                                            ejercicioId = ejercicio.ejercicioId,
                                            request = MarcarEjercicioRequest(completado = nuevoEstado)
                                        )
                                    } catch (_: Exception) {
                                        // Revertir si la llamada falla
                                        val listaRevertida = rutinas[posicionRutina].ejercicios.toMutableList()
                                        listaRevertida[idx] = ejercicio.copy(completado = !nuevoEstado)
                                        val completadosRevertido = listaRevertida.count { it.completado }
                                        val progresoRevertido = if (listaRevertida.isEmpty()) 0f
                                            else completadosRevertido.toFloat() / listaRevertida.size
                                        rutinas[posicionRutina] = rutinas[posicionRutina].copy(
                                            ejercicios = listaRevertida,
                                            progreso = progresoRevertido
                                        )
                                    }
                                }
                            },
                            onVolver = { subPantalla = "" }
                        )
```

- [ ] **Step 4: Agregar los imports necesarios**

Al inicio del archivo, junto a los imports de `com.example.spartangymapp.network.*` (alrededor de la línea 58-72), agregar:
```kotlin
import com.example.spartangymapp.network.MarcarEjercicioRequest
```

Y junto a los imports de `kotlinx.coroutines.*` (línea 81-83), agregar si no está ya:
```kotlin
import androidx.compose.runtime.rememberCoroutineScope
```
(Si `androidx.compose.runtime.*` ya está importado con wildcard en el archivo — confirmar en el Step 5 de compilación; si el wildcard ya cubre `rememberCoroutineScope`, este import explícito es redundante y se omite.)

- [ ] **Step 5: Compilar y correr los tests existentes (no deben romperse)**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd SpartanGymApp
.\gradlew.bat testDebugUnitTest
```
Expected: BUILD SUCCESSFUL (incluye `RotacionQrTest` de la rama `fix/qr-rotacion` si ya está mergeada, y `ExampleUnitTest`).

- [ ] **Step 6: Commit**

```bash
git add SpartanGymApp/app/src/main/java/com/example/spartangymapp/ui/screen/PantallaUsuario.kt
git commit -m "feat(app): persistir ejercicio completado en el backend y mostrar campos de cardio en el detalle"
```

---

### Task 18: Verificación end-to-end de la app (build completo + smoke manual)

**Files:** (ninguno — tarea de verificación)

- [ ] **Step 1: Compilar el módulo completo**

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd SpartanGymApp
.\gradlew.bat assembleDebug
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 2: Instalar el APK debug en un emulador/dispositivo y probar el flujo manual**

```powershell
.\gradlew.bat installDebug
```

1. Login como un socio de prueba con una rutina asignada que tenga al menos un ejercicio Cardio (crear una desde la web, Task 13, si no existe).
2. Entrar a "Rutina" → abrir el detalle: el anillo/barra de progreso debe reflejar el `progresoSemana` real devuelto por la API (no 0% fijo, salvo que efectivamente no haya nada completado esta semana).
3. El ejercicio Cardio debe mostrar su detalle en términos de duración/velocidad/inclinación/distancia, no "series/reps".
4. Tocar un ejercicio para marcarlo completado: el check debe aparecer de inmediato (optimista) y el anillo debe recalcularse.
5. Volver a la lista y reentrar al detalle (o recargar la pantalla): el estado de completado debe **persistir** (viene del backend, no se resetea).
6. Confirmar en la Task 12 (o con una nueva consulta `SELECT` a `ejercicios_completados`) que el registro quedó guardado con la fecha de hoy.
7. Desmarcar el mismo ejercicio: debe desaparecer el check y el registro debe borrarse de la BD.

- [ ] **Step 3: No hay commit en esta tarea (solo verificación).**

---

## Self-Review

**Cobertura del spec:**
- (A) Marcar completado + % real semanal → Tasks 1, 5, 7, 8, 9, 10, 11, 17. ✓
- (B) Campos alternativos por tipo (columnas fijas) → Tasks 1, 4, 6, 9, 10, 13, 17. ✓
- `dia_semana` reemplaza `dia_programado` en el flujo nuevo → Tasks 1, 4, 9, 10, 13. ✓
- Endpoint `POST completar` con validación de dueño → Tasks 7, 8, 12 (Step 8 smoke test). ✓
- Web: campos condicionales + progreso visible para staff → Tasks 13, 14. ✓
- App: progreso real + persistencia + detalle por tipo → Tasks 15, 16, 17, 18. ✓
- Fuera de alcance explícito (rachas, historial multi-semana, `PantallaEntrenador.kt`) → declarado en Global Constraints, no se crean tasks para ello. ✓

**Placeholders:** ninguno — cada step tiene código completo o comandos exactos con output esperado.

**Consistencia de tipos:** `ProgresoSemana(int planificados, int completados, double progreso, Set<Long> ejerciciosCompletadosIds)` se usa igual en `EjercicioCompletadoService`, `RutinaService`, `OperacionController`, `DashboardService`. `MarcarEjercicioRequest{Boolean completado, LocalDate fecha}` (API) ↔ `MarcarEjercicioRequest(Boolean completado, String? fecha)` (Kotlin, serializado por Gson) coinciden en forma JSON. `EjercicioSocio.ejercicioId: Long` coincide con `Ejercicio.id: Long` (API) y `EjercicioRutinaResponse.ejercicioId: Long?` (app).

**Orden de dependencias:** Fase 1 (API) debe completarse antes que Fase 2 y 3 (ambas consumen los campos nuevos de `GET /api/rutinas` y `GET /api/operacion/socio/{id}/rutinas`). Fase 2 y 3 son independientes entre sí y pueden ejecutarse en paralelo una vez terminada la Fase 1.
