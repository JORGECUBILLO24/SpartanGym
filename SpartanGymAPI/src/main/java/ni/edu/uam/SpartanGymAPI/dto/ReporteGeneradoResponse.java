package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReporteGeneradoResponse {
    private String id;
    private String titulo;
    private String tipo;
    private String formato;
    private String fecha;
    private String tamano;
    private List<String> headers;
    private List<List<String>> rows;
    private List<List<String>> summary;
    private List<ReporteTablaResponse> detalles;
}
