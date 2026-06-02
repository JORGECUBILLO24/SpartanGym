package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ControlBiometricoRepository extends JpaRepository<ControlBiometrico, UUID> {
    // Magia de Spring Boot: Busca por socio y los ordena de más antiguo a más reciente
    List<ControlBiometrico> findBySocioIdOrderByFechaRegistroAsc(UUID socioId);
}