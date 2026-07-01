package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class RutinaRequest {
    private UUID idSocio;
    private UUID idEntrenador;
    private Boolean esGlobal;
    private String nombre;
    private String tipoRutina;
    private String generoObjetivo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String objetivo;
    private String notas;
    private List<RutinaDetalleRequest> detalles;
}
