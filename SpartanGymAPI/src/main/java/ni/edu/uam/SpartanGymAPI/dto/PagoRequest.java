package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PagoRequest {
    private UUID idSocio;
    private Integer idTipoMembresia;
    private String metodoPago; // "Efectivo", "Tarjeta", "Transferencia"
}