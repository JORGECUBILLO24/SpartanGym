package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembresiaSocioRepository extends JpaRepository<MembresiaSocio, UUID> {

    // Usamos SocioUsuarioId porque es la llave real del Socio (usado en BFF y Pagos)
    Optional<MembresiaSocio> findBySocioUsuarioIdAndEstado(UUID socioId, String estado);

    // NUEVO: Para el Cron Job (Busca las membresías activas cuya fecha ya expiró)
    List<MembresiaSocio> findByEstadoAndFechaVencimientoBefore(String estado, LocalDate fecha);
}