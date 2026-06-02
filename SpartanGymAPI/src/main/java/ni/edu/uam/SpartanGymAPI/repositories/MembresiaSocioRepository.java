package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembresiaSocioRepository extends JpaRepository<MembresiaSocio, UUID> {
    // Usamos SocioUsuarioId porque es la llave real del Socio
    Optional<MembresiaSocio> findBySocioUsuarioIdAndEstado(UUID socioId, String estado);
}