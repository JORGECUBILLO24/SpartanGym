package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class RutinaRequest {
    private UUID idSocio;
    private UUID idEntrenador;
    private String objetivo;
    private List<RutinaDetalleRequest> detalles;
}