package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "controles_biometricos")
public class ControlBiometrico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(name = "peso_kg", nullable = false)
    private Double pesoKg;

    @Column(name = "medidas_notas", columnDefinition = "TEXT")
    private String medidasNotas;
}