package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PersonalResponse {
    private UUID id;
    private String nombres;
    private String apellidos;
    private String email;
    private String rol;
    private String especialidad;
    private Boolean activo;
}
