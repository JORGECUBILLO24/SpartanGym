package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AsistenciaQrTokenResponse {
    private String token;
    private UUID sessionId;
    private UUID socioId;
    private String socio;
    private LocalDateTime generadoEn;
    private LocalDateTime expiraEn;
    private long ttlSegundos;
}
