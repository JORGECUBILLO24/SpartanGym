package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TipoMembresiaRequest {
    private String nombre;
    private Integer duracionDias;
    private BigDecimal precio;
}
