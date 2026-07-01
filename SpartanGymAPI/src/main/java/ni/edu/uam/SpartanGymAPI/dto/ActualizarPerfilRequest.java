package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ActualizarPerfilRequest {
    private String nombres;
    private String apellidos;
    private String email;
    private String telefono;
    private String especialidad;
    private UUID sucursalId;
}
