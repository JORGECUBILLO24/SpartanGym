package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductoCatalogoResponse {
    private UUID id;
    private String nombre;
    private String categoria;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    private UUID sucursalId;
    private String sucursal;
}
