package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "tipos_membresia")
public class TipoMembresia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String nombre;

    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;
}
