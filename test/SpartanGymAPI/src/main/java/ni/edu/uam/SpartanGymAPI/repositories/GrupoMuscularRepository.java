package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.GrupoMuscular;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GrupoMuscularRepository extends JpaRepository<GrupoMuscular, Integer> {
    Optional<GrupoMuscular> findByNombre(String nombre);
}
