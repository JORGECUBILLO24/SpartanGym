package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "sucursales")
public class Sucursal {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 255)
    private String ubicacion;

    @Column(length = 25)
    private String telefono;

    @Column(nullable = false)
    private Integer capacidad;

    @Column(name = "horario_apertura", nullable = false, length = 20)
    private String horarioApertura;

    @Column(name = "horario_cierre", nullable = false, length = 20)
    private String horarioCierre;

    @Column(nullable = false, length = 30)
    private String estado = "Operativa";

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
