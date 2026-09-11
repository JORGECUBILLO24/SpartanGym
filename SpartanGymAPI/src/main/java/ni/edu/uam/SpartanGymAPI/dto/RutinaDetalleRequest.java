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
