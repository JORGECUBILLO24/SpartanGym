package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class RegisterPersonalRequest {
    private String email;
    private String password;
    private String nombres;
    private String apellidos;
    private String especialidad;
}
