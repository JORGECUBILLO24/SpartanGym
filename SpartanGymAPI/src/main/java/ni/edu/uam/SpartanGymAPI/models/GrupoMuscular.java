package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "grupos_musculares")
public class GrupoMuscular {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String nombre;
}
