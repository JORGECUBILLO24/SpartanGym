package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nombres;
    private String apellidos;
    private String email;
    private String password;
    private String telefono;
}
