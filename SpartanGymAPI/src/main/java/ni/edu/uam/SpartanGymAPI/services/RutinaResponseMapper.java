package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.RutinaDetalle;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

// Serializa una Rutina + su progreso semanal a la forma de respuesta que
// comparten el listado de admin (RutinaService) y el endpoint que consume
// la app (OperacionController) — un unico lugar para esta forma, no dos.
@Component
public class RutinaResponseMapper {

    public Map<String, Object> mapear(Rutina rutina, ProgresoSemana progresoSemana) {
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
                .map(detalle -> mapearEjercicio(detalle, progresoSemana))
                .toList());
        return data;
    }

    private Map<String, Object> mapearEjercicio(RutinaDetalle detalle, ProgresoSemana progresoSemana) {
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
    }
}
