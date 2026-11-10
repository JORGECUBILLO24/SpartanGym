package ni.edu.uam.SpartanGymAPI.dto;

import lombok.Builder;
import lombok.Data;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Membresía de un socio sin exponer la entidad Socio/Usuario/Pago que la acompaña. */
@Data
@Builder
public class MembresiaSocioResponse {
    private UUID id;
    private UUID socioId;
    private Integer tipoMembresiaId;
    private String tipoMembresia;
    private BigDecimal precio;
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private String estado;

    public static MembresiaSocioResponse desde(MembresiaSocio membresia) {
        return MembresiaSocioResponse.builder()
                .id(membresia.getId())
                .socioId(membresia.getSocio().getUsuarioId())
                .tipoMembresiaId(membresia.getTipoMembresia().getId())
                .tipoMembresia(membresia.getTipoMembresia().getNombre())
                .precio(membresia.getTipoMembresia().getPrecio())
                .fechaInicio(membresia.getFechaInicio())
                .fechaVencimiento(membresia.getFechaVencimiento())
                .estado(membresia.getEstado())
                .build();
    }
}
