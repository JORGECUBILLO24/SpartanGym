package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class MensajeGlobalRequest {
    private String tipo;
    private String titulo;
    private String mensaje;
}
