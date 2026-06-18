package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MovimientoFinancieroRequest {
    private String concepto;
    private BigDecimal monto;
    private String tipo;
    private String metodo;
    private String categoria;
}
