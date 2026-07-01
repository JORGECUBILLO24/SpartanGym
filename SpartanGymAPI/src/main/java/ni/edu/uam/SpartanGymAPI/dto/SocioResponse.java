package ni.edu.uam.SpartanGymAPI.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocioResponse {
    private UUID id;
    private String nombres;
    private String apellidos;
    private String email;
    private String telefono;
    private UUID sucursalId;
    private String sucursal;
    private String estadoAcceso;
    private String tipoMembresia;
    private String estadoMembresia;
    private LocalDate fechaVencimiento;
}
