package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductoInventarioRequest {
    private String nombre;
    private String categoria;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    private UUID sucursalId;
}
