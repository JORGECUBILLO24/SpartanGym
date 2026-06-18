package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PagoRepository extends JpaRepository<Pago, UUID> {

    @Query("select coalesce(sum(p.monto), 0) from Pago p")
    BigDecimal sumMontoTotal();

    List<Pago> findAllByOrderByFechaTransaccionDesc();

    List<Pago> findBySocioUsuarioIdOrderByFechaTransaccionDesc(UUID socioId);
}