package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class RutinaDetalleRequest {
    private Long idEjercicio;
    private Integer series;
    private Integer repeticiones;
    private Double pesoSugeridoKg;
    private Integer tiempoDescansoSegundos;
}