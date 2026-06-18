package ni.edu.uam.SpartanGymAPI.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "movimientos_financieros")
public class MovimientoFinanciero {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String concepto;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, length = 50)
    private String metodo;

    @Column(nullable = false, length = 80)
    private String categoria;

    @Column(nullable = false, length = 120)
    private String usuario;

    @Column(name = "fecha_transaccion", updatable = false)
    private LocalDateTime fechaTransaccion = LocalDateTime.now();
}
