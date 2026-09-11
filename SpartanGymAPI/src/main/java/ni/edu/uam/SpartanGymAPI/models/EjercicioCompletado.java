package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ejercicios_completados")
public class EjercicioCompletado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rutina_id", nullable = false)
    private UUID rutinaId;

    @Column(name = "ejercicio_id", nullable = false)
    private Long ejercicioId;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(name = "completado_en", updatable = false)
    private LocalDateTime completadoEn = LocalDateTime.now();
}
