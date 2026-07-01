package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReporteTablaResponse {
    private String titulo;
    private List<String> headers;
    private List<List<String>> rows;
}
