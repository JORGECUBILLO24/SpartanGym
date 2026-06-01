package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class RutinaRequest {
    private String nombre;
    private String descripcion;
    private String nivel;
    private UUID idEntrenador; // <-- Cambiado de Long a UUID
    private List<RutinaDetalleRequest> detalles;
}