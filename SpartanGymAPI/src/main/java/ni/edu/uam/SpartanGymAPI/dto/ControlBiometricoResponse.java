package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro de progreso. Los campos id, fechaRegistro, pesoKg y medidasNotas son los que
 * lee ControlBiometricoResponse en la app Android: no cambiarles el nombre.
 */
@Data
@Builder
public class ControlBiometricoResponse {
    private UUID id;
    private UUID socioId;
    private LocalDateTime fechaRegistro;
    private Double pesoKg;
    private String medidasNotas;

    public static ControlBiometricoResponse desde(ControlBiometrico control) {
        return ControlBiometricoResponse.builder()
                .id(control.getId())
                .socioId(control.getSocio().getUsuarioId())
                .fechaRegistro(control.getFechaRegistro())
                .pesoKg(control.getPesoKg())
                .medidasNotas(control.getMedidasNotas())
                .build();
    }
}
