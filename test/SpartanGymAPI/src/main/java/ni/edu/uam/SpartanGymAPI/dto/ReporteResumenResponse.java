package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReporteResumenResponse {
    private long totalSocios;
    private long membresiasActivas;
    private long asistenciasRegistradas;
    private BigDecimal ingresosTotales;
    private double tasaRetencion;
    private double margenNeto;
}
