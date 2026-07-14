package ni.edu.uam.SpartanGymAPI.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

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

    private Integer series;

    private Integer repeticiones;

    @Column(name = "tipo_ejercicio", length = 40)
    private String tipoEjercicio;

    @Column(name = "dia_programado")
    private LocalDate diaProgramado;

    // 1=Lunes .. 7=Domingo. Reemplaza a diaProgramado para el flujo de rutinas recurrentes.
    @Column(name = "dia_semana")
    private Integer diaSemana;

    @Column(name = "peso_sugerido_kg")
    private Double pesoSugeridoKg;

    // Campos alternativos para tipos no-Fuerza (Cardio, Movilidad, etc.)
    @Column(name = "velocidad_nivel")
    private Double velocidadNivel;

    @Column(name = "inclinacion")
    private Double inclinacion;

    @Column(name = "duracion_segundos")
    private Integer duracionSegundos;

    @Column(name = "distancia_metros")
    private Double distanciaMetros;

    @Column(name = "tiempo_descanso_segundos")
    private Integer tiempoDescansoSegundos;

    @Column(length = 255)
    private String notas;

    @Column
    private Integer orden;
}
