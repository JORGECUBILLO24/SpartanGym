package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.util.List;

@Data
public class RutinaRequest {
    private String nombre;
    private String descripcion;
    private String nivel;
    private Long idEntrenador;
    private List<RutinaDetalleRequest> detalles;
}