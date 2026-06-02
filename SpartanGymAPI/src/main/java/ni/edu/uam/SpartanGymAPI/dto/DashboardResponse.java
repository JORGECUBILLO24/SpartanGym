package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DashboardResponse {
    // Datos del Perfil y Acceso
    private String nombreCompleto;
    private String estadoAcceso;
    private String tipoMembresia;
    private LocalDate fechaVencimiento;

    // Progreso Físico (El último registro)
    private Double ultimoPesoKg;
    private String notasMedidas;

    // Rutina Actual (La más reciente asignada)
    private String objetivoRutina;
    private String nombreEntrenador;
    private Integer totalEjercicios;
}