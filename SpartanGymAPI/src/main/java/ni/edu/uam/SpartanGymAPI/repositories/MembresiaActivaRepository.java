package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.MembresiaActiva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembresiaActivaRepository extends JpaRepository<MembresiaActiva, UUID> {
    Optional<MembresiaActiva> findBySocioUsuarioId(UUID socioId);
}