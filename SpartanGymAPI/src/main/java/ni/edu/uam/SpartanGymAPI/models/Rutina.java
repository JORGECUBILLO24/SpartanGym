package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "rutinas")
public class Rutina {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre; // Ej: "Hipertrofia Semanal"

    @Column(length = 255)
    private String descripcion;

    @Column(length = 50)
    private String nivel; // Principiante, Intermedio, Avanzado

    @ManyToOne
    @JoinColumn(name = "id_personal", nullable = false)
    private Personal entrenador;

    @OneToMany(mappedBy = "rutina", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RutinaDetalle> detalles = new ArrayList<>();
}