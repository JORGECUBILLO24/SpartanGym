package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class VentaProductoResponse {
    private UUID id;
    private String numeroFactura;
    private Boolean clienteEventual;
    private UUID socioId;
    private String socio;
    private UUID sucursalId;
    private String sucursal;
    private UUID vendedorId;
    private String vendedor;
    private String clienteNombre;
    private String clienteDocumento;
    private String metodoPago;
    private String monedaPago;
    private BigDecimal tipoCambio;
    private BigDecimal montoRecibido;
    private BigDecimal montoRecibidoConvertido;
    private BigDecimal cambio;
    private BigDecimal subtotal;
    private BigDecimal impuesto;
    private BigDecimal total;
    private String observaciones;
    private LocalDateTime fechaCreacion;
    private List<FacturaDetalleResponse> detalles;
}
