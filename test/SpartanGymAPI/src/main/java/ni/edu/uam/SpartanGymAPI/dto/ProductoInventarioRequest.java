package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoInventarioRequest {
    private String nombre;
    private String categoria;
    private BigDecimal precio;
    private Integer stock;
}
