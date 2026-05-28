package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;

@Data
public class CompraMembresiaRequest {
    private Integer tipoMembresiaId;
    private String metodoPago;
}
