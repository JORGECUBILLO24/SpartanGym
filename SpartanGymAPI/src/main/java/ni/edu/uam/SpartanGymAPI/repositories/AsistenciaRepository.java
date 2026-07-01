package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AsistenciaRepository extends JpaRepository<Asistencia, UUID> {
    List<Asistencia> findBySocioUsuarioIdOrderByFechaHoraDesc(UUID socioId);

    boolean existsByQrTokenHash(String qrTokenHash);

    Optional<Asistencia> findByQrTokenHash(String qrTokenHash);
}
