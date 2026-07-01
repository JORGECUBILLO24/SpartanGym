package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class VentaProductoRequest {
    private Boolean clienteEventual;
    private UUID socioId;
    private UUID sucursalId;
    private String clienteNombre;
    private String clienteDocumento;
    private String metodoPago;
    private String monedaPago;
    private String monedaVenta;
    private java.math.BigDecimal tipoCambio;
    private java.math.BigDecimal montoRecibido;
    private String observaciones;
    private List<VentaProductoDetalleRequest> detalles;
}
