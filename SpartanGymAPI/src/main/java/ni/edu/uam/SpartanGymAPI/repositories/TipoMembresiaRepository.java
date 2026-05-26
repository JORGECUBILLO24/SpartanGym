package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoMembresiaRepository extends JpaRepository<TipoMembresia, Integer> {
    Optional<TipoMembresia> findbyNombre(String nombre);
}
