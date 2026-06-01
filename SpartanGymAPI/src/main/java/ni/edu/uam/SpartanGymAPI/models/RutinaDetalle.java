package ni.edu.uam.SpartanGymAPI.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "detalle_rutinas")
@IdClass(RutinaDetalleId.class)
public class RutinaDetalle {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_id", nullable = false)
    @JsonIgnore
    private Rutina rutina;

    @Id
    @ManyToOne
    @JoinColumn(name = "ejercicio_id", nullable = false)
    private Ejercicio ejercicio;

    @Column(nullable = false)
    private Integer series;

    @Column(nullable = false)
    private Integer repeticiones;

    @Column(name = "peso_sugerido_kg")
    private Double pesoSugeridoKg;

    @Column(name = "tiempo_descanso_segundos")
    private Integer tiempoDescansoSegundos;
}