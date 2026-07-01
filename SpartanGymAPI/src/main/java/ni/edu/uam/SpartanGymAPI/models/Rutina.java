package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "rutinas")
public class Rutina {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @ManyToOne
    @JoinColumn(name = "entrenador_id", nullable = false)
    private Personal entrenador;

    @Column(name = "fecha_asignacion", updatable = false)
    private LocalDateTime fechaAsignacion = LocalDateTime.now();

    @Column(length = 140)
    private String nombre;

    @Column(name = "tipo_rutina", length = 40)
    private String tipoRutina = "General";

    @Column(name = "genero_objetivo", length = 20)
    private String generoObjetivo = "Todos";

    @Column(name = "es_global")
    private Boolean esGlobal = false;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(length = 180)
    private String objetivo;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @OneToMany(mappedBy = "rutina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RutinaDetalle> detalles = new ArrayList<>();
}
