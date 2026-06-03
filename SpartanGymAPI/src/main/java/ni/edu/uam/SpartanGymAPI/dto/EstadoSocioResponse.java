package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EstadoSocioResponse {
    private String nombres;
    private String apellidos;
    private String estadoAcceso; // "Activo", "Inactivo", "Suspendido"
    private boolean tieneMembresiaActiva;
    private String tipoMembresia;
    private LocalDate fechaVencimiento;
}