package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AsistenciaQrValidationResponse {
    private UUID id;
    private UUID sessionId;
    private UUID socioId;
    private String socio;
    private String membresia;
    private String tipoMembresia;
    private String estadoAcceso;
    private LocalDate fechaVencimiento;
    private String estado;
    private LocalDateTime fechaHora;
    private String mensaje;
}
