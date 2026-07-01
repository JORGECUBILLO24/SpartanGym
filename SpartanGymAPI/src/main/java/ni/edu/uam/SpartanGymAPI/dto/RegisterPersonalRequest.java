package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class RegisterPersonalRequest {
    private String email;
    private String password;
    private String nombres;
    private String apellidos;
    private String telefono;
    private String rol;
    private String especialidad;
    private UUID sucursalId;
}
