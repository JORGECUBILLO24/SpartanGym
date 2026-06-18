package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "socios")
public class Socio {

    @Id
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @OneToOne
    @MapsId // Le dice a Spring que comparta la misma llave primaria (UUID) con la tabla Usuario
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(length = 20)
    private String telefono;

    @Column(name = "estado_acceso", length = 20)
    private String estadoAcceso = "Activo";
}