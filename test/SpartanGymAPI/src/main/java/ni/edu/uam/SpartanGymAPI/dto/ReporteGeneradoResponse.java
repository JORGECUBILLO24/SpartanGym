package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReporteGeneradoResponse {
    private String id;
    private String titulo;
    private String tipo;
    private String formato;
    private String fecha;
    private String tamano;
}
