package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class VentaProductoDetalleRequest {
    private UUID productoId;
    private Integer cantidad;
}
