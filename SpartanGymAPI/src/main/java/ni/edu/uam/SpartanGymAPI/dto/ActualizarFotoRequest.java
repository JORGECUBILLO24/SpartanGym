package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class ActualizarFotoRequest {
    private String fotoUrl; // null o "" = quitar la foto
}
