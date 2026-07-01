package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FacturaMembresiaResponse {
    private UUID id;
    private String numeroFactura;
    private UUID socioId;
    private String socio;
    private String tipoMembresia;
    private BigDecimal subtotal;
    private BigDecimal impuesto;
    private BigDecimal total;
    private String metodoPago;
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private LocalDateTime fechaTransaccion;
}
