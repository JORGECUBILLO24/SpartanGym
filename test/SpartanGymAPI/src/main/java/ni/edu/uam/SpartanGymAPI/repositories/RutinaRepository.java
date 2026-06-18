package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Rutina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RutinaRepository extends JpaRepository<Rutina, UUID> {
    List<Rutina> findBySocioUsuarioIdOrderByFechaAsignacionDesc(UUID socioId);

    List<Rutina> findByEntrenadorUsuarioIdOrderByFechaAsignacionDesc(UUID entrenadorId);
}